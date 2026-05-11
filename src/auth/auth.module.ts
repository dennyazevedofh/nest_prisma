import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BcryptService } from './hash/bcrypt.service';
import { HashingServiceProtocol } from './hash/hashing.service';
import { DatabaseModule } from 'src/database/database.module';

@Global()
  @Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
    providers: [
      AuthService,
      {
        provide: HashingServiceProtocol,
        useClass: BcryptService,
      }
    ],
    exports: [HashingServiceProtocol]
})
export class AuthModule {}
