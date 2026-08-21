import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, contact_channel_type } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { UpsertSystemOptionsDto } from './dto/app-settings.dto';
import { UpsertCargoMasterDto } from './dto/cargo-master.dto';
import { UpsertCompanyMasterDto } from './dto/company-master.dto';
import { UpsertPortMasterDto } from './dto/port-master.dto';
import {
  UpsertVesselMasterDto,
  VesselBunkerProfileDto,
} from './dto/vessel-master.dto';

const TAKE = 30;
const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;
const SYSTEM_OPTIONS_SCOPE = 'SYSTEM';
const DEFAULT_SYSTEM_OPTIONS = {
  decimalPlace: 2,
  voyageSheetsInNewWorkbook: 2,
  cargoReletSheetsInNewWorkbook: 1,
  timeCharterSheetsInNewWorkbook: 1,
  autoMilestone: true,
  timeType: 'Days',
  defaultTimeZoneType: 'Port local time',
  defaultVesselSpeed: 13,
  normalMainFuel: 'VLSFO',
  normalSubFuel: 'MGO',
  ecaMainFuel: 'ULSFO',
  ecaSubFuel: 'MGO',
  weatherFactorType: 'Distance',
  defaultWeatherFactor: 0,
  applyEuEtsToSheet: true,
  defaultMainCurrency: 'USD',
};

function toBigIntId(value: string, name = 'id') {
  try {
    return BigInt(value);
  } catch {
    throw new BadRequestException(`Invalid ${name}`);
  }
}

function asRecord(value: Prisma.JsonValue | undefined) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function sanitizeSystemOptions(value: Record<string, unknown>) {
  return {
    ...DEFAULT_SYSTEM_OPTIONS,
    decimalPlace: clampInt(value.decimalPlace, 0, 6, DEFAULT_SYSTEM_OPTIONS.decimalPlace),
    voyageSheetsInNewWorkbook: clampInt(
      value.voyageSheetsInNewWorkbook,
      1,
      99,
      DEFAULT_SYSTEM_OPTIONS.voyageSheetsInNewWorkbook,
    ),
    cargoReletSheetsInNewWorkbook: clampInt(
      value.cargoReletSheetsInNewWorkbook,
      1,
      99,
      DEFAULT_SYSTEM_OPTIONS.cargoReletSheetsInNewWorkbook,
    ),
    timeCharterSheetsInNewWorkbook: clampInt(
      value.timeCharterSheetsInNewWorkbook,
      1,
      99,
      DEFAULT_SYSTEM_OPTIONS.timeCharterSheetsInNewWorkbook,
    ),
    autoMilestone: Boolean(value.autoMilestone),
    timeType: oneOf(value.timeType, ['Days', 'Hours'], DEFAULT_SYSTEM_OPTIONS.timeType),
    defaultTimeZoneType: oneOf(
      value.defaultTimeZoneType,
      ['Port local time', 'GMT', 'Ship time'],
      DEFAULT_SYSTEM_OPTIONS.defaultTimeZoneType,
    ),
    defaultVesselSpeed: clampNumber(
      value.defaultVesselSpeed,
      0,
      99,
      DEFAULT_SYSTEM_OPTIONS.defaultVesselSpeed,
    ),
    normalMainFuel: oneOf(value.normalMainFuel, ['VLSFO', 'HSFO', 'ULSFO'], DEFAULT_SYSTEM_OPTIONS.normalMainFuel),
    normalSubFuel: oneOf(value.normalSubFuel, ['MGO', 'MDO'], DEFAULT_SYSTEM_OPTIONS.normalSubFuel),
    ecaMainFuel: oneOf(value.ecaMainFuel, ['ULSFO', 'VLSFO'], DEFAULT_SYSTEM_OPTIONS.ecaMainFuel),
    ecaSubFuel: oneOf(value.ecaSubFuel, ['MGO', 'MDO'], DEFAULT_SYSTEM_OPTIONS.ecaSubFuel),
    weatherFactorType: oneOf(
      value.weatherFactorType,
      ['Distance', 'Speed', 'Time'],
      DEFAULT_SYSTEM_OPTIONS.weatherFactorType,
    ),
    defaultWeatherFactor: clampNumber(
      value.defaultWeatherFactor,
      0,
      100,
      DEFAULT_SYSTEM_OPTIONS.defaultWeatherFactor,
    ),
    applyEuEtsToSheet: Boolean(value.applyEuEtsToSheet),
    defaultMainCurrency: 'USD',
  };
}

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  return Math.round(clampNumber(value, min, max, fallback));
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function oneOf<T extends string>(value: unknown, allowed: T[], fallback: T) {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function nullableString(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function nullableNumber(value?: number | null) {
  return value === undefined || value === null || Number.isNaN(value)
    ? null
    : value;
}

function dateFromInput(value: string, name: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`Invalid ${name}`);
  }
  return date;
}

@Injectable()
export class MasterDataService {
  private readonly catalogCache = new Map<string, { expiresAt: number; value: unknown }>();

  constructor(private readonly prisma: PrismaService) {}

  private async getCachedCatalog<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const cached = this.catalogCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    const value = await loader();
    this.catalogCache.set(key, { expiresAt: Date.now() + CATALOG_CACHE_TTL_MS, value });
    return value;
  }

  async systemOptions() {
    const row = await this.prisma.app_settings.findUnique({
      where: { scope: SYSTEM_OPTIONS_SCOPE },
    });

    return {
      scope: SYSTEM_OPTIONS_SCOPE,
      settings: {
        ...DEFAULT_SYSTEM_OPTIONS,
        ...asRecord(row?.settings),
        defaultMainCurrency: 'USD',
      },
      updatedAt: row?.updated_at.toISOString() ?? null,
      updatedBy: row?.updated_by?.toString() ?? null,
    };
  }

  async saveSystemOptions(body: UpsertSystemOptionsDto) {
    const settings = sanitizeSystemOptions(body.settings);
    const row = await this.prisma.app_settings.upsert({
      where: { scope: SYSTEM_OPTIONS_SCOPE },
      create: {
        scope: SYSTEM_OPTIONS_SCOPE,
        settings,
      },
      update: {
        settings,
        updated_at: new Date(),
      },
    });

    return {
      scope: row.scope,
      settings,
      updatedAt: row.updated_at.toISOString(),
      updatedBy: row.updated_by?.toString() ?? null,
    };
  }

  async cargoes(query?: string) {
    const rows = await this.prisma.cargoes.findMany({
      where: {
        is_active: true,
        ...(query
          ? {
              OR: [
                { cargo_name: { contains: query, mode: 'insensitive' } },
                { code: { contains: query, mode: 'insensitive' } },
                { cargo_group: { contains: query, mode: 'insensitive' } },
                { cargo_class: { contains: query, mode: 'insensitive' } },
                { un_number: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { cargo_name: 'asc' },
    });

    return rows.map((row) => ({
      id: row.id.toString(),
      code: row.code,
      name: row.cargo_name,
      cargoGroup: row.cargo_group,
      cargoClass: row.cargo_class,
      unNumber: row.un_number,
      defaultUnit: row.default_unit,
      stowageFactor: row.stowage_factor?.toNumber(),
      stowageFactorUnit: row.stowage_factor_unit,
      lastUpdated: row.updated_at.toISOString(),
      isActive: row.is_active,
    }));
  }

  async cargo(id: string) {
    const row = await this.prisma.cargoes.findUnique({
      where: { id: toBigIntId(id) },
    });

    if (!row) {
      throw new NotFoundException('Cargo not found');
    }

    return this.mapCargo(row);
  }

  async createCargo(body: UpsertCargoMasterDto) {
    const created = await this.prisma.cargoes.create({
      data: this.cargoData(body),
    });
    return this.mapCargo(created);
  }

  async updateCargo(id: string, body: UpsertCargoMasterDto) {
    const cargoId = toBigIntId(id);
    const existing = await this.prisma.cargoes.findUnique({ where: { id: cargoId } });
    if (!existing) {
      throw new NotFoundException('Cargo not found');
    }

    const updated = await this.prisma.cargoes.update({
      where: { id: cargoId },
      data: this.cargoData(body),
    });
    return this.mapCargo(updated);
  }

  async ports(query?: string) {
    const rows = await this.prisma.ports.findMany({
      where: query
        ? {
            OR: [
              { port_name: { contains: query, mode: 'insensitive' } },
              { country_name: { contains: query, mode: 'insensitive' } },
              { port_type_name: { contains: query, mode: 'insensitive' } },
              { time_zone_code: { contains: query, mode: 'insensitive' } },
              { unlocode: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { port_name: 'asc' },
      include: { countries: true, port_types: true },
    });

    return rows.map((row) => ({
      id: row.id.toString(),
      name: row.port_name,
      country: row.country_name ?? row.countries?.name,
      unlocode: row.unlocode,
      timeZoneCode: row.time_zone_code,
      portType: row.port_type_name ?? row.port_types?.name,
      status: row.port_status === 'ACTIVE' ? 'Open' : 'Inactive',
      latitude: row.latitude?.toNumber(),
      longitude: row.longitude?.toNumber(),
      utcOffsetMin: row.utc_offset_min,
      isCanal: row.is_canal,
      lastUpdated: row.updated_at.toISOString(),
      isActive: row.port_status === 'ACTIVE',
    }));
  }

  async countries(query?: string) {
    const rows = await this.prisma.countries.findMany({
      where: query
        ? {
            OR: [
              { iso_code: { contains: query.toUpperCase(), mode: 'insensitive' } },
              { name: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: [{ name: 'asc' }],
      take: TAKE,
    });

    return rows.map((row) => ({
      id: row.id,
      code: row.iso_code.trim(),
      name: row.name,
    }));
  }

  async portTypes(query?: string) {
    const rows = await this.prisma.port_types.findMany({
      where: query
        ? {
            OR: [
              { code: { contains: query, mode: 'insensitive' } },
              { name: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: [{ name: 'asc' }],
      take: TAKE,
    });

    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
    }));
  }

  async port(id: string) {
    const row = await this.prisma.ports.findUnique({
      where: { id: toBigIntId(id) },
      include: { countries: true, port_types: true },
    });

    if (!row) {
      throw new NotFoundException('Port not found');
    }

    return this.mapPort(row);
  }

  async createPort(body: UpsertPortMasterDto) {
    const created = await this.prisma.ports.create({
      data: this.portData(body),
      include: { countries: true, port_types: true },
    });
    return this.mapPort(created);
  }

  async updatePort(id: string, body: UpsertPortMasterDto) {
    const portId = toBigIntId(id);
    const existing = await this.prisma.ports.findUnique({ where: { id: portId } });
    if (!existing) {
      throw new NotFoundException('Port not found');
    }

    const updated = await this.prisma.ports.update({
      where: { id: portId },
      data: this.portData(body),
      include: { countries: true, port_types: true },
    });
    return this.mapPort(updated);
  }

  async companies(query?: string) {
    const rows = await this.prisma.companies.findMany({
      where: query
        ? { company_name: { contains: query, mode: 'insensitive' } }
        : undefined,
      orderBy: { company_name: 'asc' },
      take: TAKE,
    });

    return rows.map((row) => ({
      id: row.id.toString(),
      name: row.company_name,
      country: row.country_name,
      businessType: row.business_type_name,
    }));
  }

  async company(id: string) {
    const row = await this.prisma.companies.findUnique({
      where: { id: toBigIntId(id) },
      include: this.companyInclude(),
    });

    if (!row) {
      throw new NotFoundException('Company not found');
    }

    return this.mapCompany(row);
  }

  async createCompany(body: UpsertCompanyMasterDto) {
    const companyId = await this.prisma.$transaction(async (tx) => {
      const created = await tx.companies.create({
        data: this.companyData(body),
      });
      await this.replaceCompanyChildren(tx, created.id, body);
      return created.id;
    });

    return this.company(companyId.toString());
  }

  async updateCompany(id: string, body: UpsertCompanyMasterDto) {
    const companyId = toBigIntId(id);

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.companies.findUnique({ where: { id: companyId } });
      if (!existing) {
        throw new NotFoundException('Company not found');
      }

      await tx.companies.update({
        where: { id: companyId },
        data: this.companyData(body),
      });
      await this.replaceCompanyChildren(tx, companyId, body);
    });

    return this.company(companyId.toString());
  }

  async cpTerms(query?: string) {
    const rows = await this.prisma.cp_terms.findMany({
      where: query
        ? {
            OR: [
              { code: { contains: query, mode: 'insensitive' } },
              { term: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { code: 'asc' },
      take: TAKE,
    });

    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      term: row.term,
    }));
  }

  async laytimeTerms(query?: string) {
    const rows = await this.prisma.laytime_terms.findMany({
      where: query
        ? {
            OR: [
              { code: { contains: query, mode: 'insensitive' } },
              { term: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { code: 'asc' },
      take: TAKE,
    });

    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      term: row.term,
      factor: row.factor.toNumber(),
    }));
  }

  async fuelCategories(query?: string) {
    const key = `fuel-categories:${query ?? ''}`;
    return this.getCachedCatalog(key, async () => {
      const rows = await this.prisma.fuel_categories.findMany({
        where: {
          is_active: true,
          ...(query
            ? {
                OR: [
                  { code: { contains: query, mode: 'insensitive' } },
                  { name: { contains: query, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: { name: 'asc' },
        take: TAKE,
      });

      return rows.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
      }));
    });
  }

  async fuelTypes({
    query,
    categoryId,
    ecaOnly,
  }: {
    query?: string;
    categoryId?: string;
    ecaOnly?: boolean;
  } = {}) {
    const key = `fuel-types:${query ?? ''}:${categoryId ?? ''}:${ecaOnly ? 'eca' : 'all'}`;
    return this.getCachedCatalog(key, async () => {
      const rows = await this.prisma.fuel_types.findMany({
        where: {
          is_active: true,
          ...(categoryId ? { fuel_category_id: Number(categoryId) } : {}),
          ...(ecaOnly ? { is_eca_compliant: true } : {}),
          ...(query
            ? {
                OR: [
                  { code: { contains: query, mode: 'insensitive' } },
                  { fuel_type_name: { contains: query, mode: 'insensitive' } },
                  { description: { contains: query, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: [{ fuel_category_id: 'asc' }, { code: 'asc' }],
        take: TAKE,
        include: { fuel_categories: true },
      });

      return rows.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.fuel_type_name ?? row.description ?? row.code,
        fuelTypeName: row.fuel_type_name ?? row.description ?? row.code,
        description: row.description,
        categoryId: row.fuel_category_id,
        categoryCode: row.fuel_categories?.code,
        categoryName: row.fuel_categories?.name,
        isoStandard: row.iso_standard,
        maxSulphurPercent: row.max_sulphur_percent?.toNumber() ?? null,
        carbonFactor: row.carbon_factor?.toNumber() ?? null,
        defaultDensity: row.default_density?.toNumber() ?? null,
        isEcaCompliant: row.is_eca_compliant,
      }));
    });
  }

  async vesselKinds(query?: string) {
    const key = `vessel-kinds:${query ?? ''}`;
    return this.getCachedCatalog(key, async () => {
      const rows = await this.prisma.vessel_kinds.findMany({
        where: {
          is_active: true,
          ...(query
            ? {
                OR: [
                  { code: { contains: query, mode: 'insensitive' } },
                  { name: { contains: query, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: { name: 'asc' },
        take: TAKE,
      });

      return rows.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
      }));
    });
  }

  async vesselTypes({
    query,
    kindId,
  }: {
    query?: string;
    kindId?: string;
  } = {}) {
    const key = `vessel-types:${query ?? ''}:${kindId ?? ''}`;
    return this.getCachedCatalog(key, async () => {
      const rows = await this.prisma.vessel_types.findMany({
        where: {
          is_active: true,
          ...(kindId ? { vessel_kind_id: Number(kindId) } : {}),
          ...(query
            ? {
                OR: [
                  { code: { contains: query, mode: 'insensitive' } },
                  { type_name: { contains: query, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: [{ dwt_min_range: 'asc' }, { type_name: 'asc' }],
        take: TAKE,
        include: { vessel_kinds: true },
      });

      return rows.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.type_name,
        typeName: row.type_name,
        kindId: row.vessel_kind_id,
        kindCode: row.vessel_kinds?.code,
        kindName: row.vessel_kinds?.name,
        dwtMinRange: row.dwt_min_range?.toNumber() ?? null,
        dwtMaxRange: row.dwt_max_range?.toNumber() ?? null,
        description: row.description,
      }));
    });
  }

  async expenseCategories(query?: string) {
    const rows = await this.prisma.expense_categories.findMany({
      where: query
        ? {
            OR: [
              { code: { contains: query, mode: 'insensitive' } },
              { name: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: [{ flow: 'asc' }, { code: 'asc' }],
      take: TAKE,
    });

    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      flow: row.flow,
    }));
  }

  async vessels(query?: string) {
    const rows = await this.prisma.vessels.findMany({
      where: {
        is_active: true,
        ...(query ? { mv_name: { contains: query, mode: 'insensitive' } } : {}),
      },
      orderBy: { mv_name: 'asc' },
      take: TAKE,
      include: { vessel_kinds: true, vessel_types: true },
    });

    return rows.map((row) => ({
      id: row.id.toString(),
      code: row.vessel_code,
      name: row.mv_name,
      dwt: row.dwt?.toNumber(),
      draftM: row.draft_m?.toNumber(),
      tpc: row.tpc?.toNumber(),
      builtYear: row.built_year,
      vesselKind: row.vessel_kinds?.name,
      vesselType: row.vessel_types?.type_name,
    }));
  }

  async vessel(id: string) {
    const row = await this.prisma.vessels.findUnique({
      where: { id: toBigIntId(id) },
      include: {
        vessel_gears: { orderBy: { id: 'asc' } },
        vessel_bunker_profiles: {
          orderBy: { effective_from: 'desc' },
          include: {
            vessel_performance_modes: {
              orderBy: { mode: 'asc' },
              include: {
                vessel_bunker_consumption: {
                  orderBy: [
                    { fuel_role: 'asc' },
                    { condition: 'asc' },
                    { activity: 'asc' },
                  ],
                },
              },
            },
          },
        },
      },
    });

    if (!row) {
      throw new NotFoundException('Vessel not found');
    }

    return this.mapVessel(row);
  }

  async createVessel(body: UpsertVesselMasterDto) {
    const vesselId = await this.prisma.$transaction(async (tx) => {
      const vessel = await tx.vessels.create({ data: this.vesselData(body) });
      await this.replaceVesselChildren(tx, vessel.id, body);
      return vessel.id;
    });

    return this.vessel(vesselId.toString());
  }

  async updateVessel(id: string, body: UpsertVesselMasterDto) {
    const vesselId = toBigIntId(id);

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.vessels.findUnique({ where: { id: vesselId } });
      if (!existing) {
        throw new NotFoundException('Vessel not found');
      }

      await tx.vessels.update({
        where: { id: vesselId },
        data: this.vesselData(body),
      });
      await this.replaceVesselChildren(tx, vesselId, body);
    });

    return this.vessel(vesselId.toString());
  }

  async bunkerProfiles({
    vesselId,
    query,
  }: {
    vesselId?: string;
    query?: string;
  }) {
    const rows = await this.prisma.vessel_bunker_profiles.findMany({
      where: {
        is_active: true,
        ...(vesselId ? { vessel_id: BigInt(vesselId) } : {}),
        ...(query
          ? { profile_name: { contains: query, mode: 'insensitive' } }
          : {}),
      },
      orderBy: [{ vessel_id: 'asc' }, { effective_from: 'desc' }],
      take: TAKE,
      include: {
        vessels: true,
        vessel_performance_modes: {
          orderBy: { mode: 'asc' },
          include: {
            vessel_bunker_consumption: {
              orderBy: [
                { fuel_role: 'asc' },
                { condition: 'asc' },
                { activity: 'asc' },
              ],
              include: { fuel_types: true },
            },
          },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id.toString(),
      name: row.profile_name,
      vesselId: row.vessel_id.toString(),
      vesselName: row.vessels.mv_name,
      effectiveFrom: row.effective_from.toISOString().slice(0, 10),
      effectiveTo: row.effective_to?.toISOString().slice(0, 10),
      modes: row.vessel_performance_modes.map((mode) => ({
        mode: mode.mode,
        speedBallastKn: mode.speed_ballast_kn.toNumber(),
        speedLadenKn: mode.speed_laden_kn.toNumber(),
        consumption: mode.vessel_bunker_consumption.map((item) => ({
          fuelRole: item.fuel_role,
          condition: item.condition,
          fuelTypeId: item.fuel_type_id,
          fuelCode: item.fuel_types.code,
          activity: item.activity,
          consumptionMtDay: item.consumption_mt_day.toNumber(),
        })),
      })),
    }));
  }

  private vesselData(
    body: UpsertVesselMasterDto,
  ): Prisma.vesselsUncheckedCreateInput {
    return {
      mv_name: body.mvName.trim(),
      imo_no: nullableString(body.imoNo),
      call_sign: nullableString(body.callSign),
      vessel_code: nullableString(body.vesselCode),
      hull_no: nullableString(body.hullNo),
      ownership: body.ownership,
      owner_company_id: body.ownerCompanyId
        ? toBigIntId(body.ownerCompanyId, 'ownerCompanyId')
        : null,
      vessel_kind_id: body.vesselKindId ?? null,
      vessel_type_id: body.vesselTypeId ?? null,
      flag: nullableString(body.flag),
      class: nullableString(body.class),
      built_year: body.builtYear ?? null,
      dwt: nullableNumber(body.dwt),
      dwcc: nullableNumber(body.dwcc),
      draft_m: nullableNumber(body.draftM),
      loa_m: nullableNumber(body.loaM),
      beam_m: nullableNumber(body.beamM),
      depth_m: nullableNumber(body.depthM),
      grt: nullableNumber(body.grt),
      nrt: nullableNumber(body.nrt),
      scnt: nullableNumber(body.scnt),
      pc_ums_nt: nullableNumber(body.pcUmsNt),
      tpc: nullableNumber(body.tpc),
      grain_cbm: nullableNumber(body.grainCbm),
      bale_cbm: nullableNumber(body.baleCbm),
      constant_mt: nullableNumber(body.constantMt),
      ice_class: nullableString(body.iceClass),
      wap: nullableString(body.wap),
      ho_ha_type: nullableString(body.hoHaType),
      ho_ha_gear: nullableString(body.hoHaGear),
      tank_top_strength_upper: nullableNumber(body.tankTopStrengthUpper),
      tank_top_strength_tween: nullableNumber(body.tankTopStrengthTween),
      hatch_cover_strength: nullableNumber(body.hatchCoverStrength),
      remark: nullableString(body.remark),
      is_active: body.isActive ?? true,
      updated_at: new Date(),
    };
  }

  private cargoData(body: UpsertCargoMasterDto): Prisma.cargoesUncheckedCreateInput {
    return {
      code: nullableString(body.code),
      cargo_name: body.cargoName.trim(),
      cargo_group: nullableString(body.cargoGroup),
      cargo_class: nullableString(body.cargoClass),
      imo_name: nullableString(body.imoName),
      ibc_code: nullableString(body.ibcCode),
      imsbc_code: nullableString(body.imsbcCode),
      bill_by: nullableString(body.billBy),
      default_unit: nullableString(body.defaultUnit) ?? 'MT',
      stowage_factor: nullableNumber(body.stowageFactor),
      stowage_factor_ft3: nullableNumber(body.stowageFactorFt3),
      stowage_factor_unit: nullableString(body.stowageFactorUnit) ?? 'CBM/MT',
      un_number: nullableString(body.unNumber),
      hazard_class: nullableString(body.hazardClass),
      product_code: nullableString(body.productCode),
      capacity_basis: nullableString(body.capacityBasis),
      description: nullableString(body.description),
      preclearance_us_canada: body.preclearanceUsCanada ?? false,
      is_dangerous: body.isDangerous ?? false,
      is_active: body.isActive ?? true,
      special_handling_required: body.specialHandlingRequired ?? false,
      updated_at: new Date(),
    };
  }

  private portData(body: UpsertPortMasterDto): Prisma.portsUncheckedCreateInput {
    return {
      port_name: body.portName.trim(),
      port_type_name: nullableString(body.portType),
      country_name: nullableString(body.countryName),
      state_code: nullableString(body.state),
      port_operator: nullableString(body.portOperator),
      port_no: body.portNo ?? null,
      time_zone_code: nullableString(body.timeZoneCode),
      unlocode: nullableString(body.unlocode),
      latitude: nullableNumber(body.latitude),
      longitude: nullableNumber(body.longitude),
      latitude_text: nullableString(body.latitudeText),
      longitude_text: nullableString(body.longitudeText),
      region_code: nullableString(body.regionCode),
      loadline_zone: nullableString(body.loadlineZone),
      std_gmt_offset: nullableNumber(body.stdGmtOffset),
      dst_gmt_offset: nullableNumber(body.dstGmtOffset),
      utc_offset_min:
        typeof body.stdGmtOffset === 'number'
          ? Math.trunc(body.stdGmtOffset * 60)
          : null,
      port_status: body.isActive === false ? 'INACTIVE' : 'ACTIVE',
      updated_at: new Date(),
    };
  }

  private companyData(
    body: UpsertCompanyMasterDto,
  ): Prisma.companiesUncheckedCreateInput {
    return {
      company_name: body.companyName.trim(),
      country_name: nullableString(body.countryName),
      business_type_name: nullableString(body.businessType),
      time_zone: nullableString(body.timeZone),
      remark: nullableString(body.remark),
      updated_at: new Date(),
    };
  }

  private companyInclude() {
    return {
      company_aliases: { orderBy: { id: 'asc' } },
      addresses: { orderBy: { sort_order: 'asc' } },
      contact_channels: { orderBy: { sort_order: 'asc' } },
      contact_persons: {
        orderBy: { id: 'asc' },
        include: {
          addresses: { orderBy: { sort_order: 'asc' } },
          contact_channels: { orderBy: { sort_order: 'asc' } },
        },
      },
    } satisfies Prisma.companiesInclude;
  }

  private mapPort(
    row: Prisma.portsGetPayload<{ include: { countries: true; port_types: true } }>,
  ) {
    return {
      id: row.id.toString(),
      portName: row.port_name,
      portType: row.port_type_name ?? row.port_types?.name,
      countryName: row.country_name ?? row.countries?.name,
      state: row.state_code,
      portOperator: row.port_operator,
      portNo: row.port_no,
      timeZoneCode: row.time_zone_code,
      unlocode: row.unlocode,
      latitude: row.latitude?.toNumber(),
      longitude: row.longitude?.toNumber(),
      latitudeText: row.latitude_text,
      longitudeText: row.longitude_text,
      regionCode: row.region_code,
      loadlineZone: row.loadline_zone,
      stdGmtOffset: row.std_gmt_offset?.toNumber(),
      dstGmtOffset: row.dst_gmt_offset?.toNumber(),
      utcOffsetMin: row.utc_offset_min,
      isActive: row.port_status === 'ACTIVE',
    };
  }

  private mapCargo(row: Prisma.cargoesGetPayload<object>) {
    return {
      id: row.id.toString(),
      code: row.code,
      cargoName: row.cargo_name,
      cargoGroup: row.cargo_group,
      cargoClass: row.cargo_class,
      imoName: row.imo_name,
      ibcCode: row.ibc_code,
      imsbcCode: row.imsbc_code,
      billBy: row.bill_by,
      defaultUnit: row.default_unit,
      stowageFactor: row.stowage_factor?.toNumber(),
      stowageFactorFt3: row.stowage_factor_ft3?.toNumber(),
      stowageFactorUnit: row.stowage_factor_unit,
      unNumber: row.un_number,
      hazardClass: row.hazard_class,
      productCode: row.product_code,
      capacityBasis: row.capacity_basis,
      description: row.description,
      preclearanceUsCanada: row.preclearance_us_canada,
      isDangerous: row.is_dangerous,
      isActive: row.is_active,
      specialHandlingRequired: row.special_handling_required,
    };
  }

  private mapCompany(row: Prisma.companiesGetPayload<{
    include: ReturnType<MasterDataService['companyInclude']>;
  }>) {
    const companyChannels = this.channelsByType(row.contact_channels);
    const contact = row.contact_persons[0];
    const contactChannels = contact
      ? this.channelsByType(contact.contact_channels)
      : {};

    return {
      id: row.id.toString(),
      companyName: row.company_name,
      alias: row.company_aliases[0]?.alias,
      businessType: row.business_type_name,
      countryName: row.country_name,
      timeZone: row.time_zone,
      phoneCountryCode: companyChannels.PHONE?.country_code,
      phone: companyChannels.PHONE?.value,
      faxCountryCode: companyChannels.FAX?.country_code,
      fax: companyChannels.FAX?.value,
      website: companyChannels.WEBSITE?.value,
      bankAccount: companyChannels.BANK_ACCOUNT?.value,
      remark: row.remark,
      address: this.mapAddress(row.addresses[0]),
      contact: contact
        ? {
            fullName: contact.full_name,
            division: contact.division,
            title: contact.title,
            phoneCountryCode: contactChannels.PHONE?.country_code,
            phone: contactChannels.PHONE?.value,
            mobileCountryCode: contactChannels.MOBILE?.country_code,
            mobilePhone: contactChannels.MOBILE?.value,
            faxCountryCode: contactChannels.FAX?.country_code,
            fax: contactChannels.FAX?.value,
            email: contactChannels.EMAIL?.value,
            instantMessengerType:
              contactChannels.INSTANT_MESSENGER?.im_type_name,
            instantMessenger: contactChannels.INSTANT_MESSENGER?.value,
            remark: contact.remark,
            address: this.mapAddress(contact.addresses[0]),
          }
        : undefined,
      contacts: row.contact_persons.map((item) => {
        const channels = this.channelsByType(item.contact_channels);
        return {
          fullName: item.full_name,
          division: item.division,
          title: item.title,
          phoneCountryCode: channels.PHONE?.country_code,
          phone: channels.PHONE?.value,
          mobileCountryCode: channels.MOBILE?.country_code,
          mobilePhone: channels.MOBILE?.value,
          faxCountryCode: channels.FAX?.country_code,
          fax: channels.FAX?.value,
          email: channels.EMAIL?.value,
          instantMessengerType: channels.INSTANT_MESSENGER?.im_type_name,
          instantMessenger: channels.INSTANT_MESSENGER?.value,
          remark: item.remark,
          address: this.mapAddress(item.addresses[0]),
        };
      }),
    };
  }

  private mapAddress(row?: Prisma.addressesGetPayload<object>) {
    if (!row) return undefined;
    return {
      label: row.label,
      countryName: row.country_name,
      province: row.province,
      postCode: row.post_code,
      city: row.city,
      detail: row.detail,
    };
  }

  private channelsByType(rows: Prisma.contact_channelsGetPayload<object>[]) {
    return rows.reduce<
      Partial<
        Record<contact_channel_type, Prisma.contact_channelsGetPayload<object>>
      >
    >((acc, row) => {
      acc[row.channel_type] = row;
      return acc;
    }, {});
  }

  private async replaceCompanyChildren(
    tx: Prisma.TransactionClient,
    companyId: bigint,
    body: UpsertCompanyMasterDto,
  ) {
    await tx.company_aliases.deleteMany({ where: { company_id: companyId } });
    await tx.addresses.deleteMany({ where: { company_id: companyId } });
    await tx.contact_channels.deleteMany({ where: { company_id: companyId } });
    await tx.contact_persons.deleteMany({ where: { company_id: companyId } });

    if (nullableString(body.alias)) {
      await tx.company_aliases.create({
        data: { company_id: companyId, alias: body.alias!.trim() },
      });
    }

    await this.createAddress(tx, { company_id: companyId }, body.address);
    await this.createChannel(tx, { company_id: companyId }, 'PHONE', body.phone, body.phoneCountryCode);
    await this.createChannel(tx, { company_id: companyId }, 'FAX', body.fax, body.faxCountryCode);
    await this.createChannel(tx, { company_id: companyId }, 'WEBSITE', body.website);
    await this.createChannel(tx, { company_id: companyId }, 'BANK_ACCOUNT', body.bankAccount);

    const contacts = body.contacts?.length ? body.contacts : body.contact ? [body.contact] : [];

    for (const contactInput of contacts) {
      if (!contactInput.fullName?.trim()) continue;
      const contact = await tx.contact_persons.create({
        data: {
          company_id: companyId,
          full_name: contactInput.fullName.trim(),
          division: nullableString(contactInput.division),
          title: nullableString(contactInput.title),
          remark: nullableString(contactInput.remark),
          updated_at: new Date(),
        },
      });

      await this.createAddress(tx, { contact_person_id: contact.id }, contactInput.address);
      await this.createChannel(tx, { contact_person_id: contact.id }, 'PHONE', contactInput.phone, contactInput.phoneCountryCode);
      await this.createChannel(tx, { contact_person_id: contact.id }, 'MOBILE', contactInput.mobilePhone, contactInput.mobileCountryCode);
      await this.createChannel(tx, { contact_person_id: contact.id }, 'FAX', contactInput.fax, contactInput.faxCountryCode);
      await this.createChannel(tx, { contact_person_id: contact.id }, 'EMAIL', contactInput.email);
      await this.createChannel(
        tx,
        { contact_person_id: contact.id },
        'INSTANT_MESSENGER',
        contactInput.instantMessenger,
        undefined,
        contactInput.instantMessengerType,
      );
    }
  }

  private async createAddress(
    tx: Prisma.TransactionClient,
    owner: { company_id?: bigint; contact_person_id?: bigint },
    address?: UpsertCompanyMasterDto['address'],
  ) {
    if (!address || !this.hasAddressValue(address)) return;

    await tx.addresses.create({
      data: {
        ...owner,
        label: nullableString(address.label) ?? 'Address',
        country_name: nullableString(address.countryName),
        province: nullableString(address.province),
        post_code: nullableString(address.postCode),
        city: nullableString(address.city),
        detail: nullableString(address.detail),
      },
    });
  }

  private hasAddressValue(address: UpsertCompanyMasterDto['address']) {
    return Boolean(
      nullableString(address?.countryName) ||
        nullableString(address?.province) ||
        nullableString(address?.postCode) ||
        nullableString(address?.city) ||
        nullableString(address?.detail),
    );
  }

  private async createChannel(
    tx: Prisma.TransactionClient,
    owner: { company_id?: bigint; contact_person_id?: bigint },
    channelType: contact_channel_type,
    value?: string | null,
    countryCode?: string | null,
    imTypeName?: string | null,
  ) {
    const cleanValue = nullableString(value);
    if (!cleanValue) return;

    await tx.contact_channels.create({
      data: {
        ...owner,
        channel_type: channelType,
        country_code: nullableString(countryCode),
        im_type_name: nullableString(imTypeName),
        value: cleanValue,
      },
    });
  }

  private async replaceVesselChildren(
    tx: Prisma.TransactionClient,
    vesselId: bigint,
    body: UpsertVesselMasterDto,
  ) {
    await tx.vessel_gears.deleteMany({ where: { vessel_id: vesselId } });
    await tx.vessel_bunker_profiles.deleteMany({
      where: { vessel_id: vesselId },
    });

    for (const gear of body.gears) {
      if (!gear.gearType.trim()) continue;

      await tx.vessel_gears.create({
        data: {
          vessel_id: vesselId,
          gear_type: gear.gearType.trim(),
          position: nullableString(gear.position),
          capacity_mt: nullableNumber(gear.capacityMt),
          qty_ea: gear.qtyEa ?? null,
        },
      });
    }

    for (const profile of body.bunkerProfiles) {
      await this.createBunkerProfile(tx, vesselId, profile);
    }
  }

  private async createBunkerProfile(
    tx: Prisma.TransactionClient,
    vesselId: bigint,
    profile: VesselBunkerProfileDto,
  ) {
    const createdProfile = await tx.vessel_bunker_profiles.create({
      data: {
        vessel_id: vesselId,
        profile_name: profile.profileName.trim(),
        effective_from: dateFromInput(profile.effectiveFrom, 'effectiveFrom'),
        effective_to: profile.effectiveTo
          ? dateFromInput(profile.effectiveTo, 'effectiveTo')
          : null,
        is_active: profile.isActive ?? true,
        remark: nullableString(profile.remark),
        updated_at: new Date(),
      },
    });

    for (const mode of profile.modes) {
      const createdMode = await tx.vessel_performance_modes.create({
        data: {
          profile_id: createdProfile.id,
          mode: mode.mode,
          speed_ballast_kn: mode.speedBallastKn,
          speed_laden_kn: mode.speedLadenKn,
        },
      });

      for (const consumption of mode.consumption) {
        await tx.vessel_bunker_consumption.create({
          data: {
            vessel_mode_id: createdMode.id,
            fuel_role: consumption.fuelRole,
            condition: consumption.condition,
            fuel_type_id: consumption.fuelTypeId,
            activity: consumption.activity,
            consumption_mt_day: consumption.consumptionMtDay,
          },
        });
      }
    }
  }

  private mapVessel(
    row: Prisma.vesselsGetPayload<{
      include: {
        vessel_gears: true;
        vessel_bunker_profiles: {
          include: {
            vessel_performance_modes: {
              include: { vessel_bunker_consumption: true };
            };
          };
        };
      };
    }>,
  ) {
    return {
      id: row.id.toString(),
      mvName: row.mv_name,
      imoNo: row.imo_no,
      callSign: row.call_sign,
      vesselCode: row.vessel_code,
      hullNo: row.hull_no,
      ownership: row.ownership,
      ownerCompanyId: row.owner_company_id?.toString(),
      vesselKindId: row.vessel_kind_id,
      vesselTypeId: row.vessel_type_id,
      flag: row.flag,
      class: row.class,
      builtYear: row.built_year,
      dwt: row.dwt?.toNumber(),
      dwcc: row.dwcc?.toNumber(),
      draftM: row.draft_m?.toNumber(),
      loaM: row.loa_m?.toNumber(),
      beamM: row.beam_m?.toNumber(),
      depthM: row.depth_m?.toNumber(),
      grt: row.grt?.toNumber(),
      nrt: row.nrt?.toNumber(),
      scnt: row.scnt?.toNumber(),
      pcUmsNt: row.pc_ums_nt?.toNumber(),
      tpc: row.tpc?.toNumber(),
      grainCbm: row.grain_cbm?.toNumber(),
      baleCbm: row.bale_cbm?.toNumber(),
      constantMt: row.constant_mt?.toNumber(),
      iceClass: row.ice_class,
      wap: row.wap,
      hoHaType: row.ho_ha_type,
      hoHaGear: row.ho_ha_gear,
      tankTopStrengthUpper: row.tank_top_strength_upper?.toNumber(),
      tankTopStrengthTween: row.tank_top_strength_tween?.toNumber(),
      hatchCoverStrength: row.hatch_cover_strength?.toNumber(),
      remark: row.remark,
      isActive: row.is_active,
      gears: row.vessel_gears.map((gear) => ({
        id: gear.id.toString(),
        gearType: gear.gear_type,
        position: gear.position,
        capacityMt: gear.capacity_mt?.toNumber(),
        qtyEa: gear.qty_ea,
      })),
      bunkerProfiles: row.vessel_bunker_profiles.map((profile) => ({
        id: profile.id.toString(),
        profileName: profile.profile_name,
        effectiveFrom: profile.effective_from.toISOString().slice(0, 10),
        effectiveTo: profile.effective_to?.toISOString().slice(0, 10),
        isActive: profile.is_active,
        remark: profile.remark,
        modes: profile.vessel_performance_modes.map((mode) => ({
          mode: mode.mode,
          speedBallastKn: mode.speed_ballast_kn.toNumber(),
          speedLadenKn: mode.speed_laden_kn.toNumber(),
          consumption: mode.vessel_bunker_consumption.map((item) => ({
            fuelRole: item.fuel_role,
            condition: item.condition,
            fuelTypeId: item.fuel_type_id,
            activity: item.activity,
            consumptionMtDay: item.consumption_mt_day.toNumber(),
          })),
        })),
      })),
    };
  }
}
