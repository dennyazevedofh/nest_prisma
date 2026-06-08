import { Test, TestingModule } from '@nestjs/testing'
import { HttpException, HttpStatus } from '@nestjs/common'
import { describe } from 'node:test'
import { TasksService } from './tasks.service'
import { DatabaseService } from '../database/database.service'
import { CreateTaskDto } from './dto/create.task.dto'
import { UpdateTaskDto } from './dto/update.task.dto'
import { PayloadTokenDto } from '../auth/dto/payload-token.dto'
import { PaginationDto } from '../common/dto/pagination.dto'

describe('TasksService', () => {
	let tasksService: TasksService
	let databaseService: DatabaseService

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TasksService,
				{
					provide: DatabaseService,
					useValue: {
						task: {
							findMany: jest.fn(),
							findUnique: jest.fn(),
							create: jest.fn(),
							update: jest.fn(),
							delete: jest.fn()
						}
					}
				}
			]
		}).compile()

		tasksService = module.get<TasksService>(TasksService)
		databaseService = module.get<DatabaseService>(DatabaseService)
	})

	it('should be defined tasks service', () => {
		expect(tasksService).toBeDefined()
	})

	describe('find all tasks', () => {
		it('should return all tasks with pagination', async () => {
			const paginationDto: PaginationDto = {
				limit: 10,
				offset: 0
			}
			const mockTasks = [
				{
					id: 1,
					name: 'Task 01',
					description: 'Description task 01',
					completed: false,
					createdAt: new Date(),
					userId: 1
				},
				{
					id: 2,
					name: 'Task 02',
					description: 'Description task 02',
					completed: true,
					createdAt: new Date(),
					userId: 1
				}
			]

			jest.spyOn(databaseService.task, 'findMany').mockResolvedValue(mockTasks)

			const result = await tasksService.listAllTasks(paginationDto)

			expect(databaseService.task.findMany).toHaveBeenCalledWith({
				take: paginationDto.limit,
				skip: paginationDto.offset,
				orderBy: {
					createdAt: 'desc'
				}
			})
			expect(result).toEqual(mockTasks)
		})
	})

	describe('find one task', () => {
		it('should return one task when found', async () => {
			const mockTask = {
				id: 1,
				name: 'Task 01',
				description: 'Description task 01',
				completed: false,
				createdAt: new Date(),
				userId: 1
			}

			jest.spyOn(databaseService.task, 'findUnique').mockResolvedValue(mockTask)

			const result = await tasksService.findOneTask(1)

			expect(databaseService.task.findUnique).toHaveBeenCalledWith({
				where: { id: 1 }
			})
			expect(result).toEqual(mockTask)
		})

		it('should throw an error when task not found', async () => {
			jest.spyOn(databaseService.task, 'findUnique').mockResolvedValue(null)

			await expect(tasksService.findOneTask(1)).rejects.toThrow(
				new HttpException('Tarefa não encontrada', HttpStatus.NOT_FOUND)
			)
		})
	})

	describe('create task', () => {
		it('should create a new task', async () => {
			const createTaskDto: CreateTaskDto = {
				name: 'Task 01',
				description: 'Description task 01'
			}
			const tokenPayload: PayloadTokenDto = {
				sub: 1,
				aud: '',
				email: 'john.doe@example.com',
				exp: 123,
				iat: 123,
				iss: ''
			}
			const newTask = {
				id: 1,
				name: createTaskDto.name,
				description: createTaskDto.description,
				completed: false,
				createdAt: new Date(),
				userId: 1
			}

			jest.spyOn(databaseService.task, 'create').mockResolvedValue(newTask)

			const result = await tasksService.create(createTaskDto, tokenPayload)

			expect(databaseService.task.create).toHaveBeenCalledWith({
				data: {
					name: createTaskDto.name,
					description: createTaskDto.description,
					completed: false,
					userId: tokenPayload.sub
				}
			})
			expect(result).toEqual(newTask)
		})

		it('should throw an error when create task fails', async () => {
			const createTaskDto: CreateTaskDto = {
				name: 'Task 01',
				description: 'Description task 01'
			}
			const tokenPayload: PayloadTokenDto = {
				sub: 1,
				aud: '',
				email: 'john.doe@example.com',
				exp: 123,
				iat: 123,
				iss: ''
			}

			jest.spyOn(databaseService.task, 'create').mockRejectedValue(new Error('Database error'))

			await expect(tasksService.create(createTaskDto, tokenPayload)).rejects.toThrow(
				new HttpException('Erro ao criar a tarefa', HttpStatus.INTERNAL_SERVER_ERROR)
			)
		})
	})

	describe('update task', () => {
		it('should update a task when user is owner', async () => {
			const updateTaskDto: UpdateTaskDto = {
				name: 'Task 01 updated',
				description: 'Description task 01 updated',
				completed: true
			}
			const tokenPayload: PayloadTokenDto = {
				sub: 1,
				aud: '',
				email: 'john.doe@example.com',
				exp: 123,
				iat: 123,
				iss: ''
			}
			const mockTask = {
				id: 1,
				name: 'Task 01',
				description: 'Description task 01',
				completed: false,
				createdAt: new Date(),
				userId: 1
			}
			const updatedTask = {
				...mockTask,
				...updateTaskDto
			}

			jest.spyOn(databaseService.task, 'findUnique').mockResolvedValue(mockTask)
			jest.spyOn(databaseService.task, 'update').mockResolvedValue(updatedTask)

			const result = await tasksService.update(1, updateTaskDto, tokenPayload)

			expect(databaseService.task.findUnique).toHaveBeenCalledWith({
				where: { id: 1 }
			})
			expect(databaseService.task.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: updateTaskDto
			})
			expect(result).toEqual(updatedTask)
		})

		it('should throw an error when task not found', async () => {
			const updateTaskDto: UpdateTaskDto = {
				name: 'Task 01 updated'
			}
			const tokenPayload: PayloadTokenDto = {
				sub: 1,
				aud: '',
				email: 'john.doe@example.com',
				exp: 123,
				iat: 123,
				iss: ''
			}

			jest.spyOn(databaseService.task, 'findUnique').mockResolvedValue(null)

			await expect(tasksService.update(1, updateTaskDto, tokenPayload)).rejects.toThrow(
				new HttpException('Tarefa não encontrada', HttpStatus.NOT_FOUND)
			)
			expect(databaseService.task.update).not.toHaveBeenCalled()
		})

		it('should throw an error when user is unauthorized', async () => {
			const updateTaskDto: UpdateTaskDto = {
				name: 'Task 01 updated'
			}
			const tokenPayload: PayloadTokenDto = {
				sub: 1,
				aud: '',
				email: 'john.doe@example.com',
				exp: 123,
				iat: 123,
				iss: ''
			}
			const mockTask = {
				id: 1,
				name: 'Task 01',
				description: 'Description task 01',
				completed: false,
				createdAt: new Date(),
				userId: 2
			}

			jest.spyOn(databaseService.task, 'findUnique').mockResolvedValue(mockTask)

			await expect(tasksService.update(1, updateTaskDto, tokenPayload)).rejects.toThrow(
				new HttpException('Você não tem permissão para atualizar esta tarefa', HttpStatus.UNAUTHORIZED)
			)
			expect(databaseService.task.update).not.toHaveBeenCalled()
		})

		it('should throw an error when update task fails', async () => {
			const updateTaskDto: UpdateTaskDto = {
				name: 'Task 01 updated'
			}
			const tokenPayload: PayloadTokenDto = {
				sub: 1,
				aud: '',
				email: 'john.doe@example.com',
				exp: 123,
				iat: 123,
				iss: ''
			}
			const mockTask = {
				id: 1,
				name: 'Task 01',
				description: 'Description task 01',
				completed: false,
				createdAt: new Date(),
				userId: 1
			}

			jest.spyOn(databaseService.task, 'findUnique').mockResolvedValue(mockTask)
			jest.spyOn(databaseService.task, 'update').mockRejectedValue(new Error('Database error'))

			await expect(tasksService.update(1, updateTaskDto, tokenPayload)).rejects.toThrow(
				new HttpException('Erro ao atualizar a tarefa', HttpStatus.INTERNAL_SERVER_ERROR)
			)
		})
	})

	describe('delete task', () => {
		it('should delete a task when user is owner', async () => {
			const tokenPayload: PayloadTokenDto = {
				sub: 1,
				aud: '',
				email: 'john.doe@example.com',
				exp: 123,
				iat: 123,
				iss: ''
			}
			const mockTask = {
				id: 1,
				name: 'Task 01',
				description: 'Description task 01',
				completed: false,
				createdAt: new Date(),
				userId: 1
			}

			jest.spyOn(databaseService.task, 'findUnique').mockResolvedValue(mockTask)
			jest.spyOn(databaseService.task, 'delete').mockResolvedValue(mockTask)

			const result = await tasksService.delete(1, tokenPayload)

			expect(databaseService.task.findUnique).toHaveBeenCalledWith({
				where: { id: 1 }
			})
			expect(databaseService.task.delete).toHaveBeenCalledWith({
				where: { id: 1 }
			})
			expect(result).toEqual({ message: 'Tarefa deletada com sucesso' })
		})

		it('should throw an error when task not found', async () => {
			const tokenPayload: PayloadTokenDto = {
				sub: 1,
				aud: '',
				email: 'john.doe@example.com',
				exp: 123,
				iat: 123,
				iss: ''
			}

			jest.spyOn(databaseService.task, 'findUnique').mockResolvedValue(null)

			await expect(tasksService.delete(1, tokenPayload)).rejects.toThrow(
				new HttpException('Tarefa não encontrada', HttpStatus.NOT_FOUND)
			)
			expect(databaseService.task.delete).not.toHaveBeenCalled()
		})

		it('should throw an error when user is unauthorized', async () => {
			const tokenPayload: PayloadTokenDto = {
				sub: 1,
				aud: '',
				email: 'john.doe@example.com',
				exp: 123,
				iat: 123,
				iss: ''
			}
			const mockTask = {
				id: 1,
				name: 'Task 01',
				description: 'Description task 01',
				completed: false,
				createdAt: new Date(),
				userId: 2
			}

			jest.spyOn(databaseService.task, 'findUnique').mockResolvedValue(mockTask)

			await expect(tasksService.delete(1, tokenPayload)).rejects.toThrow(
				new HttpException('Você não tem permissão para excluir esta tarefa', HttpStatus.UNAUTHORIZED)
			)
			expect(databaseService.task.delete).not.toHaveBeenCalled()
		})

		it('should throw an error when delete task fails', async () => {
			const tokenPayload: PayloadTokenDto = {
				sub: 1,
				aud: '',
				email: 'john.doe@example.com',
				exp: 123,
				iat: 123,
				iss: ''
			}
			const mockTask = {
				id: 1,
				name: 'Task 01',
				description: 'Description task 01',
				completed: false,
				createdAt: new Date(),
				userId: 1
			}

			jest.spyOn(databaseService.task, 'findUnique').mockResolvedValue(mockTask)
			jest.spyOn(databaseService.task, 'delete').mockRejectedValue(new Error('Database error'))

			await expect(tasksService.delete(1, tokenPayload)).rejects.toThrow(
				new HttpException('Erro ao deletar a tarefa', HttpStatus.INTERNAL_SERVER_ERROR)
			)
		})
	})
})
