import { from } from "rxjs"
import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException
} from "@nestjs/common"
import { Request, Response } from "express"
import path from "path"
import { timestamp } from "rxjs"

@Catch(HttpException)
export class ApiExecptionFilter implements ExceptionFilter {
	catch(exception: HttpException, host: ArgumentsHost) {
		const ctx = host.switchToHttp()
		const response = ctx.getResponse<Response>()
		const request = ctx.getRequest<Request>()
		const status = exception.getStatus()
		const errorResponse = exception.getResponse()
	}
}