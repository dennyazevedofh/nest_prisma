import { DatabaseService } from '../database/database.service'
import { HashingServiceProtocol } from '../auth/hash/hashing.service'
import { CreateUserDto } from './dto/create.user.dto'
import { UsersService } from './users.service'
import { Test, TestingModule } from '@nestjs/testing'
import { HttpStatus, HttpException } from '@nestjs/common'
import { describe } from 'node:test'
import { UpdateUserDto } from './dto/update.user.dto'
import { PayloadTokenDto } from '../auth/dto/payload-token.dto'
import * as fs from 'node:fs'


describe('UsersService', () => {
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
								name: 'John Doe',
								email: 'john.doe@example.com'
							}),
							findUnique: jest.fn(),
							findFirst: jest.fn(),
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
		it('should create a new user', async () => {
			const createUserDto: CreateUserDto = {
				name: 'John Doe',
				email: 'john.doe@example.com',
				password: 'Mn@134gh'
			}

			jest.spyOn(hashingService, 'hash').mockResolvedValue('HASH_MOCK_EXAMPLE')

			const result = await usersService.create(createUserDto)

			expect(hashingService.hash).toHaveBeenCalled()
			expect(databaseService.user.create).toHaveBeenCalledWith({
				data: {
					name: createUserDto.name,
					email: createUserDto.email,
					passwordHash: 'HASH_MOCK_EXAMPLE'
				},
				select: {
					id: true,
					name: true,
					email: true,
				}
			})
			expect(result).toEqual({
				id: 1,
				name: 'John Doe',
				email: 'john.doe@example.com'
			})
		})

		it('should throw an error when create user fails', async () => {
			const createUserDto: CreateUserDto = {
				name: 'John Doe',
				email: 'john.doe@example.com',
				password: 'Mn@134gh'
			}

			jest.spyOn(hashingService, 'hash').mockResolvedValue('HASH_MOCK_EXAMPLE')
			jest.spyOn(databaseService.user, 'create').mockRejectedValue(new Error('Database error'))

			await expect(usersService.create(createUserDto)).rejects.toThrow(
				new HttpException('Failed to create user', HttpStatus.INTERNAL_SERVER_ERROR)
			)
			expect(hashingService.hash).toHaveBeenCalledWith(createUserDto.password)
			expect(databaseService.user.create).toHaveBeenCalledWith({
				data: {
					name: createUserDto.name,
					email: createUserDto.email,
					passwordHash: 'HASH_MOCK_EXAMPLE'
				},
				select: {
					id: true,
					name: true,
					email: true,
				}
			})
		})
	})

	describe('find one user', () => {
		it('should return a user when found', async () => {
			const mockUser = {
				id: 1,
				name: 'John Doe',
				email: 'john.doe@example.com',
				avatar: null,
				tasks: [],
				passwordHash: 'HASH_MOCK_EXAMPLE',
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
		it('should throw exception when user not found', async () => {
			const updateUserDto: UpdateUserDto = {
				name: 'John Doe',
				email: 'john.doe@example.com',
				password: 'Mn@134gh'
			}
			const tokenPayload: PayloadTokenDto = {
				sub: 1,
				aud: '',
				email: 'john.doe@example.com',
				exp: 123,
				iat: 123,
				iss: ''
			}

			jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(null)

			await expect(usersService.update(1, updateUserDto, tokenPayload)).rejects.toThrow(
				new HttpException('User not found', HttpStatus.BAD_REQUEST)
			)
		})

		it('should throw exception when user is unauthorized', async () => {
			const updateUserDto: UpdateUserDto = {
				name: 'John Doe',
				email: 'john.doe@example.com',
				password: 'Mn@134gh'
			}
			const tokenPayload: PayloadTokenDto = {
				sub: 1,
				aud: '',
				email: 'john.doe@example.com',
				exp: 123,
				iat: 123,
				iss: ''
			}
			const mockUser = {
				id: 2,
				name: 'Bob Smith',
				email: 'bob.smith@example.com',
				avatar: null,
				tasks: [],
				passwordHash: 'HASH_MOCK_EXAMPLE',
				active: true,
				createdAt: new Date()
			}

			jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(mockUser)

			await expect(usersService.update(1, updateUserDto, tokenPayload)).rejects.toThrow(
				new HttpException('Unauthorized to update this user', HttpStatus.UNAUTHORIZED)
			)
		})
	})

	describe('delete user', () => {
		it('should delete a user when token owner matches', async () => {
			const tokenPayload: PayloadTokenDto = {
				sub: 1,
				aud: '',
				email: 'john.doe@example.com',
				exp: 123,
				iat: 123,
				iss: ''
			}
			const mockUser = {
				id: 1,
				name: 'John Doe',
				email: 'john.doe@example.com',
				avatar: null,
				tasks: [],
				passwordHash: 'HASH_MOCK_EXAMPLE',
				active: true,
				createdAt: new Date()
			}

			jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(mockUser)
			jest.spyOn(databaseService.user, 'delete').mockResolvedValue(mockUser)

			const result = await usersService.delete(1, tokenPayload)

			expect(databaseService.user.findUnique).toHaveBeenCalledWith({
				where: { id: 1 }
			})
			expect(databaseService.user.delete).toHaveBeenCalledWith({
				where: { id: 1 }
			})
			expect(result).toEqual({ message: 'User deleted successfully' })
		})

		it('should throw exception when user not found', async () => {
			const tokenPayload: PayloadTokenDto = {
				sub: 1,
				aud: '',
				email: 'john.doe@example.com',
				exp: 123,
				iat: 123,
				iss: ''
			}

			jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(null)

			await expect(usersService.delete(1, tokenPayload)).rejects.toThrow(
				new HttpException('User not found', HttpStatus.BAD_REQUEST)
			)
			expect(databaseService.user.delete).not.toHaveBeenCalled()
		})

		it('should throw exception when user is unauthorized', async () => {
			const tokenPayload: PayloadTokenDto = {
				sub: 1,
				aud: '',
				email: 'john.doe@example.com',
				exp: 123,
				iat: 123,
				iss: ''
			}
			const mockUser = {
				id: 2,
				name: 'Bob Smith',
				email: 'bob.smith@example.com',
				avatar: null,
				tasks: [],
				passwordHash: 'HASH_MOCK_EXAMPLE',
				active: true,
				createdAt: new Date()
			}

			jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(mockUser)

			await expect(usersService.delete(1, tokenPayload)).rejects.toThrow(
				new HttpException('Unauthorized to update this user', HttpStatus.UNAUTHORIZED)
			)
			expect(databaseService.user.delete).not.toHaveBeenCalled()
		})
	})

	describe('upload avatar image', () => {
		it('should upload avatar image and update user avatar', async () => {
			const tokenPayload: PayloadTokenDto = {
				sub: 1,
				aud: '',
				email: 'john.doe@example.com',
				exp: 123,
				iat: 123,
				iss: ''
			}
			const file = {
				mimetype: 'image/png',
				originalname: 'avatar.png',
				buffer: Buffer.from('fake-image-content')
			} as Express.Multer.File
			const mockUser = {
				id: 1,
				name: 'John Doe',
				email: 'john.doe@example.com',
				avatar: null,
				tasks: [],
				passwordHash: 'HASH_MOCK_EXAMPLE',
				active: true,
				createdAt: new Date()
			}
			const updatedUser = {
				id: 1,
				name: 'John Doe',
				email: 'john.doe@example.com',
				avatar: '1.png',
				passwordHash: 'HASH_MOCK_EXAMPLE',
				active: true,
				createdAt: new Date()
			}

			jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined)
			jest.spyOn(databaseService.user, 'findFirst').mockResolvedValue(mockUser)
			jest.spyOn(databaseService.user, 'update').mockResolvedValue(updatedUser)

			const result = await usersService.uploadAvatarImage(tokenPayload, file)

			expect(fs.promises.writeFile).toHaveBeenCalled()
			expect(databaseService.user.findFirst).toHaveBeenCalledWith({
				where: { id: tokenPayload.sub }
			})
			expect(databaseService.user.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					avatar: '1.png'
				},
				select: {
					id: true,
					name: true,
					email: true,
					avatar: true
				}
			})
			expect(result).toEqual(updatedUser)
		})

		it('should throw an error when user is not found', async () => {
			const tokenPayload: PayloadTokenDto = {
				sub: 1,
				aud: '',
				email: 'john.doe@example.com',
				exp: 123,
				iat: 123,
				iss: ''
			}
			const file = {
				mimetype: 'image/png',
				originalname: 'avatar.png',
				buffer: Buffer.from('fake-image-content')
			} as Express.Multer.File

			jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined)
			jest.spyOn(databaseService.user, 'findFirst').mockResolvedValue(null)

			await expect(usersService.uploadAvatarImage(tokenPayload, file)).rejects.toThrow(
				new HttpException('Failed to upload avatar image', HttpStatus.INTERNAL_SERVER_ERROR)
			)
			expect(databaseService.user.update).not.toHaveBeenCalled()
		})

		it('should throw an error when upload fails', async () => {
			const tokenPayload: PayloadTokenDto = {
				sub: 1,
				aud: '',
				email: 'john.doe@example.com',
				exp: 123,
				iat: 123,
				iss: ''
			}
			const file = {
				mimetype: 'image/png',
				originalname: 'avatar.png',
				buffer: Buffer.from('fake-image-content')
			} as Express.Multer.File

			jest.spyOn(fs.promises, 'writeFile').mockRejectedValue(new Error('File system error'))

			await expect(usersService.uploadAvatarImage(tokenPayload, file)).rejects.toThrow(
				new HttpException('Failed to upload avatar image', HttpStatus.INTERNAL_SERVER_ERROR)
			)
			expect(databaseService.user.findFirst).not.toHaveBeenCalled()
			expect(databaseService.user.update).not.toHaveBeenCalled()
		})
	})
})