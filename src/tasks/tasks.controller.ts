import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Param,
	Query,
	Body,
	ParseIntPipe
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create.task.dto';
import { UpdateTaskDto } from './dto/update.task.dto';

@Controller('tasks')
export class TasksController {
	constructor(private readonly taskService: TasksService) { }

	@Get()
	getTasks() {
		return this.taskService.listAllTasks()
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
