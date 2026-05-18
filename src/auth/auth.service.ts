import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { SignInDto } from './dto/signin.dto';
import { DatabaseService } from 'src/database/database.service';
import { HashingServiceProtocol } from './hash/hashing.service';

@Injectable()
export class AuthService {
	constructor(
		private readonly databaseService: DatabaseService,
		private readonly hashingService: HashingServiceProtocol,
	) { }

	async authenticate(signInDto: SignInDto) {
		const user = await this.databaseService.user.findUnique({
			where: { email: signInDto.email },
		});

		if (!user) {
			throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
		}

		const isPasswordValid = await this.hashingService.compare(
			signInDto.password,
			user.passwordHash
		)

		if (!isPasswordValid) {
			throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
		}

		return {
			id: user.id,
			email: user.email,
			name: user.name,
			message: 'Authentication successful'
		}
	}
}
