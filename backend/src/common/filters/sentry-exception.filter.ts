import { Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger('SentryExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const httpStatus = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Only report 5xx errors to Sentry (not client validation errors)
    if (httpStatus >= 500) {
      Sentry.captureException(exception);
      this.logger.error(`Unhandled exception captured by Sentry`, exception);
    }

    super.catch(exception, host);
  }
}
