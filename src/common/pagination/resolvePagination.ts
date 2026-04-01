import { PaginationDto } from '../dto/pagination.dto';

export function resolvePagination(paginationDto?: PaginationDto) {
	return {
		limit: paginationDto?.limit ?? 10,
		offset: paginationDto?.offset ?? 0
	}
}