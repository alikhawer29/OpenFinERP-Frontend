import React, { useState, useEffect } from 'react';
import { usePagination } from '../Hooks/usePagination';

const withPagination = (WrappedComponent) => (props) => {
  const [filters, setFilters] = useState({ page: 1, per_page: 10 });
  const [pagination, updatePagination] = usePagination(
    filters.page,
    filters.per_page
  );

  useEffect(() => {
    updatePagination({ perPage: filters.per_page });
  }, [filters.per_page, updatePagination]);

  return (
    <WrappedComponent
      {...props}
      filters={filters}
      setFilters={setFilters}
      pagination={pagination}
      updatePagination={updatePagination}
    />
  );
};

export default withPagination;
