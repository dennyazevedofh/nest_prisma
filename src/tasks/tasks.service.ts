import {
	HttpException,
	Injectable,
	NotFoundException,
	HttpStatus
} from '@nestjs/common'
import { CreateTaskDto } from './dto/create.task.dto'
import { UpdateTaskDto } from './dto/update.task.dto'
import { DatabaseService } from '../database/database.service'
import { PaginationDto } from '../common/dto/pagination.dto'
import { resolvePagination } from '../common/pagination/resolvePagination'
import { PayloadTokenDto } from '../auth/dto/payload-token.dto'

@Injectable()
export class TasksService {
	constructor(private readonly databaseService: DatabaseService) { }

	async listAllTasks(paginationDto?: PaginationDto) {
		const { limit, offset } = resolvePagination(paginationDto);
		try {
			const allTasks = await this.databaseService.task.findMany({
				take: limit,
				skip: offset,
				orderBy: {
					createdAt: 'desc'
				}
			});
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
			if (!task) {
				throw new HttpException("Tarefa não encontrada", HttpStatus.NOT_FOUND);
			}
			return task;
		} catch (error) {
			if (error.status === HttpStatus.NOT_FOUND) {
				throw error;
			}
			throw new HttpException(
				"Erro ao buscar a tarefa",
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	async create(createTaskDto: CreateTaskDto, tokenPayload: PayloadTokenDto) {
		try {
			const newTask = await this.databaseService.task.create({
				data: {
					name: createTaskDto.name,
					description: createTaskDto.description,
					userId: tokenPayload.sub,
					completed: false
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


	async update(
		id: number,
		updateTaskDto: UpdateTaskDto,
		tokenPayload: PayloadTokenDto
	) {
		try {
			const findTask = await this.databaseService.task.findUnique({
				where: { id }
			});
			if (!findTask) {
				throw new NotFoundException("Tarefa não encontrada");
			}
			if (findTask.userId !== tokenPayload.sub) {
				throw new HttpException(
					"Você não tem permissão para atualizar esta tarefa",
					HttpStatus.UNAUTHORIZED
				)
			}
			const updateTask = await this.databaseService.task.update({
				where: { id },
				data: updateTaskDto
			});
			return updateTask;
		} catch (error) {
			if (error instanceof HttpException) throw error
			throw new HttpException(
				"Erro ao atualizar a tarefa",
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	async delete(id: number, tokenPayload: PayloadTokenDto) {
		try {
			const findTask = await this.databaseService.task.findUnique({
				where: { id }
			});
			if (!findTask) {
				throw new NotFoundException("Tarefa não encontrada");
			}
			if (findTask.userId !== tokenPayload.sub) {
				throw new HttpException(
					"Você não tem permissão para excluir esta tarefa",
					HttpStatus.UNAUTHORIZED
				)
			}
			await this.databaseService.task.delete({
				where: { id }
			});
			return { message: "Tarefa deletada com sucesso" };
		} catch (error) {
			if (error instanceof HttpException) throw error
			throw new HttpException(
				"Erro ao deletar a tarefa",
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}
}
