import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import CustomFilters from '../CustomFilters/CustomFilters';
import CustomPagination from '../CustomPagination/CustomPagination';
import './customTable.css';
import { FaChevronDown, FaChevronUp, FaPaperclip } from 'react-icons/fa6';
import { AttachmentIcon } from '../../Utils/Constants/TableHeaders';
import useUserStore from '../../Stores/UserStore';

const CustomTable = ({
  filters,
  setFilters,
  selectOptions,
  showFilterBorders,
  checkBoxFilters,
  dateFilters,
  rangeFilters,
  headers,
  isLoading,
  children,
  pagination,
  className,
  styles,
  hasFilters = true,
  isPaginated = true,
  sortKey,
  sortOrder,
  handleSort,
  additionalFilters,
  hideSearch = false,
  hideItemsPerPage = false,
  displayCard = true,
  renderAtEnd,
  useApplyButton = false,
  useClearButton = false,
  summaryRows = null,
  onNonTriggeringFiltersChange = null,
  searchPlaceholder = 'Search',
}) => {
  const user = useUserStore((state) => state.user);
  return (
    <>
      {hasFilters && (
        <CustomFilters
          filters={filters}
          setFilters={setFilters}
          selectOptions={selectOptions}
          showFilterBorders={showFilterBorders}
          checkBoxFilters={checkBoxFilters}
          dateFilters={dateFilters}
          rangeFilters={rangeFilters}
          additionalFilters={additionalFilters}
          hideSearch={hideSearch}
          hideItemsPerPage={hideItemsPerPage}
          useApplyButton={useApplyButton}
          useClearButton={useClearButton}
          onNonTriggeringFiltersChange={onNonTriggeringFiltersChange}
          searchPlaceholder={searchPlaceholder}
        />
      )}
      <div
        className={`${displayCard ? 'd-card p-0 pt-3 pb-1' : ''} ${
          renderAtEnd ? 'mb-3' : 'mb-4'
        }`}
      >
        <div
          className={`customTable position-relative ${
            className ? className : ''
          }`}
          style={{ ...(displayCard ? { minHeight: 'none' } : {}), ...styles }} // <-- Merge styles prop here
        >
          <table>
            <thead>
              <tr>
                {headers.map((header, index) => {
                  // Check if header is the AttachmentIcon marker
                  if (header === AttachmentIcon) {
                    return (
                      <th key={index}>
                        <FaPaperclip />
                      </th>
                    );
                  }
                  // Check if header contains "LC" or "Base Amount" anywhere (string or object with title)
                  const headerText =
                    typeof header === 'string' ? header : header?.title;
                  const containsLC = headerText && /LC/i.test(headerText);
                  const containsBaseAmount =
                    headerText && /Base Amount/i.test(headerText);

                  if (containsLC || containsBaseAmount) {
                    const baseCurrency = user?.base_currency || 'LC';
                    let replacedText = headerText;

                    // Replace "Base Amount" with base currency amount
                    if (containsBaseAmount) {
                      replacedText = replacedText.replace(
                        /Base Amount/gi,
                        `${baseCurrency} Amount`
                      );
                    }

                    // Replace "LC" with base currency
                    if (containsLC) {
                      replacedText = replacedText.replace(/LC/gi, baseCurrency);
                    }

                    // If it's a sortable header (has key property), preserve sorting functionality
                    if (typeof header === 'object' && header?.key) {
                      return (
                        <th
                          key={header.key}
                          onClick={() => handleSort(header.key)}
                          className={`cp ${
                            sortKey === header.key ? sortOrder : 'sorting'
                          }`}
                        >
                          <span className="d-inline">
                            {replacedText}{' '}
                            {sortKey === header.key && sortOrder === 'asc' ? (
                              <FaChevronUp className="d-inline" />
                            ) : sortKey === header.key &&
                              sortOrder === 'desc' ? (
                              <FaChevronDown className="d-inline" />
                            ) : null}
                          </span>
                        </th>
                      );
                    }

                    // For non-sortable headers (string or object without key)
                    return <th key={index}>{replacedText}</th>;
                  }
                  // Check if header is a string or React element
                  if (
                    typeof header === 'string' ||
                    React.isValidElement(header)
                  ) {
                    return <th key={index}>{header}</th>;
                  }
                  // Handle sortable headers (objects with key and title)
                  return (
                    <th
                      key={header.key}
                      onClick={() => handleSort(header.key)}
                      className={`cp ${
                        sortKey === header.key ? sortOrder : 'sorting'
                      }`}
                    >
                      <span className="d-inline">
                        {header.title}{' '}
                        {sortKey === header.key && sortOrder === 'asc' ? (
                          <FaChevronUp className="d-inline" />
                        ) : sortKey === header.key && sortOrder === 'desc' ? (
                          <FaChevronDown className="d-inline" />
                        ) : null}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            {isLoading ? (
              <tbody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: headers.length }).map((_, j) => (
                      <td
                        key={headers[j]}
                        style={{
                          height: className === 'inputTable' ? '78px' : 'unset',
                        }}
                      >
                        <Skeleton duration={1} width={100} baseColor="#ddd" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ) : (
              <>
                {children?.length === 0 || !children ? (
                  <tbody>
                    <tr>
                      <td
                        colSpan={headers?.length}
                        style={{ textAlign: 'center' }}
                      >
                        No Records Found
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  <>
                    {children}
                    {summaryRows && <tbody>{summaryRows}</tbody>}
                  </>
                )}
              </>
            )}
          </table>
        </div>
      </div>
      {renderAtEnd}
      {isPaginated && !(children?.length === 0 || !children) && (
        <CustomPagination pagination={pagination} setFilters={setFilters} />
      )}
    </>
  );
};

export default CustomTable;
