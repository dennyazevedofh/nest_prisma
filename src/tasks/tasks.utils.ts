import { Injectable } from "@nestjs/common"

@Injectable()
export class TasksUtils {
	splitString(str: string): string[] {
		return str.split(' ')
	}
}