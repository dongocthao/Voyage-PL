import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import {
  UpsertVesselMasterDto,
  VesselBunkerProfileDto,
} from './dto/vessel-master.dto';

const TAKE = 30;

function toBigIntId(value: string, name = 'id') {
  try {
    return BigInt(value);
  } catch {
    throw new BadRequestException(`Invalid ${name}`);
  }
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
  constructor(private readonly prisma: PrismaService) {}

  async cargoes(query?: string) {
    const rows = await this.prisma.cargoes.findMany({
      where: {
        is_active: true,
        ...(query
          ? { cargo_name: { contains: query, mode: 'insensitive' } }
          : {}),
      },
      orderBy: { cargo_name: 'asc' },
      take: TAKE,
    });

    return rows.map((row) => ({
      id: row.id.toString(),
      code: row.code,
      name: row.cargo_name,
      defaultUnit: row.default_unit,
      stowageFactor: row.stowage_factor?.toNumber(),
      stowageFactorUnit: row.stowage_factor_unit,
    }));
  }

  async ports(query?: string) {
    const rows = await this.prisma.ports.findMany({
      where: query
        ? { port_name: { contains: query, mode: 'insensitive' } }
        : undefined,
      orderBy: { port_name: 'asc' },
      take: TAKE,
      include: { countries: true },
    });

    return rows.map((row) => ({
      id: row.id.toString(),
      name: row.port_name,
      country: row.countries?.name,
      unlocode: row.unlocode,
      utcOffsetMin: row.utc_offset_min,
      isCanal: row.is_canal,
    }));
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
    }));
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

  async fuelTypes(query?: string) {
    const rows = await this.prisma.fuel_types.findMany({
      where: query
        ? {
            OR: [
              { code: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { code: 'asc' },
      take: TAKE,
    });

    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.description,
    }));
  }

  async vesselKinds(query?: string) {
    const rows = await this.prisma.vessel_kinds.findMany({
      where: query
        ? {
            OR: [
              { code: { contains: query, mode: 'insensitive' } },
              { name: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { name: 'asc' },
      take: TAKE,
    });

    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
    }));
  }

  async vesselTypes(query?: string) {
    const rows = await this.prisma.vessel_types.findMany({
      where: query
        ? {
            OR: [
              { code: { contains: query, mode: 'insensitive' } },
              { name: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { name: 'asc' },
      take: TAKE,
    });

    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
    }));
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
      vesselType: row.vessel_types?.name,
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
