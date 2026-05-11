import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common"
import { Observable } from "rxjs"

@Injectable()
export class AuthAdminGuard implements CanActivate {
	canActivate(context: ExecutionContext): Promise<boolean> | Observable<boolean> | boolean {
		const request = context.switchToHttp().getRequest()
		const user = request['users']

		console.log('AuthAdminGuard: user', user)
		if (user?.role === 'admin') {
			return true
		}
		return false
	}
}