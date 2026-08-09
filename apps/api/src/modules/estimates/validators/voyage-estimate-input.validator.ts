import { Injectable } from '@nestjs/common';
import { AppErrorCode } from '../../../common/errors/app-error-code';
import { BusinessRuleException } from '../../../common/errors/business-rule.exception';
import type { ErrorDetail } from '../../../common/errors/error-detail';
import type { SaveVoyageEstimateDto } from '../dto/voyage-estimate-snapshot.dto';

@Injectable()
export class VoyageEstimateInputValidator {
  validate(snapshot: SaveVoyageEstimateDto) {
    const details: ErrorDetail[] = [];

    if (snapshot.cargoLines.length === 0) {
      details.push({ path: 'cargoLines', message: 'At least one cargo line is required.' });
    }

    if (snapshot.portLegs.length === 0) {
      details.push({ path: 'portLegs', message: 'At least one port leg is required.' });
    }

    snapshot.cargoLines.forEach((line, index) => {
      if (!line.cargoName && !line.cargoId) {
        details.push({
          path: `cargoLines[${index}].cargoName`,
          message: 'Cargo name or cargo master is required.',
        });
      }

      if (!line.loadingPortId) {
        details.push({
          path: `cargoLines[${index}].loadingPortId`,
          message: 'Loading port is required.',
        });
      }

      if (!line.dischargingPortId) {
        details.push({
          path: `cargoLines[${index}].dischargingPortId`,
          message: 'Discharging port is required.',
        });
      }

      if ((line.quantity ?? 0) <= 0) {
        details.push({
          path: `cargoLines[${index}].quantity`,
          message: 'Cargo quantity must be greater than zero.',
        });
      }

      if (line.freight.freightType === 'F' && line.freight.freightRate === undefined) {
        details.push({
          path: `cargoLines[${index}].freight.freightRate`,
          message: 'Freight rate is required when freight type is F.',
        });
      }

      if (line.freight.freightType === 'L' && line.freight.freightLumpsum === undefined) {
        details.push({
          path: `cargoLines[${index}].freight.freightLumpsum`,
          message: 'Freight lumpsum is required when freight type is L.',
        });
      }

      if (line.freight.addCommPct !== undefined && line.freight.addCommPct > 100) {
        details.push({
          path: `cargoLines[${index}].freight.addCommPct`,
          message: 'Address commission must not exceed 100%.',
        });
      }

      if (line.freight.brokeragePct !== undefined && line.freight.brokeragePct > 100) {
        details.push({
          path: `cargoLines[${index}].freight.brokeragePct`,
          message: 'Brokerage must not exceed 100%.',
        });
      }
    });

    snapshot.portLegs.forEach((leg, index) => {
      if (leg.legType !== 'OTHER' && !leg.portId) {
        details.push({
          path: `portLegs[${index}].portId`,
          message: 'Port is required for this leg.',
        });
      }

      if ((leg.ecaNm ?? 0) > (leg.distanceNm ?? 0)) {
        details.push({
          path: `portLegs[${index}].ecaNm`,
          message: 'ECA distance must be less than or equal to total distance.',
        });
      }

      if (leg.distanceNm !== undefined && leg.distanceNm > 0 && !leg.speedKn && !leg.seaDays) {
        details.push({
          path: `portLegs[${index}].speedKn`,
          message: 'Speed is required when distance is provided and sea days is not supplied.',
        });
      }

      if (leg.speedKn !== undefined && leg.speedKn <= 0 && (leg.distanceNm ?? 0) > 0) {
        details.push({
          path: `portLegs[${index}].speedKn`,
          message: 'Speed must be greater than zero when distance is provided.',
        });
      }

      if (
        leg.portId &&
        (leg.legType === 'LOADING' || leg.legType === 'DISCHARGE') &&
        hasCargoAtPort(snapshot, leg) &&
        !leg.cpTerm?.ldRate
      ) {
        details.push({
          path: `portLegs[${index}].cpTerm.ldRate`,
          message: 'L/D rate is required to derive working days for this cargo port.',
        });
      }

      if (leg.cpTerm?.ldRate !== undefined && leg.cpTerm.ldRate <= 0) {
        details.push({
          path: `portLegs[${index}].cpTerm.ldRate`,
          message: 'L/D rate must be greater than zero when supplied.',
        });
      }
    });

    const hasLoadingPort = snapshot.portLegs.some((leg) => leg.legType === 'LOADING');
    const hasDischargePort = snapshot.portLegs.some((leg) => leg.legType === 'DISCHARGE');
    if (!hasLoadingPort) {
      details.push({ path: 'portLegs', message: 'At least one loading leg is required.' });
    }
    if (!hasDischargePort) {
      details.push({ path: 'portLegs', message: 'At least one discharge leg is required.' });
    }

    if (details.length > 0) {
      throw new BusinessRuleException(
        'Voyage estimate snapshot has invalid business data.',
        AppErrorCode.INVALID_VOYAGE_SNAPSHOT,
        details,
      );
    }
  }
}

function hasCargoAtPort(snapshot: SaveVoyageEstimateDto, leg: SaveVoyageEstimateDto['portLegs'][number]) {
  return snapshot.cargoLines.some((cargo) => {
    if (leg.legType === 'LOADING') {
      return cargo.loadingPortId === leg.portId;
    }

    if (leg.legType === 'DISCHARGE') {
      return cargo.dischargingPortId === leg.portId;
    }

    return false;
  });
}
