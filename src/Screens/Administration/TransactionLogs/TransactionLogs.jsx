import { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import { getTransactionLogs } from '../../../Services/Administration/TransactionLogs';
import {
  statusClassMap,
  transactionLogsActionOptions,
  transactionTypeLogsOptions,
  transactionTypeOptions,
} from '../../../Utils/Constants/SelectOptions';
import { transactionLogsHeaders } from '../../../Utils/Constants/TableHeaders';
import {
  convertUTCToLocalTime,
  downloadFile,
  getUsersOptions,
  serialNum,
  showErrorToast,
} from '../../../Utils/Utils';

const TransactionLogs = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Transaction Logs');
  const [selectedItem, setSelectedItem] = useState(null);

  const {
    data: { data: transactionLogs = [] } = {},
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'transactionLogs',
    filters,
    updatePagination,
    getTransactionLogs
  );

  const handleEdit = (item) => {
    setSelectedItem(item);
  };

  if (isError) {
    showErrorToast(error);
  }

  function getPastTense(action) {
    const irregulars = {
      delete: 'Deleted',
      edit: 'Edited',
      create: 'created',
      approve: 'approved',
      reject: 'rejected',
      // Add more as needed
    };

    if (!action) return '';

    return (
      irregulars[action] ||
      action.charAt(0).toUpperCase() + action.slice(1) + 'ed'
    );
  }

  const formatTransactionData = (jsonString) => {
    try {
      if (!jsonString) return 'No data available';

      const data = JSON.parse(jsonString);
      let formattedText = '';

      Object.entries(data).forEach(([key, value]) => {
        // Convert key to readable format
        const formattedKey = key
          .replace(/_/g, ' ')
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())
          .trim();

        // Format the value
        const formattedValue = formatValue(key, value);

        if (
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value)
        ) {
          formattedText += `${formattedKey}:\n`;
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            const formattedNestedKey = nestedKey
              .replace(/_/g, ' ')
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (str) => str.toUpperCase())
              .trim();
            const formattedNestedValue = formatValue(nestedKey, nestedValue);
            formattedText += `  ${formattedNestedKey}: ${formattedNestedValue}\n`;
          });
        } else {
          formattedText += `${formattedKey}: ${formattedValue}\n`;
        }
      });

      return formattedText;
    } catch (error) {
      return `Invalid data format: ${error.message}`;
    }
  };

  const formatValue = (key, value) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    if (value === '') {
      return 'Empty';
    }

    // Handle boolean values
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    // Handle numeric values and amounts
    if (
      typeof value === 'number' ||
      (typeof value === 'string' && !isNaN(value) && value.trim() !== '')
    ) {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;

      // Check if it's a rate (should have 8 decimal places)
      if (
        key.includes('rate') ||
        key.includes('exchange_rate')
      ) {
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 8,
          maximumFractionDigits: 8,
        }).format(numValue);
      }

      // Check if it's a monetary amount (should have 2 decimal places)
      if (
        key.includes('amount') ||
        key.includes('total') ||
        key.includes('commission') ||
        key.includes('price')
      ) {
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(numValue);
      }

      // Regular numbers
      return new Intl.NumberFormat('en-US').format(numValue);
    }

    // Handle dates
    if (
      key.includes('date') ||
      key.includes('created') ||
      key.includes('updated') ||
      key.includes('due') ||
      key.includes('time') ||
      key.includes('at')
    ) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
        }
      } catch (e) {
        // Not a valid date, return as is
      }
    }

    // Handle specific string values
    if (typeof value === 'string') {
      // Trim long strings
      if (value.length > 100) {
        return value.substring(0, 100) + '...';
      }

      // Capitalize certain string values
      if (
        key.includes('type') ||
        key.includes('status') ||
        key.includes('mode')
      ) {
        return value
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());
      }

      // Handle "no" "yes" strings
      if (value.toLowerCase() === 'no') return 'No';
      if (value.toLowerCase() === 'yes') return 'Yes';
      if (value.toLowerCase() === 'true') return 'Yes';
      if (value.toLowerCase() === 'false') return 'No';
    }

    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return 'None';
      return value.map((item) => formatValue(key, item)).join(', ');
    }

    return value;
  };

  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap gap-3 mb-3">
          <h2 className="screen-title mb-0">Transaction Logs</h2>
          <div className="d-flex gap-2">
            <CustomButton
              variant="secondaryButton"
              text={'Export to Excel'}
              onClick={() => downloadFile('transaction-log', 'xlsx')}
            />
            <CustomButton
              variant="secondaryButton"
              text={'Export to PDF'}
              onClick={() => downloadFile('transaction-log', 'pdf')}
            />
          </div>
        </div>
        <Row>
          <Col xs={12} className="mb-4">
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={transactionLogsHeaders}
              pagination={pagination}
              isLoading={isLoading}
              // useClearButton={true}
              dateFilters={[
                { title: 'Editing Period', label: 'Editing Period' },
              ]}
              rangeFilters={[{ title: 'Range of No.', label: 'Range of No.' }]}
              selectOptions={[
                {
                  title: 'transaction_type',
                  label: 'Transaction Type',
                  options: transactionTypeLogsOptions,
                },
                {
                  title: 'user',
                  label: 'User',
                  options: [{ label: 'All', value: '' }, ...getUsersOptions()],
                },
                {
                  title: 'action_type',
                  label: 'Action Type',
                  options: transactionLogsActionOptions,
                },
              ]}
            >
              {(transactionLogs.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={transactionLogsHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {transactionLogs?.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        {serialNum(
                          (filters?.page - 1) * filters?.per_page + index + 1
                        )}
                      </td>
                      <td>{item?.transaction_type}</td>
                      <td>{item?.number}</td>

                      <td>{item?.transaction_date}</td>
                      <td>{item?.modification_date}</td>
                      <td>{convertUTCToLocalTime(item?.modification_time)}</td>
                      <td>{item?.voucher?.creator?.user_name}</td>
                      <td>
                        <p
                          onClick={() => handleEdit(item)}
                          className={`mb-0 underlineOnHover cp ${
                            statusClassMap[item?.action_type?.toLowerCase()]
                          }`}
                        >
                          {getPastTense(item?.action_type)}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </CustomTable>
          </Col>
          {/* <Col xs={6} className="mb-5">
            <div>
              <label className="form-label">Old Transaction Details</label>
              <pre
                style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '10px',
                  padding: '15px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  height: '300px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                }}
              >
                {selectedItem?.old_data
                  ? JSON.stringify(JSON.parse(selectedItem.old_data), null, 2)
                  : 'No data available'}
              </pre>
            </div>
          </Col>
          <Col xs={6} className="mb-5">
            <div>
              <label className="form-label">New Transaction Details</label>
              <pre
                style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '10px',
                  padding: '15px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  height: '300px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                }}
              >
                {selectedItem?.new_data
                  ? JSON.stringify(JSON.parse(selectedItem.new_data), null, 2)
                  : 'No data available'}
              </pre>
            </div>
          </Col> */}

          <Col xs={6} className="mb-5">
            <div>
              <label className="form-label">Old Transaction Details</label>
              <div
                style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '10px',
                  padding: '15px',
                  fontSize: '12px',
                  fontFamily: 'Arial, sans-serif',
                  height: '300px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  lineHeight: '1.5',
                }}
              >
                {selectedItem?.old_data
                  ? formatTransactionData(selectedItem.old_data)
                  : 'No data available'}
              </div>
            </div>
          </Col>
          <Col xs={6} className="mb-5">
            <div>
              <label className="form-label">New Transaction Details</label>
              <div
                style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '10px',
                  padding: '15px',
                  fontSize: '12px',
                  fontFamily: 'Arial, sans-serif',
                  height: '300px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  lineHeight: '1.5',
                }}
              >
                {selectedItem?.new_data
                  ? formatTransactionData(selectedItem.new_data)
                  : 'No data available'}
              </div>
            </div>
          </Col>
        </Row>
      </section>
    </>
  );
};

export default withFilters(TransactionLogs);
