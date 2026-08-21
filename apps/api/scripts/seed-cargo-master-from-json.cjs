const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const FT3_PER_CBM = 35.3147;

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

function round4(value) {
  return value == null ? null : Number(value.toFixed(4));
}

function toCbmPerMt(ft3PerMt) {
  if (ft3PerMt == null) return null;
  return round4(ft3PerMt / FT3_PER_CBM);
}

function buildRecord(row) {
  const fullName = cleanString(row.full_name);
  if (!fullName) {
    throw new Error("Seed row is missing full_name.");
  }

  const shortName = cleanString(row.short_name);
  const stowFt3 = cleanNumber(row.stow_factor);

  return {
    code: shortName,
    cargo_name: fullName,
    cargo_group: cleanString(row.cargo_group),
    cargo_class: cleanString(row.cargo_class),
    imo_name: cleanString(row.imo_name),
    ibc_code: cleanString(row.ibc_code),
    imsbc_code: cleanString(row.imsbc_code),
    bill_by: null,
    default_unit: cleanString(row.default_cp_unit) || "MT",
    stowage_factor: toCbmPerMt(stowFt3),
    stowage_factor_ft3: stowFt3,
    stowage_factor_unit: "CBM/MT",
    un_number: cleanString(row.un_number),
    hazard_class: cleanString(row.class),
    product_code: null,
    capacity_basis: cleanString(row.capacity_basis),
    description: cleanString(row.description),
    preclearance_us_canada: false,
    is_dangerous: false,
    special_handling_required: false,
    is_active: true,
    updated_at: new Date(),
  };
}

async function releaseConflictingCodes(records) {
  const desiredCodes = [...new Set(records.map((row) => row.code).filter(Boolean))];
  if (desiredCodes.length === 0) return 0;

  const existing = await prisma.cargoes.findMany({
    where: { code: { in: desiredCodes } },
    select: { id: true, code: true, cargo_name: true },
  });

  const wantedByCode = new Map(records.filter((row) => row.code).map((row) => [row.code, row.cargo_name]));
  const toRelease = existing.filter((row) => wantedByCode.get(row.code) !== row.cargo_name);

  for (const row of toRelease) {
    await prisma.cargoes.update({
      where: { id: row.id },
      data: { code: null, updated_at: new Date() },
    });
  }

  return toRelease.length;
}

async function main() {
  const inputArg = process.argv[2];
  if (!inputArg) {
    throw new Error("Usage: node seed-cargo-master-from-json.cjs <json-path>");
  }

  const inputPath = path.resolve(inputArg);
  const raw = fs.readFileSync(inputPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Expected the JSON file to contain an array.");
  }

  const records = parsed.map(buildRecord);
  const releasedCodeCount = await releaseConflictingCodes(records);

  let insertedOrUpdated = 0;
  for (const record of records) {
    await prisma.cargoes.upsert({
      where: { cargo_name: record.cargo_name },
      update: record,
      create: record,
    });
    insertedOrUpdated += 1;
  }

  const cargoCount = await prisma.cargoes.count();
  console.log(
    JSON.stringify(
      {
        source: inputPath,
        processed: records.length,
        insertedOrUpdated,
        releasedCodeCount,
        cargoCount,
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
