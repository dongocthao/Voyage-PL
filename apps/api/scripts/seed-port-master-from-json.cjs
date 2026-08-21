const fs = require("fs");
const path = require("path");
const { PrismaClient, port_status_type } = require("@prisma/client");

const prisma = new PrismaClient();

const PORT_TYPE_DEFINITIONS = [
  { code: "STANDARD_PORT", name: "Standard Port" },
  { code: "TERMINAL", name: "Terminal" },
];

function cleanString(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function cleanNumber(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCountryCode(value) {
  const code = cleanString(value);
  return code ? code.toUpperCase() : null;
}

function countryNameFromCode(code) {
  if (!code) return null;
  try {
    const display = new Intl.DisplayNames(["en"], { type: "region" });
    return display.of(code) ?? code;
  } catch {
    return code;
  }
}

function parseUtcOffset(timeZoneCode) {
  const text = cleanString(timeZoneCode);
  if (!text) {
    return { minutes: null, hours: null };
  }

  const match = text.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) {
    return { minutes: null, hours: null };
  }

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  const totalMinutes = sign * (hours * 60 + minutes);
  const decimalHours = totalMinutes / 60;
  return { minutes: totalMinutes, hours: decimalHours };
}

function coordinateText(position) {
  const degrees = cleanNumber(position?.degrees);
  const minutes = cleanNumber(position?.minutes);
  const indicator = cleanString(position?.indicator)?.toUpperCase();

  if (degrees == null && minutes == null && !indicator) {
    return null;
  }

  return `${degrees ?? 0} ${minutes ?? 0} ${indicator ?? ""}`.trim();
}

function toStatus(value) {
  return cleanString(value)?.toLowerCase() === "inactive"
    ? port_status_type.INACTIVE
    : port_status_type.ACTIVE;
}

function buildRecord(row, countryIdByCode, portTypeIdByName) {
  const portName = cleanString(row.port_name);
  if (!portName) {
    throw new Error("Seed row is missing port_name.");
  }

  const countryCode = normalizeCountryCode(row.country);
  const countryName = countryNameFromCode(countryCode);
  const timeZoneCode = cleanString(row.time_zone);
  const { minutes: utcOffsetMin, hours: stdGmtOffset } = parseUtcOffset(timeZoneCode);
  const latitudeDecimal = cleanNumber(row.position?.latitude?.decimal);
  const longitudeDecimal = cleanNumber(row.position?.longitude?.decimal);
  const portTypeName = cleanString(row.port_type);

  return {
    port_name: portName,
    country_id: countryCode ? countryIdByCode.get(countryCode) ?? null : null,
    country_name: countryName,
    unlocode: cleanString(row.un_locode),
    utc_offset_min: utcOffsetMin,
    latitude: latitudeDecimal,
    longitude: longitudeDecimal,
    latitude_text: coordinateText(row.position?.latitude),
    longitude_text: coordinateText(row.position?.longitude),
    port_type_name: portTypeName,
    port_type_id: portTypeName ? portTypeIdByName.get(portTypeName) ?? null : null,
    time_zone_code: timeZoneCode,
    std_gmt_offset: stdGmtOffset,
    dst_gmt_offset: row.daylight_saving_time ? stdGmtOffset : null,
    port_status: toStatus(row.status),
    is_canal: false,
    updated_at: new Date(),
  };
}

async function ensureCountries(countryCodes) {
  for (const code of countryCodes) {
    if (!code) continue;
    const name = countryNameFromCode(code);
    await prisma.countries.upsert({
      where: { iso_code: code },
      update: { name },
      create: { iso_code: code, name },
    });
  }

  const rows = await prisma.countries.findMany({
    where: { iso_code: { in: countryCodes.filter(Boolean) } },
  });
  return new Map(rows.map((row) => [row.iso_code.trim(), row.id]));
}

async function ensurePortTypes() {
  for (const item of PORT_TYPE_DEFINITIONS) {
    await prisma.port_types.upsert({
      where: { code: item.code },
      update: { name: item.name },
      create: item,
    });
  }

  const rows = await prisma.port_types.findMany({
    where: { code: { in: PORT_TYPE_DEFINITIONS.map((item) => item.code) } },
  });

  const byName = new Map(rows.map((row) => [row.name, row.id]));
  if (!byName.has("Sea Port")) {
    const seaPort = await prisma.port_types.findFirst({ where: { name: "Sea Port" } });
    if (seaPort) {
      byName.set("Sea Port", seaPort.id);
    }
  }
  return byName;
}

async function upsertPort(record) {
  const existing = record.unlocode
    ? await prisma.ports.findFirst({ where: { unlocode: record.unlocode } })
    : await prisma.ports.findFirst({
        where: {
          port_name: record.port_name,
          country_name: record.country_name,
        },
      });

  if (existing) {
    await prisma.ports.update({
      where: { id: existing.id },
      data: record,
    });
    return "updated";
  }

  await prisma.ports.create({ data: record });
  return "created";
}

async function main() {
  const inputArg = process.argv[2];
  if (!inputArg) {
    throw new Error("Usage: node seed-port-master-from-json.cjs <json-path>");
  }

  const inputPath = path.resolve(inputArg);
  const raw = fs.readFileSync(inputPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Expected the JSON file to contain an array.");
  }

  const countryCodes = [...new Set(parsed.map((row) => normalizeCountryCode(row.country)).filter(Boolean))];
  const countryIdByCode = await ensureCountries(countryCodes);
  const portTypeIdByName = await ensurePortTypes();

  let created = 0;
  let updated = 0;
  for (const row of parsed) {
    const record = buildRecord(row, countryIdByCode, portTypeIdByName);
    const action = await upsertPort(record);
    if (action === "created") {
      created += 1;
    } else {
      updated += 1;
    }
  }

  const portCount = await prisma.ports.count();
  const countryCount = await prisma.countries.count();
  console.log(
    JSON.stringify(
      {
        source: inputPath,
        processed: parsed.length,
        created,
        updated,
        portCount,
        countryCount,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
