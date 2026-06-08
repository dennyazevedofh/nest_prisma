import { Global, Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { BcryptService } from './hash/bcrypt.service'
import { HashingServiceProtocol } from './hash/hashing.service'
import { DatabaseModule } from '../database/database.module'
import jwtConfig from './config/jwt.config'
import { ConfigModule } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'

@Global()
  @Module({
    imports: [
      DatabaseModule,
      ConfigModule.forFeature(jwtConfig),
      JwtModule.registerAsync(jwtConfig.asProvider())
    ],
    controllers: [AuthController],
    providers: [
      AuthService,
      {
        provide: HashingServiceProtocol,
        useClass: BcryptService,
      }
    ],
    exports: [
      HashingServiceProtocol,
      JwtModule,
      ConfigModule
    ]
})
export class AuthModule {}
