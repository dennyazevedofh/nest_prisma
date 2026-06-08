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

describe('Users (e2e)', () => {
	let app: INestApplication
	let databaseService: DatabaseService
	let createdUserIds: number[] = []

	const makeCreateUserDto = () => {
		const unique = `${Date.now()}-${faker.number.int({ min: 1000, max: 9999 })}`

		return {
			name: faker.person.fullName(),
			email: `user-${unique}@example.com`,
			password: `Aa1!${faker.string.alphanumeric(8)}`
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
			createUserDto,
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
		if (createdUserIds.length > 0) {
			await databaseService.user.deleteMany({
				where: {
					id: {
						in: createdUserIds
					}
				}
			})
		}

		createdUserIds = []
	})

	afterAll(async () => {
		await databaseService.$disconnect()
		await app.close()
	})

	describe('/users', () => {
		it('/users (POST) - createUser', async () => {
			const createUserDto = makeCreateUserDto()

			const response = await request(app.getHttpServer())
				.post('/users')
				.send(createUserDto)
				.expect(201)

			createdUserIds.push(response.body.id)

			expect(response.body).toEqual(
				expect.objectContaining({
					id: expect.any(Number),
					name: createUserDto.name,
					email: createUserDto.email
				})
			)
		})

		it('/users (POST) - should return bad request with invalid email', async () => {
			const createUserDto = {
				...makeCreateUserDto(),
				email: 'invalid-email'
			}

			const response = await request(app.getHttpServer())
				.post('/users')
				.send(createUserDto)
				.expect(400)

			expect(response.body.statusCode).toBe(400)
			expect(response.body.message).toEqual(
				expect.objectContaining({
					statusCode: 400,
					error: 'Bad Request'
				})
			)
		})

		it('/users (POST) - should return bad request with weak password', async () => {
			const createUserDto = {
				...makeCreateUserDto(),
				password: '12345678'
			}

			const response = await request(app.getHttpServer())
				.post('/users')
				.send(createUserDto)
				.expect(400)

			expect(response.body.statusCode).toBe(400)
			expect(response.body.message).toEqual(
				expect.objectContaining({
					statusCode: 400,
					error: 'Bad Request'
				})
			)
		})

		it('/users/:id (GET) - findOneUser', async () => {
			const createUserDto = makeCreateUserDto()

			const createResponse = await request(app.getHttpServer())
				.post('/users')
				.send(createUserDto)
				.expect(201)

			createdUserIds.push(createResponse.body.id)

			const response = await request(app.getHttpServer())
				.get(`/users/${createResponse.body.id}`)
				.expect(200)

			expect(response.body).toEqual(
				expect.objectContaining({
					id: createResponse.body.id,
					name: createUserDto.name,
					email: createUserDto.email,
					avatar: null,
					tasks: expect.any(Array)
				})
			)
		})

		it('/users/:id (GET) - should return user not found', async () => {
			await request(app.getHttpServer())
				.get('/users/999999')
				.expect(400)
		})

		it('/users/:id (PUT) - updateUser', async () => {
			const { userId, token, createUserDto } = await createUserAndLogin()
			const updateUserDto = {
				name: faker.person.fullName(),
				password: `Bb2@${faker.string.alphanumeric(8)}`
			}

			const response = await request(app.getHttpServer())
				.put(`/users/${userId}`)
				.set('Authorization', `Bearer ${token}`)
				.send(updateUserDto)
				.expect(200)

			expect(response.body).toEqual(
				expect.objectContaining({
					id: userId,
					name: updateUserDto.name,
					email: createUserDto.email
				})
			)
		})

		it('/users/:id (PUT) - should return unauthorized without token', async () => {
			const createUserDto = makeCreateUserDto()

			const createResponse = await request(app.getHttpServer())
				.post('/users')
				.send(createUserDto)
				.expect(201)

			createdUserIds.push(createResponse.body.id)

			const response = await request(app.getHttpServer())
				.put(`/users/${createResponse.body.id}`)
				.send({ name: faker.person.fullName() })
				.expect(400)

			expect(response.body.statusCode).toBe(401)
		})

		it('/users/:id (PUT) - should return unauthorized with token from another user', async () => {
			const owner = await createUserAndLogin()
			const otherUser = await createUserAndLogin()

			const response = await request(app.getHttpServer())
				.put(`/users/${otherUser.userId}`)
				.set('Authorization', `Bearer ${owner.token}`)
				.send({ name: faker.person.fullName() })
				.expect(400)

			expect(response.body.statusCode).toBe(401)
		})

		it('/users/:id (PUT) - should return user not found with valid token', async () => {
			const { token } = await createUserAndLogin()

			await request(app.getHttpServer())
				.put('/users/999999')
				.set('Authorization', `Bearer ${token}`)
				.send({ name: faker.person.fullName() })
				.expect(400)
		})

		it('/users/:id (DELETE) - deleteUser', async () => {
			const { userId, token } = await createUserAndLogin()

			const deleteResponse = await request(app.getHttpServer())
				.delete(`/users/${userId}`)
				.set('Authorization', `Bearer ${token}`)
				.expect(200)

			expect(deleteResponse.body).toEqual({
				message: 'User deleted successfully'
			})

			createdUserIds = createdUserIds.filter((id) => id !== userId)

			await request(app.getHttpServer())
				.get(`/users/${userId}`)
				.expect(400)
		})

		it('/users/:id (DELETE) - should return unauthorized without token', async () => {
			const createUserDto = makeCreateUserDto()

			const createResponse = await request(app.getHttpServer())
				.post('/users')
				.send(createUserDto)
				.expect(201)

			createdUserIds.push(createResponse.body.id)

			const response = await request(app.getHttpServer())
				.delete(`/users/${createResponse.body.id}`)
				.expect(400)

			expect(response.body.statusCode).toBe(401)
		})

		it('/users/:id (DELETE) - should return unauthorized with token from another user', async () => {
			const owner = await createUserAndLogin()
			const otherUser = await createUserAndLogin()

			const response = await request(app.getHttpServer())
				.delete(`/users/${otherUser.userId}`)
				.set('Authorization', `Bearer ${owner.token}`)
				.expect(400)

			expect(response.body.statusCode).toBe(401)
		})

		it('/users/:id (DELETE) - should return user not found with valid token', async () => {
			const { token } = await createUserAndLogin()

			await request(app.getHttpServer())
				.delete('/users/999999')
				.set('Authorization', `Bearer ${token}`)
				.expect(400)
		})
	})

	describe('/auth', () => {
		it('/auth (POST) - should return unauthorized with invalid credentials', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth')
				.send({
					email: faker.internet.email().toLowerCase(),
					password: `Aa1!${faker.string.alphanumeric(8)}`
				})
				.expect(400)

			expect(response.body.statusCode).toBe(401)
		})
	})
})
