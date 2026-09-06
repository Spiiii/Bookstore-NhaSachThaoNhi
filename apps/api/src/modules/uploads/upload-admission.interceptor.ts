import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { defer, finalize } from 'rxjs';
import type { Response } from 'express';
import { UploadPolicy } from './upload.policy';

@Injectable()
export class UploadAdmissionInterceptor implements NestInterceptor {
  private active = 0;
  constructor(private readonly policy: UploadPolicy) {}
  intercept(context: ExecutionContext, next: CallHandler) {
    return defer(() => {
      if (this.active >= this.policy.maxConcurrent) {
        context.switchToHttp().getResponse<Response>().setHeader('Retry-After', '2');
        throw new HttpException('Upload capacity reached. Retry shortly.', 429);
      }
      this.active++;
      // Do not release on socket close while Multer/Sharp may still be working.
      return defer(() => next.handle()).pipe(
        finalize(() => {
          this.active--;
        }),
      );
    });
  }
}
