import {
	Controller,
	Get,
	Param,
	Query
} from '@nestjs/common';
import { TasksService } from './tasks.service';

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
	findSingleTask(@Param('id') id: string) {
		return this.taskService.findOneTask(id)
	}
}
