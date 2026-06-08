import {
	IsNotEmpty,
	IsString,
	IsEmail,
	MinLength,
	IsStrongPassword
} from "class-validator"

export class SignInDto {
	@IsEmail()
	readonly email: string

	@IsStrongPassword({
		minLength: 8,
		minLowercase: 1,
		minUppercase: 1,
		minNumbers: 1,
		minSymbols: 1,
	})
	@IsString()
	@MinLength(8)
	@IsNotEmpty()
	readonly password: string
}