export const buildPagination = (page, limit, totalItems) => {
  const totalPages = limit > 0 ? Math.ceil(totalItems / limit) : 0;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null,
  };
};
