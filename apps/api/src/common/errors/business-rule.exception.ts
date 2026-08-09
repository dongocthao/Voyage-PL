import { BadRequestException } from '@nestjs/common';
import { AppErrorCode } from './app-error-code';
import type { ErrorDetail } from './error-detail';

export class BusinessRuleException extends BadRequestException {
  constructor(
    message: string,
    readonly code: AppErrorCode = AppErrorCode.BUSINESS_RULE_VIOLATION,
    readonly details: ErrorDetail[] = [],
  ) {
    super({ code, message, details });
  }
}
