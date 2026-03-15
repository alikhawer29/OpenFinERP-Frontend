import React, { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import CustomButton from '../../../Components/CustomButton';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import { generateRateReValuationAccounts, getRateReValuationAccounts, getRateReValuationListing, postRateReValuationAccounts, reCalculateRateReValuationAccounts } from '../../../Services/Process/ProfitAndLossPosting';
import { rateRevaluationHeaders } from '../../../Utils/Constants/TableHeaders';
import { reportPrint, showErrorToast } from '../../../Utils/Utils';
import { showToast } from '../../../Components/Toast/Toast';
import { useQuery } from '@tanstack/react-query';
import CustomSelect from '../../../Components/CustomSelect';
import BackButton from '../../../Components/BackButton';
import useModulePermissions from '../../../Hooks/useModulePermissions';

const RateReValuation = ({ filters, setFilters, showModal, closeModal }) => {
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [postLoading, setPostLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [recalculateLoading, setRecalculateLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [account, setAccount] = useState();

  const permissions = useModulePermissions("process" , "profit_loss_posting")
  const {print} = permissions;


  const {
    data: rateReValuationData,
    isLoading: isLoadingRateReValuation,
    isError: isErrorRateReValuation,
    error: rateReValuationError,
    refetch: refetchRateReValuation,
  } = useQuery({
    queryKey: ['rateReValuationListing', filters],
    queryFn: ({ queryKey }) => {
      const [, filters] = queryKey;

      const { posting_account_id, ...filteredParams } = filters || {};

      return getRateReValuationListing(filteredParams);
    },
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const {
    data: rateReValuationAccountsData,
  } = useQuery({
    queryKey: ['rateReValuationAccountsData'],
    queryFn: () => getRateReValuationAccounts(),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const handlePostClick = async () => {
    setPostLoading(true)
    try {
      const result = await postRateReValuationAccounts({ posting_account_id: account, date: filters?.date })
      if (result) {
        setPostLoading(false)
        showModal(
          'Rate Valuation',
          result?.message,
          ()=>{
            closeModal()
          },
          'success'
        );
      }
    }
    catch (error) {
      setPostLoading(false)
      showErrorToast(error)
    }
  };

  const handleGenerateClick = async () => {
    setGenerateLoading(true)
    try {
      const result = await generateRateReValuationAccounts({ date: filters?.date })
      if (result) {
        setGenerateLoading(false)
        showToast('Generated successfully', 'success');
        setTableData(result?.detail);
      }
    }
    catch (error) {
      setGenerateLoading(false)
      showErrorToast(error)
    }
  };

  const handleRecalculate = async () => {
    setRecalculateLoading(true)
    try {
      const result = await reCalculateRateReValuationAccounts({ date: filters?.date })
      if (result) {
        setRecalculateLoading(false)
        showToast('Recalculated successfully', 'success');
        // setTableData(result?.detail);
      }
    }
    catch (error) {
      setRecalculateLoading(false)
      showErrorToast(error)
    }
  };

  if (rateReValuationError) {
    showErrorToast(rateReValuationError, 'error');
  }
  const handleRecalculatingClosingRates = () => {
    showToast('Recalculating Closing Rates...', 'success');
  };

  useEffect(() => {
    if (rateReValuationData) {
      setTableData(rateReValuationData);
    }
  }, [rateReValuationData]);


  useEffect(() => {
    if(rateReValuationAccountsData?.length){
      setAccount(rateReValuationAccountsData[0]?.id)
    }
  },[rateReValuationAccountsData])


  useEffect(() => {
    if (typeof setFilters === 'function') {
      setFilters((prev) => ({
        ...prev,
        date: date,
        posting_account_id: 1047
      }));
    }
  }, [date, setFilters]);
  return (
    <>
    <BackButton/>
      <div className="d-flex justify-content-between flex-wrap gap-3 mb-4">
        <div className='w-100 d-flex align-items-center justify-content-between'>
          <h2 className="screen-title flex-shrink-0 mb-0">Rate Re-Valuation</h2>
          {
            print &&
          <div className='d-flex gap-3' >
            <CustomButton text={'Print'} onClick={() => { const params = { date: filters?.date }; reportPrint("profit-loss", params) }} />
          </div>
          }
        </div>
        <div className="d-flex flex-column gap-3 ms-auto w-100">
          <div className="d-flex flex-wrap justify-content-between ">
            <div className='d-flex gap-2 align-items-center' >
              <CustomSelect
                className={'tableSelect'}
                name={"posting_account_id"}
                label="Account"
                value={account}
                onChange={(e) => {
                  setAccount(e.target.value)
                }}
                options={rateReValuationAccountsData?.map((item) => ({
                  label: item?.title,
                  value: item?.id
                }))}
              />
              <CustomButton className={'mt-4'} loading={postLoading} text={'Post'} onClick={handlePostClick} />
              <CustomButton
                className={'mt-4'}
                loading={recalculateLoading}
                text={'Recalculate Closing Rates'}
                variant={'secondaryButton'}
                onClick={() => handleRecalculate()}
              />
            </div>
          </div>
        </div>
      </div>


      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={rateRevaluationHeaders}
            isPaginated={false}
            isLoading={isLoadingRateReValuation}
            hideSearch={true}
            hideItemsPerPage={true}
            selectOptions={[
              // {
              //   label: "Account",
              //   title: 'posting_account_id',
              //   options: rateReValuationAccountsData?.map((item) => ({
              //     label: item?.title,
              //     value: item?.id
              //   })),
              // },
            ]}
            additionalFilters={[
              {
                label: "Date",
                title: 'date',
                type: 'date',
              },
            ]}
          >
            {(rateReValuationData?.length || isErrorRateReValuation) && (
              <tbody>
                {isErrorRateReValuation && (
                  <tr>
                    <td colSpan={rateRevaluationHeaders?.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {rateReValuationData?.map((item, index) => (
                  <tr
                    key={index}
                    className={item?.type === 'total' ? 'fw-bold' : ''}
                  >
                    <td>{item?.group}</td>
                    <td>{item?.currency}</td>
                    <td>{item?.fc_balance}</td>
                    <td>{item?.valuation_rate}</td>
                    <td>{item?.value_in_base}</td>
                    <td>{item?.gain_loss}</td>
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

export default withModal(withFilters(RateReValuation));
