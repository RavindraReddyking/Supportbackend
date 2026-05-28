import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class TrimInterceptor implements NestInterceptor {

  private trim(value: any): any {
    // ✅ Only trim string values
    if (typeof value === 'string') {
      return value.trim();
    }

    // ✅ Handle arrays
    if (Array.isArray(value)) {
      return value.map(v => this.trim(v));
    }

    // ✅ Handle objects
    if (value && typeof value === 'object') {
      for (const key in value) {
        value[key] = this.trim(value[key]);
      }
    }

    return value;
  }

  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map(data => this.trim(data)) // ✅ apply trim to response
    );
  }
}