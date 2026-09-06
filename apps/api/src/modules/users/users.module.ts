import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { IdentityReaderService } from './identity-reader.service';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule],
  providers: [UsersService, IdentityReaderService],
  exports: [UsersService, IdentityReaderService],
})
export class UsersModule {}
