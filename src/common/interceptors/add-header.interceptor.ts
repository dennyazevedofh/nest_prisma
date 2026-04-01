import {
	NestInterceptor,
	ExecutionContext,
	CallHandler,
	Injectable
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AddHeaderInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const response = context.switchToHttp().getResponse();
		response.setHeader('X-Custom-Header', 'Valor do Header Personalizado');

		return next.handle();
	}
}