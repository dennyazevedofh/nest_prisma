import { UsersController } from './users.controller'
import { CreateUserDto } from './dto/create.user.dto'
import { UpdateUserDto } from './dto/update.user.dto'
import { PayloadTokenDto } from '../auth/dto/payload-token.dto'
import * as fs from 'node:fs'

describe('UsersController', () => {
	let controller: UsersController

	const usersServiceMock = {
		findOne: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		uploadAvatarImage: jest.fn()
	}

	beforeEach(() => {
		jest.clearAllMocks()
		controller = new UsersController(usersServiceMock as any)
	})

	it('should find a user by id', async () => {
		const userId = 1

		await controller.findOneUser(userId)

		expect(usersServiceMock.findOne).toHaveBeenCalledWith(userId)
	})

	it('should create a user', async () => {
		const createUserDto: CreateUserDto = {
			name: 'John Doe',
			email: 'john.doe@example.com',
			password: 'Mn@134gh'
		}

		await controller.createUser(createUserDto)

		expect(usersServiceMock.create).toHaveBeenCalledWith(createUserDto)
	})

	it('should update a user', async () => {
		const userId = 1
		const updateUserDto: UpdateUserDto = {
			name: 'John Updated',
			email: 'john.updated@example.com',
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

		await controller.updateUser(userId, updateUserDto, tokenPayload)

		expect(usersServiceMock.update).toHaveBeenCalledWith(userId, updateUserDto, tokenPayload)
	})

	it('should delete a user', async () => {
		const userId = 1
		const tokenPayload: PayloadTokenDto = {
			sub: 1,
			aud: '',
			email: 'john.doe@example.com',
			exp: 123,
			iat: 123,
			iss: ''
		}

		await controller.deleteUser(userId, tokenPayload)

		expect(usersServiceMock.delete).toHaveBeenCalledWith(userId, tokenPayload)
	})

	it('should upload avatar image', async () => {
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

		await controller.uploadAvatar(tokenPayload, file)

		expect(usersServiceMock.uploadAvatarImage).toHaveBeenCalledWith(tokenPayload, file)
	})

	it('should upload multiple files', async () => {
		const tokenPayload: PayloadTokenDto = {
			sub: 1,
			aud: '',
			email: 'john.doe@example.com',
			exp: 123,
			iat: 123,
			iss: ''
		}
		const files = [
			{
				mimetype: 'image/png',
				originalname: 'avatar-1.png',
				buffer: Buffer.from('fake-image-content-1')
			},
			{
				mimetype: 'image/jpeg',
				originalname: 'avatar-2.jpeg',
				buffer: Buffer.from('fake-image-content-2')
			}
		] as Array<Express.Multer.File>

		jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined)

		const result = await controller.uploadFiles(tokenPayload, files)

		expect(fs.promises.writeFile).toHaveBeenCalledTimes(files.length)
		expect(result).toBe(true)
	})
})