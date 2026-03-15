import { useState, useCallback } from 'react';

export const usePagination = (initialPage = 1, initialPerPage = 10) => {
  const [pagination, setPagination] = useState({
    showData: 0,
    currentPage: initialPage,
    totalRecords: 0,
    totalPages: 1,
    perPage: initialPerPage,
  });

  const updatePagination = useCallback((data) => {
    setPagination((prev) => ({
      ...prev,
      ...data,
    }));
  }, []);

  return [pagination, updatePagination];
};
