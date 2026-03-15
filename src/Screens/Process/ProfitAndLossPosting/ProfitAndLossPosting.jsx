import { ErrorMessage, Form, Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import withModal from '../../../HOC/withModal';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import './ProfitAndLossPosting.css';
import { showToast } from '../../../Components/Toast/Toast';
import { useMutation } from '@tanstack/react-query';
import { convertProfitAndLossBalances, getProfitAndLossAccounts, postProfitAndLossAccount } from '../../../Services/Process/ProfitAndLossPosting';
import { showErrorToast } from '../../../Utils/Utils';
import useModulePermissions from '../../../Hooks/useModulePermissions';

const pnlSteps = [
  {
    text: 'Re-Calculating Rate',
    explanation: `This option will recalculate the average closing rate for each currency. Based on these closing rates, the system will evaluate the value of each individual currency.
    \nBefore using this option, please ensure that no other users are actively using the system.`,
    buttonText: 'Recalculating Closing Rates',
    accessKey: 're_calculate_closing_rate',
  },
  {
    text: 'Rate Re-Valuation',
    explanation: `This option will calculate the exchange rate differences and transfer the resulting amounts to the Revenue Account for proper accounting treatment.`,
    buttonText: 'Rate Re-Valuation',
    accessKey: 'rate_revaluation',
  },
  {
    text: 'Profit & Loss Balance Conversion',
    explanation: `This process will convert the profit and loss balances from foreign currencies into the base currency.`,
    buttonText: 'Convert Balance',
    accessKey: 'profit_loss_balance_conversion',
  },
  {
    text: 'Profit & Loss Posting',
    explanation: `This option will close your Income and Expense Accounts and transfer the resulting balance to the Retained Earnings or Profit Account under the Capital section.`,
    buttonText: 'Profit & Lost Posting',
    accessKey: 'profit_loss_posting'
  },
];
const ProfitAndLossPosting = ({ showModal, closeModal }) => {
  usePageTitle('Profit & Loss Posting');
  const navigate = useNavigate();
  const [selectedStep, setSelectedStep] = useState(0);
  const [showBalanceConversionModal, setShowBalanceConversionModal] =
    useState(false);
  const [showPostingModal, setShowPostingModal] = useState(false);
  const [accounts, setAccounts] = useState();
  const [profitLossAccount, setProfitLossAccount] = useState();

  const permissions = useModulePermissions("process", "profit_loss_posting")
  const { re_calculate_closing_rate, rate_revaluation, profit_loss_balance_conversion, profit_loss_posting, print } = permissions;

  console.log("permissions", permissions)

  const handleStepAction = () => {
    const actions = [
      () => showToast('Closing Rates Recalculated', 'success'),
      () => navigate('rate-revaluation'),
      () => setShowBalanceConversionModal(true),
      () => setShowPostingModal(true),
    ];
    // showModal(
    //   'Balance',
    //   'Balance has been Written-Off using JV# 17600',
    //   null,
    //   'success'
    // ),

    actions[selectedStep]?.(); // Call the function for the selected step
  };


  const convertBalanceMutation = useMutation({
    mutationFn: (params) => convertProfitAndLossBalances(params),
    onSuccess: () => {
      showToast('Balance Conversion successfull!', 'success');
      setShowBalanceConversionModal(false);
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  const profitAndLossAccounts = useMutation({
    mutationFn: () => getProfitAndLossAccounts(),
    onSuccess: (data) => {
      setAccounts(data);
    }
  });

  const profitAndLossAccount = useMutation({
    mutationFn: (params) => postProfitAndLossAccount(params),
    onSuccess: (data) => {
      setShowPostingModal(false);
      showToast(data?.message, 'success')
      closeModal()
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  const { isPending } = convertBalanceMutation;
  const { isPending: closingStatus } = profitAndLossAccount;

  const handlePostBalanceConversion = (values) => {
    convertBalanceMutation.mutate(values)
  };
  const handlePosting = (values) => {
    showModal(
      '',
      `You have selected closing of income and expense account to ${profitLossAccount} upto ${values?.close_date}. Do you want to proceed?`,
      () => { profitAndLossAccount.mutate(values) },
      'question'
    );
  };

  useEffect(() => {
    profitAndLossAccounts.mutate()
  }, [])

  return (
    <>
      <div className="d-flex justify-content-between flex-wrap mb-4">
        <h2 className="screen-title mb-0">Profit And Loss Process</h2>
      </div>
      <div className="d-card p-0">
        <div className="d-flex flex-column flex-lg-row align-items-stretch">
          <div className="coa-box">
            <h2 className="screen-title-body">Steps</h2>
            {/* <div className="mb-4">
              {pnlSteps.map((step, i) => (
                (
                  step.accessKey === "re_calculate_closing_rate" && re_calculate_closing_rate ||
                  step.accessKey === "rate_revaluation" && rate_revaluation ||
                  step.accessKey === "profit_loss_balance_conversion" && profit_loss_balance_conversion ||
                  step.accessKey === "profit_loss_posting" && profit_loss_posting
                 ) && 
                <button
                  key={i}
                  className={`pnl-button ${selectedStep === i ? 'active' : ''}`}
                  onClick={() => setSelectedStep(i)}
                >
                  {i + 1} - {step.text}
                </button>
              ))}
            </div> */}
            <div className="mb-4">
              {(() => {
                let counter = 0; // manual counter

                return pnlSteps.map((step, i) => {
                  const isVisible =
                    (step.accessKey === "re_calculate_closing_rate" && re_calculate_closing_rate) ||
                    (step.accessKey === "rate_revaluation" && rate_revaluation) ||
                    (step.accessKey === "profit_loss_balance_conversion" && profit_loss_balance_conversion) ||
                    (step.accessKey === "profit_loss_posting" && profit_loss_posting);

                  if (!isVisible) return null;

                  counter++; // increment only for visible items

                  return (
                    <button
                      key={i}
                      className={`pnl-button ${selectedStep === i ? 'active' : ''}`}
                      onClick={() => setSelectedStep(i)}
                    >
                      {counter} - {step.text}
                    </button>
                  );
                });
              })()}
            </div>
            <div className="d-flex">
              <CustomButton
                text={pnlSteps[selectedStep].buttonText}
                onClick={handleStepAction}
              />
            </div>
          </div>
          <div className="coa-box d-flex flex-column">
            <h2 className="screen-title-body">Explanation</h2>
            <p className="pnl-explanation">
              {pnlSteps[selectedStep].explanation
                .split('\n')
                .map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
            </p>
          </div>
        </div>
      </div>
      {/* Profit & Loss Balance Conversion Modal  */}
      <CustomModal
        show={showBalanceConversionModal}
        close={() => setShowBalanceConversionModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle px-5">Profit & Loss Balance Conversion</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{ date: '' }}
            // validationSchema={addOfficeLocationValidationSchema}
            onSubmit={handlePostBalanceConversion}
          >
            {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
              <Form>
                <div className="mb-45">
                  <CustomInput
                    name={'date'}
                    type={'date'}
                    required
                    label={'Select Date of Conversion'}
                    value={values.date}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.date && errors.date}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {/* {!addOfficeLocationMutation.isPending ? ( */}
                  <>
                    <CustomButton loading={isPending} type="submit" text={'Post'} />
                    <CustomButton
                      variant={'secondaryButton'}
                      text={'Cancel'}
                      type={'button'}
                      onClick={() => setShowBalanceConversionModal(false)}
                    />
                  </>
                  {/* ) : (
                    <PulseLoader size={11} className="modalLoader" />
                  )} */}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>
      {/* Profit & Loss Posting Modal  */}
      <CustomModal
        show={showPostingModal}
        close={() => setShowPostingModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle px-5">Profit & Loss Account</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{ profit_loss_account_id: '', close_date: '' }}
            // validationSchema={addOfficeLocationValidationSchema}
            onSubmit={handlePosting}
          >
            {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
              <Form>
                <div className="mb-3">
                  <SearchableSelect
                    name="profit_loss_account_id"
                    label="Profit & Loss Account"
                    required
                    placeholder="Select Account"
                    options={accounts?.map((item) => ({
                      label: item?.title,
                      value: item?.id
                    }))}
                    value={values.profit_loss_account_id}
                    onChange={(v) => { setProfitLossAccount(v.label); setFieldValue('profit_loss_account_id', v.value) }}
                  />
                  <ErrorMessage
                    name="profit_loss_account_id"
                    component="div"
                    className="input-error-message text-danger"
                  />
                </div>
                <div className="mb-45">
                  <CustomInput
                    name={'close_date'}
                    type={'date'}
                    required
                    label={'Close Profit & Loss Upto'}
                    value={values.close_date}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.close_date && errors.close_date}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {/* {!addOfficeLocationMutation.isPending ? ( */}
                  <>
                    <CustomButton type="submit" text={'Post'} />
                    <CustomButton
                      variant={'secondaryButton'}
                      text={'Cancel'}
                      type={'button'}
                      onClick={() => setShowPostingModal(false)}
                    />
                  </>
                  {/* ) : (
                    <PulseLoader size={11} className="modalLoader" />
                  )} */}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>
    </>
  );
};

export default withModal(ProfitAndLossPosting);
