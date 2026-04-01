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
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create.task.dto';
import { UpdateTaskDto } from './dto/update.task.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { LoggerInterceptor } from 'src/common/interceptors/logger.interceptor';
import { BodyCreateTaskInterceptor } from 'src/common/interceptors/body-create-task.interceptor';
import { AddHeaderInterceptor } from 'src/common/interceptors/add-header.interceptor';

@Controller('tasks')
export class TasksController {
	constructor(private readonly taskService: TasksService) { }

	@Get()
	@UseInterceptors(LoggerInterceptor)
	@UseInterceptors(AddHeaderInterceptor)
	getTasks(@Query() paginationDto: PaginationDto) {
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

	@Post()
	@UseInterceptors(LoggerInterceptor)
	@UseInterceptors(BodyCreateTaskInterceptor)
	createTask(@Body() createTaskDto: CreateTaskDto) {
		return this.taskService.create(createTaskDto)
	}

	@Put(":id") //Patch
	updateTask(@Param('id', ParseIntPipe) id: number, @Body() updateTaskDto: UpdateTaskDto) {
		return this.taskService.update(id, updateTaskDto)
	}

	@Delete(":id")
	deleteTask(@Param("id", ParseIntPipe) id: number) {
		return this.taskService.delete(id)
	}
}
