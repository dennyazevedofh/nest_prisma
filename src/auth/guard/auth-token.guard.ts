import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
	Inject
} from '@nestjs/common'
import { Request } from 'express'
import { JwtService } from '@nestjs/jwt'
import jwtConfig from '../config/jwt.config'
import { ConfigType } from '@nestjs/config'
import { REQUEST_TOKEN_PAYLOAD_NAME } from '../common/auth.constants'

@Injectable()
export class AuthTokenGuard implements CanActivate {
	constructor(
		@Inject(jwtConfig.KEY)
		private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
		private readonly jwtService: JwtService
	) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request: Request = context.switchToHttp().getRequest()
		const token = this.extractTokenHeader(request)
		if(!token) {
			throw new UnauthorizedException('Authorization token is missing')
		}
		try {
			const payload = await this.jwtService.verifyAsync(token, this.jwtConfiguration)
			request[REQUEST_TOKEN_PAYLOAD_NAME] = payload
		} catch (error) {
			throw new UnauthorizedException('Invalid or expired token')
		}

		return true
	}

	private extractTokenHeader(request: Request) {
		const authorization = request.headers?.authorization
		if (!authorization || typeof authorization !== 'string') {
			return
		}

		return authorization.split(' ')[1]
	}
}