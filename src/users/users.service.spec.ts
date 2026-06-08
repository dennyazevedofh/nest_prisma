import { DatabaseService } from "../database/database.service"
import { HashingServiceProtocol } from "../auth/hash/hashing.service"
import { CreateUserDto } from "./dto/create.user.dto"
import { UsersService } from "./users.service"
import { Test, TestingModule } from "@nestjs/testing"
import { HttpException, HttpStatus } from "@nestjs/common"
import { UpdateUserDto } from "./dto/update.user.dto"
import { PayloadTokenDto } from "../auth/dto/payload-token.dto"
import { create } from "domain"

describe('Users Service Testing', () => {
	let usersService: UsersService
	let databaseService: DatabaseService
	let hashingService: HashingServiceProtocol

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UsersService,
				{
					provide: DatabaseService,
					useValue: {
						user: {
							create: jest.fn().mockResolvedValue({
								id: 1,
								name: 'Jhon Doe',
								email: 'jhon.doe@example.com'
							}),
							findUnique: jest.fn(),
							update: jest.fn(),
							delete: jest.fn()
						}
					}
				},
				{
					provide: HashingServiceProtocol,
					useValue: {
						hash: jest.fn()
					}
				}
			]
		}).compile()

		usersService = module.get<UsersService>(UsersService)
		databaseService = module.get<DatabaseService>(DatabaseService)
		hashingService = module.get<HashingServiceProtocol>(HashingServiceProtocol)
	})

	it('should be defined users service', () => {
		expect(usersService).toBeDefined()
	})

	describe('create user', () => {
		it('should create a user', async () => {
			const createUserDto: CreateUserDto = {
				name: 'Jhon Doe',
				email: 'jhon.doe@example.com',
				password: 'Mn@123gh'
			}

			jest.spyOn(hashingService, 'hash').mockResolvedValue('HASH_MOCK_PASSWORD')

			const result = await usersService.create(createUserDto)
			expect(hashingService.hash).toHaveBeenCalled()
			expect(databaseService.user.create).toHaveBeenCalledWith({
				data: {
					name: createUserDto.name,
					email: createUserDto.email,
					passwordHash: 'HASH_MOCK_PASSWORD',
				},
				select: {
					id: true,
					email: true,
					name: true,
				}
			})
			expect(result).toEqual({
				id: 1,
				name: 'Jhon Doe',
				email: 'jhon.doe@example.com'
			})
		})

		it('should throw an error when create user fails', async () => {
			const createUserDto: CreateUserDto = {
				name: 'Jhon Doe',
				email: 'jhon.doe@example.com',
				password: 'Mn@123gh'
			}
			jest.spyOn(hashingService, 'hash').mockResolvedValue('HASH_MOCK_PASSWORD')
			jest.spyOn(databaseService.user, 'create').mockRejectedValue(new Error('Failed to create user'))

			await expect(usersService.create(createUserDto)).rejects.toThrow(
				new HttpException('Failed to create user', HttpStatus.INTERNAL_SERVER_ERROR)
			)
			expect(hashingService.hash).toHaveBeenCalledWith(createUserDto.password)
			expect(databaseService.user.create).toHaveBeenCalledWith({
				data: {
					name: createUserDto.name,
					email: createUserDto.email,
					passwordHash: 'HASH_MOCK_PASSWORD',
				},
				select: {
					id: true,
					email: true,
					name: true,
				}
			})
		})
	})

	describe('find one user', () => {
		it('should find a user by id', async () => {
			const mockUser = {
				id: 1,
				name: 'Jhon Doe',
				email: 'jhon.doe@example.com',
				avatar: null,
				tasks: [],
				passwordHash: 'HASH_MOCK_PASSWORD',
				active: true,
				createdAt: new Date()
			}

			jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(mockUser)

			const result = await usersService.findOne(1)

			expect(databaseService.user.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: {
					id: true,
					name: true,
					email: true,
					avatar: true,
					tasks: true
				}
			})
			expect(result).toEqual(mockUser)
		})

		it('should throw an error when user not found', async () => {
			jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(null)

			await expect(usersService.findOne(1)).rejects.toThrow(
				new HttpException('User not found', HttpStatus.BAD_REQUEST)
			)
			expect(databaseService.user.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: {
					id: true,
					name: true,
					email: true,
					avatar: true,
					tasks: true
				}
			})
		})
	})

	describe('update user', () => {
		it('should throw an error when user not found', async () => {
			const updateUserDto: UpdateUserDto = {
				name: 'Jhon Doe Updated',
				email: 'jhon.doe@exemple.com',
				password: 'Mn@123gh'
			}
			const tokenPayload: PayloadTokenDto = {
				sub: 1,
				aud: '',
				email: 'jhon.doe@example.com',
				exp: 123,
				iat: 123,
				iss: ''
			}

			jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(null)
			await expect(usersService.update(1, updateUserDto, tokenPayload)).rejects.toThrow(
				new HttpException('User not found', HttpStatus.BAD_REQUEST)
			)
		})
	})
})