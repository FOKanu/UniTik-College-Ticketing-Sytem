// TODO: wire into repositories once list endpoints have real persistence/filtering.

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export const parsePagination = (query: Record<string, unknown>): PaginationParams => {
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 20;
  return { page, pageSize };
};
