import {
	HttpException,
	Injectable,
	NotFoundException,
	HttpStatus
} from '@nestjs/common';
import { Task } from './entities/task.entitie';
import { CreateTaskDto } from './dto/create.task.dto';
import { UpdateTaskDto } from './dto/update.task.dto';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TasksService {
	constructor(private readonly databaseService: DatabaseService) { }

	async listAllTasks() {
		try {
			const allTasks = await this.databaseService.task.findMany();
			return allTasks;
		} catch (error) {
			throw new HttpException(
				"Erro ao listar as tarefas",
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	async findOneTask(id: number) {
		try {
			const task = await this.databaseService.task.findUnique({
				where: { id }
			});
			return task;
		} catch (error) {
			throw new HttpException(
				"Erro ao buscar a tarefa",
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	async create(createTaskDto: CreateTaskDto) {
		try {
			const newTask = await this.databaseService.task.create({
				data: {
					name: createTaskDto.name,
					description: createTaskDto.description
				}
			});
			return newTask;
		} catch (error) {
			throw new HttpException(
				"Erro ao criar a tarefa",
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}


	async update(id: number, updateTaskDto: UpdateTaskDto) {
		try {
			const findTask = await this.databaseService.task.findUnique({
				where: { id }
			});
			if (!findTask) {
				throw new NotFoundException("Tarefa não encontrada");
			}
			const updateTask = await this.databaseService.task.update({
				where: { id },
				data: updateTaskDto
			});
			return updateTask;
		} catch (error) {
			throw new HttpException(
				"Erro ao atualizar a tarefa",
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	async delete(id: number) {
		try {
			const findTask = await this.databaseService.task.findUnique({
				where: { id }
			});
			if (!findTask) {
				throw new NotFoundException("Tarefa não encontrada");
			}
			await this.databaseService.task.delete({
				where: { id }
			});
			return { message: "Tarefa deletada com sucesso" };
		} catch (error) {
			throw new HttpException(
				"Erro ao deletar a tarefa",
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}
}
