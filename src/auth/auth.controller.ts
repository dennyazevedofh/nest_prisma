import { Controller, Post, Body } from '@nestjs/common'
import { AuthService } from './auth.service'
import { SignInDto } from './dto/signin.dto'

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post()
	signIn(@Body() signInDto: SignInDto) {
		return this.authService.authenticate(signInDto)
	}
}
