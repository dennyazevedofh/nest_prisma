import { DatabaseService } from '../src/database/database.service'
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { ConfigModule } from '@nestjs/config'
import { TasksModule } from '../src/tasks/tasks.module'
import { UsersModule } from '../src/users/users.module'
import { AuthModule } from '../src/auth/auth.module'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'node:path'
import * as dotenv from 'dotenv'
import { faker } from '@faker-js/faker'

dotenv.config({ path: '.env' })

describe('Tasks (e2e)', () => {
	let app: INestApplication
	let databaseService: DatabaseService
	let createdUserIds: number[] = []
	let createdTaskIds: number[] = []

	const makeCreateUserDto = () => {
		const unique = `${Date.now()}-${faker.number.int({ min: 1000, max: 9999 })}`

		return {
			name: faker.person.fullName(),
			email: `task-user-${unique}@example.com`,
			password: `Aa1!${faker.string.alphanumeric(8)}`
		}
	}

	const makeCreateTaskDto = () => {
		const unique = `${Date.now()}-${faker.number.int({ min: 1000, max: 9999 })}`

		return {
			name: `Task ${unique}`,
			description: `Description for task ${unique}`
		}
	}

	const createUserAndLogin = async () => {
		const createUserDto = makeCreateUserDto()
		const createResponse = await request(app.getHttpServer())
			.post('/users')
			.send(createUserDto)
			.expect(201)

		createdUserIds.push(createResponse.body.id)

		const authResponse = await request(app.getHttpServer())
			.post('/auth')
			.send({
				email: createUserDto.email,
				password: createUserDto.password
			})
			.expect(201)

		return {
			userId: createResponse.body.id as number,
			token: authResponse.body.token as string
		}
	}

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({
					isGlobal: true,
					envFilePath: '.env',
				}),
				TasksModule,
				UsersModule,
				AuthModule,
				ServeStaticModule.forRoot({
					rootPath: join(__dirname, '..', '..', 'files'),
					serveRoot: '/files'
				})
			],
		}).compile();

		app = module.createNestApplication();
		app.useGlobalPipes(new ValidationPipe({
			whitelist: true,
			transform: true,
		}))
		databaseService = module.get<DatabaseService>(DatabaseService)
		await app.init();
	});

	afterEach(async () => {
		if (createdTaskIds.length > 0) {
			await databaseService.task.deleteMany({
				where: {
					id: {
						in: createdTaskIds
					}
				}
			})
		}

		if (createdUserIds.length > 0) {
			await databaseService.user.deleteMany({
				where: {
					id: {
						in: createdUserIds
					}
				}
			})
		}

		createdTaskIds = []
		createdUserIds = []
	})

	afterAll(async () => {
		await databaseService.$disconnect()
		await app.close()
	})

	describe('/tasks', () => {
		it('/tasks (POST) - createTask', async () => {
			const { token, userId } = await createUserAndLogin()
			const createTaskDto = makeCreateTaskDto()

			const response = await request(app.getHttpServer())
				.post('/tasks')
				.set('Authorization', `Bearer ${token}`)
				.send(createTaskDto)
				.expect(201)

			createdTaskIds.push(response.body.id)

			expect(response.body).toEqual(
				expect.objectContaining({
					id: expect.any(Number),
					name: createTaskDto.name,
					description: createTaskDto.description,
					completed: false,
					userId,
				})
			)
		})

		it('/tasks (POST) - should return bad request with invalid payload', async () => {
			const { token } = await createUserAndLogin()

			const response = await request(app.getHttpServer())
				.post('/tasks')
				.set('Authorization', `Bearer ${token}`)
				.send({
					name: 'abc',
					description: 'short'
				})
				.expect(400)

			expect(response.body.statusCode).toBe(400)
		})

		it('/tasks (POST) - should return unauthorized without token', async () => {
			const createTaskDto = makeCreateTaskDto()

			const response = await request(app.getHttpServer())
				.post('/tasks')
				.send(createTaskDto)
				.expect(400)

			expect(response.body.statusCode).toBe(401)
		})

		it('/tasks (GET) - findAllTasks', async () => {
			const { token } = await createUserAndLogin()
			const createTaskDto = makeCreateTaskDto()

			const createResponse = await request(app.getHttpServer())
				.post('/tasks')
				.set('Authorization', `Bearer ${token}`)
				.send(createTaskDto)
				.expect(201)

			createdTaskIds.push(createResponse.body.id)

			const response = await request(app.getHttpServer())
				.get('/tasks?limit=10&offset=0')
				.expect(200)

			expect(Array.isArray(response.body)).toBe(true)
			expect(response.body.length).toBeGreaterThan(0)
		})

		it('/tasks/:id (GET) - findOneTask', async () => {
			const { token } = await createUserAndLogin()
			const createTaskDto = makeCreateTaskDto()

			const createResponse = await request(app.getHttpServer())
				.post('/tasks')
				.set('Authorization', `Bearer ${token}`)
				.send(createTaskDto)
				.expect(201)

			createdTaskIds.push(createResponse.body.id)

			const response = await request(app.getHttpServer())
				.get(`/tasks/${createResponse.body.id}`)
				.expect(200)

			expect(response.body).toEqual(
				expect.objectContaining({
					id: createResponse.body.id,
					name: createTaskDto.name,
					description: createTaskDto.description
				})
			)
		})

		it('/tasks/:id (GET) - should return task not found', async () => {
			const response = await request(app.getHttpServer())
				.get('/tasks/999999')
				.expect(400)

			expect(response.body.statusCode).toBe(404)
		})

		it('/tasks/:id (PUT) - updateTask', async () => {
			const { token } = await createUserAndLogin()
			const createTaskDto = makeCreateTaskDto()

			const createResponse = await request(app.getHttpServer())
				.post('/tasks')
				.set('Authorization', `Bearer ${token}`)
				.send(createTaskDto)
				.expect(201)

			createdTaskIds.push(createResponse.body.id)

			const updateTaskDto = {
				name: `Updated ${faker.word.words(2)}`,
				description: `Updated description ${faker.word.words(4)}`,
				completed: true
			}

			const response = await request(app.getHttpServer())
				.put(`/tasks/${createResponse.body.id}`)
				.set('Authorization', `Bearer ${token}`)
				.send(updateTaskDto)
				.expect(200)

			expect(response.body).toEqual(
				expect.objectContaining({
					id: createResponse.body.id,
					name: updateTaskDto.name,
					description: updateTaskDto.description,
					completed: true
				})
			)
		})

		it('/tasks/:id (PUT) - should return unauthorized without token', async () => {
			const response = await request(app.getHttpServer())
				.put('/tasks/1')
				.send({ name: 'Task Update Without Token' })
				.expect(400)

			expect(response.body.statusCode).toBe(401)
		})

		it('/tasks/:id (PUT) - should return unauthorized with token from another user', async () => {
			const owner = await createUserAndLogin()
			const otherUser = await createUserAndLogin()
			const createTaskDto = makeCreateTaskDto()

			const createResponse = await request(app.getHttpServer())
				.post('/tasks')
				.set('Authorization', `Bearer ${otherUser.token}`)
				.send(createTaskDto)
				.expect(201)

			createdTaskIds.push(createResponse.body.id)

			const response = await request(app.getHttpServer())
				.put(`/tasks/${createResponse.body.id}`)
				.set('Authorization', `Bearer ${owner.token}`)
				.send({ name: 'Task Update Unauthorized' })
				.expect(400)

			expect(response.body.statusCode).toBe(401)
		})

		it('/tasks/:id (PUT) - should return task not found with valid token', async () => {
			const { token } = await createUserAndLogin()

			const response = await request(app.getHttpServer())
				.put('/tasks/999999')
				.set('Authorization', `Bearer ${token}`)
				.send({ name: 'Task Not Found Update' })
				.expect(400)

			expect(response.body.statusCode).toBe(404)
		})

		it('/tasks/:id (DELETE) - deleteTask', async () => {
			const { token } = await createUserAndLogin()
			const createTaskDto = makeCreateTaskDto()

			const createResponse = await request(app.getHttpServer())
				.post('/tasks')
				.set('Authorization', `Bearer ${token}`)
				.send(createTaskDto)
				.expect(201)

			createdTaskIds.push(createResponse.body.id)

			const deleteResponse = await request(app.getHttpServer())
				.delete(`/tasks/${createResponse.body.id}`)
				.set('Authorization', `Bearer ${token}`)
				.expect(200)

			expect(deleteResponse.body).toEqual({
				message: 'Tarefa removida com sucesso!'
			})

			createdTaskIds = createdTaskIds.filter((id) => id !== createResponse.body.id)

			const getResponse = await request(app.getHttpServer())
				.get(`/tasks/${createResponse.body.id}`)
				.expect(400)

			expect(getResponse.body.statusCode).toBe(404)
		})

		it('/tasks/:id (DELETE) - should return unauthorized without token', async () => {
			const response = await request(app.getHttpServer())
				.delete('/tasks/1')
				.expect(400)

			expect(response.body.statusCode).toBe(401)
		})

		it('/tasks/:id (DELETE) - should return unauthorized with token from another user', async () => {
			const owner = await createUserAndLogin()
			const otherUser = await createUserAndLogin()
			const createTaskDto = makeCreateTaskDto()

			const createResponse = await request(app.getHttpServer())
				.post('/tasks')
				.set('Authorization', `Bearer ${otherUser.token}`)
				.send(createTaskDto)
				.expect(201)

			createdTaskIds.push(createResponse.body.id)

			const response = await request(app.getHttpServer())
				.delete(`/tasks/${createResponse.body.id}`)
				.set('Authorization', `Bearer ${owner.token}`)
				.expect(400)

			expect(response.body.statusCode).toBe(401)
		})

		it('/tasks/:id (DELETE) - should return task not found with valid token', async () => {
			const { token } = await createUserAndLogin()

			const response = await request(app.getHttpServer())
				.delete('/tasks/999999')
				.set('Authorization', `Bearer ${token}`)
				.expect(400)

			expect(response.body.statusCode).toBe(404)
		})
	})
})