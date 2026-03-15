import { useState } from 'react';

const withFiltersWithoutPagination = (
  WrappedComponent,
  additionalFilters = {}
) => {
  return (props) => {
    const defaultFilters = {
      search: '',
      from: '',
      to: '',
      status: '',
    };
    const [filters, setFilters] = useState({
      ...defaultFilters,
      ...additionalFilters,
    });

    return (
      <WrappedComponent {...props} filters={filters} setFilters={setFilters} />
    );
  };
};

export default withFiltersWithoutPagination;
