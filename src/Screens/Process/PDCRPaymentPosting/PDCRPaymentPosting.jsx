import { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import StatusChip from '../../../Components/StatusChip/StatusChip';
import withFilters from '../../../HOC/withFilters ';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  getPDCRPaymentPosting,
  updateStatusPDCRPaymentPosting,
} from '../../../Services/Process/PDCRPaymentPosting';
import { statusFiltersConfig } from '../../../Utils/Constants/TableFilter';
import { pdcrPaymentPostingHeaders, pdcrPaymentPostingHeadersRights } from '../../../Utils/Constants/TableHeaders';
import {
  formatDate,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useAccountsByType from '../../../Hooks/useAccountsByType';
import useModulePermissions from '../../../Hooks/useModulePermissions';

const PDCRPaymentPosting = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  const queryClient = useQueryClient();
    const permissions = useModulePermissions('process', 'pdc_payment_processing');
    console.log("permissions" , permissions)
    const{settled , revert , return_unpaid} = permissions;

  const [rfAccountOptions, setRfAccountOptions] = useState([
    { value: 'All', label: 'All' },
  ]);
  const [itAccountOptions, setItAccountOptions] = useState([
    { value: 'All', label: 'All' },
  ]);
  // Get account options using custom hook //
  const { getAccountsByTypeOptions } = useAccountsByType();

  // Fetch Ledger-Specific Accounts for Filter
  useEffect(() => {
    if (filters.received_from_ledger) {
      setRfAccountOptions(
        getAccountsByTypeOptions(filters.received_from_ledger, false)
      );
    }
    if (filters.issued_to_ledger) {
      setItAccountOptions(
        getAccountsByTypeOptions(filters.issued_to_ledger, false)
      );
    }
  }, [filters.received_from_ledger, filters.issued_to_ledger]);

  const {
    data: { data: pdcrPaymentPostingData = [] } = {},
    isLoading: isLoadingPdcrPaymentPosting,
    isError: isErrorPdcrPaymentPosting,
    error: pdcrPaymentPostingError,
  } = useFetchTableData(
    'pdcrPaymentPostingListing',
    filters,
    updatePagination,
    getPDCRPaymentPosting
  );

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateStatusPDCRPaymentPosting(id, status),

    // Optimistically update before the server responds
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries(['pdcrPaymentPostingListing']);

      const previousData = queryClient.getQueryData([
        'pdcrPaymentPostingListing',
        filters,
      ]);

      // Optimistically update the cache
      queryClient.setQueryData(
        ['pdcrPaymentPostingListing', filters],
        (old) => {
          if (!old?.data) return old;
          if (status === 'return_unpaid') {
            return {
              ...old,
              data: old.data.filter((item) => item.pdc_issue_id !== id),
            };
          }
          return {
            ...old,
            data: old.data.map((item) =>
              item.pdc_issue_id === id
                ? { ...item, pdcr_posting_status: status }
                : item
            ),
          };
        }
      );

      return { previousData }; // for rollback
    },

    onError: (error, variables, context) => {
      // Rollback to previous data if mutation fails
      if (context?.previousData) {
        queryClient.setQueryData(
          ['pdcrPaymentPostingListing', filters],
          context.previousData
        );
      }
      console.error(`Error updating status`, error);
      showErrorToast(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['pdcrPaymentPostingListing', filters]);
    },
  });

  if (pdcrPaymentPostingError) {
    showErrorToast(pdcrPaymentPostingError, 'error');
  }
  return (
    <>
      <div className="d-flex justify-content-between flex-wrap mb-4">
        <h2 className="screen-title mb-0">PDCR Payment Posting</h2>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={(!settled && !revert && !return_unpaid) ? pdcrPaymentPostingHeadersRights : pdcrPaymentPostingHeaders} 
            pagination={pagination}
            isLoading={isLoadingPdcrPaymentPosting}
            useClearButton
            selectOptions={[
              {
                title: 'cheque_status',
                label: 'Cheque Status',
                options: statusFiltersConfig,
              },
              {
                label: 'Received From Ledger',
                title: 'received_from_ledger',
                options: [
                  { value: '', label: 'All' },
                  { value: 'general', label: 'GL' },
                  { value: 'party', label: 'PL' },
                  { value: 'walkin', label: 'WIC' },
                ],
              },
              {
                label: 'Received From',
                title: 'received_from',
                options: rfAccountOptions,
              },
              {
                label: 'Issued To Ledger',
                title: 'issued_to_ledger',
                options: [
                  { value: '', label: 'All' },
                  { value: 'general', label: 'GL' },
                  { value: 'party', label: 'PL' },
                  { value: 'walkin', label: 'WIC' },
                ],
              },
              {
                label: 'Issued To',
                title: 'issued_to',
                options: itAccountOptions,
              },
            ]}
            additionalFilters={[
              { label: "Due Date" , title: 'due_date', type: 'date' },
            ]}
          >
            {(pdcrPaymentPostingData.length || isErrorPdcrPaymentPosting) && (
              <tbody>
                {isErrorPdcrPaymentPosting && (
                  <tr>
                    <td colSpan={pdcrPaymentPostingHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {pdcrPaymentPostingData?.map((item) => (
                  <tr key={item.pdc_issue_id}>
                    <td>{item?.cheque_number}</td>
                    <td>{formatDate(item?.date)}</td>
                    <td>{item?.fcy}</td>
                    <td>{item?.fcy_amount}</td>
                    <td>{item?.received_from}</td>
                    <td>{item?.issued_to}</td>
                    <td>
                      {
                      !settled && !revert && !return_unpaid ? null :
                      isNullOrEmpty(item.pdcr_posting_status) ||
                      item.pdcr_posting_status === 'revert' ? (
                        <div className="d-flex gap-2">
                          {
                            settled &&
                            <StatusChip
                              onClick={() => {
                                updateStatusMutation.mutate({
                                  id: item.pdc_issue_id,
                                  status: 'settle',
                                });
                              }}
                              status={'Settle'}
                            /> 
                          }
                          {
                            return_unpaid ?
                            <StatusChip
                              onClick={() => {
                                updateStatusMutation.mutate({
                                  id: item.pdc_issue_id,
                                  status: 'return_unpaid',
                                });
                              }}
                              status={'Return Unpaid'}
                            /> : "-"
                          }
                        </div>
                      ) : item.pdcr_posting_status.toLowerCase() ===
                        'settle' ? (
                          revert &&
                        <StatusChip
                          onClick={() => {
                            updateStatusMutation.mutate({
                              id: item.pdc_issue_id,
                              status: 'revert',
                            });
                          }}
                          status={'Revert'}
                        />
                      ) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </CustomTable>
        </Col>
      </Row>
    </>
  );
};

export default withFilters(PDCRPaymentPosting);
