/* import { Module } from '@nestjs/common';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';

@Module({
  controllers: [ResourcesController],
  providers: [ResourcesService]
})
export class ResourcesModule {} */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resource } from './resource.entity';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { User } from 'src/users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Resource, User])],
  controllers: [ResourcesController],
  providers: [ResourcesService],
})
export class ResourcesModule {}