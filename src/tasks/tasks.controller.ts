import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Param,
	Query,
	Body,
	ParseIntPipe,
	UseInterceptors,
	UseGuards
} from '@nestjs/common'
import { TasksService } from './tasks.service'
import { CreateTaskDto } from './dto/create.task.dto'
import { UpdateTaskDto } from './dto/update.task.dto'
import { PaginationDto } from '../common/dto/pagination.dto'
import { LoggerInterceptor } from '../common/interceptors/logger.interceptor'
import { BodyCreateTaskInterceptor } from '../common/interceptors/body-create-task.interceptor'
import { AddHeaderInterceptor } from '../common/interceptors/add-header.interceptor'
import { TasksUtils } from './tasks.utils'
import { AuthTokenGuard } from '../auth/guard/auth-token.guard'
import { PayloadTokenDto } from '../auth/dto/payload-token.dto'
import { TokenPayloadParam } from '../auth/param/token-payload.param'

@Controller('tasks')
export class TasksController {
	constructor(
		private readonly taskService: TasksService,
		private readonly tasksUtils: TasksUtils
	) { }

	@Get()
	@UseInterceptors(LoggerInterceptor)
	@UseInterceptors(AddHeaderInterceptor)
	getTasks(@Query() paginationDto: PaginationDto) {
		console.log(this.tasksUtils.splitString('Hello World from TasksController'))
		return this.taskService.listAllTasks(paginationDto)
	}

	@Get("/busca")
	findManyTasks(@Query() queryParam: any) {
		return this.taskService.listAllTasks()
	}

	@Get(":id")
	findSingleTask(@Param('id', ParseIntPipe) id: number) {
		return this.taskService.findOneTask(id)
	}

	@UseGuards(AuthTokenGuard)
	@Post()
	@UseInterceptors(LoggerInterceptor)
	@UseInterceptors(BodyCreateTaskInterceptor)
	createTask(
		@Body() createTaskDto: CreateTaskDto,
		@TokenPayloadParam() tokenPayload: PayloadTokenDto
	) {
		return this.taskService.create(createTaskDto, tokenPayload)
	}

	@UseGuards(AuthTokenGuard)
	@Put(":id") //Patch
	updateTask(
		@Param('id', ParseIntPipe) id: number,
		@Body() updateTaskDto: UpdateTaskDto,
		@TokenPayloadParam() tokenPayload: PayloadTokenDto
	) {
		return this.taskService.update(id, updateTaskDto, tokenPayload)
	}

	@UseGuards(AuthTokenGuard)
	@Delete(":id")
	deleteTask(
		@Param("id", ParseIntPipe) id: number,
		@TokenPayloadParam() tokenPayload: PayloadTokenDto
	) {
		return this.taskService.delete(id, tokenPayload)
	}
}
