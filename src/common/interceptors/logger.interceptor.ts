import {
	NestInterceptor,
	ExecutionContext,
	CallHandler,
	Injectable
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest();
		const method = request.method;
		const url = request.url;
		const now = Date.now();
		console.log(`[REQUEST] [${method}] ${url} - ${now} -  Início da requisição...`);

		return next.handle().pipe(
			tap(() => {
				console.log(`[RESPONSE] [${method}] ${url} - ${Date.now() - now}ms - Fim da requisição.`);
			})
		);
	}
}