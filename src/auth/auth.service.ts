import {
	Injectable,
	HttpStatus,
	HttpException,
	Inject
} from '@nestjs/common'
import { SignInDto } from './dto/signin.dto'
import { DatabaseService } from '../database/database.service'
import { HashingServiceProtocol } from './hash/hashing.service'
import jwtConfig from './config/jwt.config'
import { ConfigType } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { StringValue } from 'ms'

@Injectable()
export class AuthService {
	constructor(
		private readonly databaseService: DatabaseService,
		private readonly hashingService: HashingServiceProtocol,

		@Inject(jwtConfig.KEY)
		private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
		private readonly jwtService: JwtService
	) { }

	async authenticate(signInDto: SignInDto) {
		const user = await this.databaseService.user.findUnique({
			where: { email: signInDto.email },
		})

		if (!user) {
			throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED)
		}

		const isPasswordValid = await this.hashingService.compare(
			signInDto.password,
			user.passwordHash
		)

		if (!isPasswordValid) {
			throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED)
		}

		if (!this.jwtConfiguration.secret) {
			throw new HttpException('JWT secret is not configured', HttpStatus.INTERNAL_SERVER_ERROR)
		}

		const tokenTtl = this.jwtConfiguration.ttl
		const expiresIn = tokenTtl
			? /^\d+$/.test(tokenTtl)
				? Number(tokenTtl)
				: (tokenTtl as StringValue)
			: undefined

		const token = await this.jwtService.signAsync(
			{
				sub: user.id,
				email: user.email,
				username: user.name,
			},
			{
				secret: this.jwtConfiguration.secret,
				expiresIn,
				audience: this.jwtConfiguration.audience,
				issuer: this.jwtConfiguration.issuer,
			}
		)

		return {
			id: user.id,
			email: user.email,
			name: user.name,
			avatar: user.avatar,
			token
		}
	}
}
