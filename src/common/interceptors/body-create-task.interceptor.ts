import {
	NestInterceptor,
	ExecutionContext,
	CallHandler,
	Injectable
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class BodyCreateTaskInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest();
		const { method, url, body } = request;
		console.log(`[REQUEST] [${method}] ${url} -  Copo da requisição:`);
		console.log(`[BODY] ${JSON.stringify(body)}`);

		return next.handle();
	}
}