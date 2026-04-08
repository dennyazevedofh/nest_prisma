import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create.user.dto';
import { UpdateUserDto } from './dto/update.user.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class UsersService {
	constructor(private readonly databaseService: DatabaseService) { }

	async findOne(id: number) {
		try {
			const user = await this.databaseService.user.findUnique({
				where: { id },
				select: {
					id: true,
					email: true,
					name: true,
					tasks: true
				}
			});

			if (user) return user;

			throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
		} catch (error) {
			throw new HttpException('Failed to find user', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async create(createUserDto: CreateUserDto) {
		try {
			const newUser = await this.databaseService.user.create({
				data: {
					name: createUserDto.name,
					email: createUserDto.email,
					passwordHash: createUserDto.password,
				},
				select: {
					id: true,
					email: true,
					name: true,
				}
			});
			return newUser;
		} catch (error) {
			throw new HttpException('Failed to create user', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async update(id: number, updateUserDto: UpdateUserDto) {
		try {
			const findUser = await this.databaseService.user.findUnique({
				where: { id }
			});

			if (!findUser) {
				throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
			}

			const updatedUser = await this.databaseService.user.update({
				where: { id },
				data: {
					name: updateUserDto.name ? updateUserDto.name : findUser.name,
					passwordHash: updateUserDto.password ? updateUserDto.password : findUser.passwordHash
				},
				select: {
					id: true,
					email: true,
					name: true,
				}
			});

			return updatedUser;
		} catch (error) {
			throw new HttpException('Failed to update user', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async delete(id: number) {
		try {
			const findUser = await this.databaseService.user.findUnique({
				where: { id }
			});

			if (!findUser) {
				throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
			}

			await this.databaseService.user.delete({
				where: { id }
			});

			return { message: 'User deleted successfully' };
		} catch (error) {
			throw new HttpException('Failed to delete user', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}
