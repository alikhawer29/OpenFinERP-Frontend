import React from 'react';
import ReactPaginate from 'react-paginate';
import './customPagination.css';

const Pagination = ({ pagination, setFilters }) => {
  const { perPage, totalRecords, currentPage, totalPages } = pagination;
  // Ensure perPage is a number and not a string
  const itemsPerPage = parseInt(perPage, 10) || 10;
  const active = currentPage;

  const handlePageChange = (selectedPage) => {
    const newPage = selectedPage.selected + 1; // react-paginate is 0-based, so add 1
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Calculate the range of items being displayed
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalRecords);

  return (
    <div className="customPagination mb-45">
      <div className="d-flex flex-wrap gap-md-0 gap-3 justify-content-between align-items-center">
        <div className="flex-shrink-0">
          <div className="dataTables_info pl-2">
            {' '}
            Showing {totalRecords > 0 ? startItem : 0} To {endItem} Of{' '}
            {totalRecords} Entries
          </div>
        </div>
        <div className="flex-grow-1 d-flex justify-content-end">
          <ReactPaginate
            previousLabel={'Previous'}
            nextLabel={'Next'}
            breakLabel={'...'}
            breakClassName={'break-me'}
            pageCount={totalPages} // total number of pages
            marginPagesDisplayed={2} // number of pages to display at the start and end
            pageRangeDisplayed={3} // number of pages to display around the active page
            onPageChange={handlePageChange} // function to handle page changes
            containerClassName={'pagination text-end d-inline-flex'} // CSS class for the pagination container
            activeClassName={'active'} // CSS class for the active page
            forcePage={active - 1} // Set the current page (adjusted for 0-based index)
          />
        </div>
      </div>
    </div>
  );
};

export default Pagination;
