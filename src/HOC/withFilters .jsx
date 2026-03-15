import React, { useEffect, useState } from 'react';
import { usePagination } from '../Hooks/usePagination';

const withFilters = (WrappedComponent, additionalFilters = {}) => {
  return (props) => {
    const defaultFilters = {
      page: 1,
      per_page: 10,
      search: '',
      from: '',
      to: '',
      status: '',
    };
    const [filters, setFilters] = useState({
      ...defaultFilters,
      ...additionalFilters,
    });
    const [pagination, updatePagination] = usePagination(
      filters?.page,
      filters?.per_page
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
};

export default withFilters;
