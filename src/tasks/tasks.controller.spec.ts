import { TasksController } from './tasks.controller'
import { TasksService } from './tasks.service'
import { TasksUtils } from './tasks.utils'
import { CreateTaskDto } from './dto/create.task.dto'
import { UpdateTaskDto } from './dto/update.task.dto'
import { PayloadTokenDto } from '../auth/dto/payload-token.dto'
import { PaginationDto } from '../common/dto/pagination.dto'

describe('TasksController', () => {
	let controller: TasksController

	const tasksServiceMock = {
		listAllTasks: jest.fn(),
		findOneTask: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn()
	}

	const tasksUtilsMock = {
		splitString: jest.fn()
	}

	beforeEach(() => {
		jest.clearAllMocks()
		controller = new TasksController(
			tasksServiceMock as unknown as TasksService,
			tasksUtilsMock as unknown as TasksUtils
		)
	})

	it('should be defined tasks controller', () => {
		expect(controller).toBeDefined()
	})

	it('should find all tasks', async () => {
		const paginationDto: PaginationDto = {
			limit: 10,
			offset: 0
		}
		const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

		tasksUtilsMock.splitString.mockReturnValue(['Hello', 'World', 'from', 'NestJS'])

		await controller.getTasks(paginationDto)

		expect(tasksUtilsMock.splitString).toHaveBeenCalledWith('Hello World from TasksController')
		expect(tasksServiceMock.listAllTasks).toHaveBeenCalledWith(paginationDto)
		expect(consoleSpy).toHaveBeenCalledWith(['Hello', 'World', 'from', 'NestJS'])
	})

	it('should find one task by id', async () => {
		const taskId = 1

		await controller.findSingleTask(taskId)

		expect(tasksServiceMock.findOneTask).toHaveBeenCalledWith(taskId)
	})

	it('should create a task', async () => {
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

		await controller.createTask(createTaskDto, tokenPayload)

		expect(tasksServiceMock.create).toHaveBeenCalledWith(createTaskDto, tokenPayload)
	})

	it('should update a task', async () => {
		const taskId = 1
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

		await controller.updateTask(taskId, updateTaskDto, tokenPayload)

		expect(tasksServiceMock.update).toHaveBeenCalledWith(taskId, updateTaskDto, tokenPayload)
	})

	it('should delete a task', async () => {
		const taskId = 1
		const tokenPayload: PayloadTokenDto = {
			sub: 1,
			aud: '',
			email: 'john.doe@example.com',
			exp: 123,
			iat: 123,
			iss: ''
		}

		await controller.deleteTask(taskId, tokenPayload)

		expect(tasksServiceMock.delete).toHaveBeenCalledWith(taskId, tokenPayload)
	})
})
