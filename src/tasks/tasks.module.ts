import { Module } from '@nestjs/common'
import { TasksController } from './tasks.controller'
import { TasksService } from './tasks.service'
import { DatabaseModule } from '../database/database.module'
import { TasksUtils } from './tasks.utils'

@Module({
  imports: [DatabaseModule],
  controllers: [TasksController],
  providers: [TasksService, TasksUtils]
})
export class TasksModule {}
