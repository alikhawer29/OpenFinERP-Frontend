import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';
import { Form, Formik } from 'formik';

import { getAccountsbyType } from '../../../../Services/Transaction/JournalVoucher';
import { ledgerOptions } from '../../../../Utils/Constants/SelectOptions';

import BeneficiaryRegisterForm from '../../../../Components/BeneficiaryRegisterForm/BeneficiaryRegisterForm';
import ChartOfAccountForm from '../../../../Components/ChartOfAccountForm/ChartOfAccountForm';
import CustomButton from '../../../../Components/CustomButton';
import CustomInput from '../../../../Components/CustomInput';
import CustomModal from '../../../../Components/CustomModal';
import PartyLedgerForm from '../../../../Components/PartyLedgerForm/PartyLedgerForm';
import SearchableSelect from '../../../../Components/SearchableSelect/SearchableSelect';
import WalkInCustomerForm from '../../../../Components/WalkInCustomerForm/WalkInCustomerForm';
import { usePageTitle } from '../../../../Hooks/usePageTitle';

const GeneratePostDatedChequeReport = () => {
  usePageTitle('Post Dated Cheque Report');

  const [selectedLedger, setSelectedLedger] = useState('all');
  const [showAddLedgerModal, setShowAddLedgerModal] = useState('');

  const navigate = useNavigate();

  const handleSubmit = (values) => {
    navigate('generated', { state: values });
  };

  const {
    data: partyAccounts,
    isLoading: isLoadingParty,
    isError: isErrorParty,
    error: errorParty,
  } = useQuery({
    queryKey: ['accounts', 'party'],
    queryFn: () => getAccountsbyType('party'),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: generalAccounts,
    isLoading: isLoadingGeneral,
    isError: isErrorGeneral,
    error: errorGeneral,
  } = useQuery({
    queryKey: ['accounts', 'general'],
    queryFn: () => getAccountsbyType('general'),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: walkinAccounts,
    isLoading: isLoadingWalkin,
    isError: isErrorWalkin,
    error: errorWalkin,
  } = useQuery({
    queryKey: ['accounts', 'walkin'],
    queryFn: () => getAccountsbyType('walkin'),
    staleTime: 1000 * 60 * 5,
  });

  const accountData = {
    party: {
      data: partyAccounts,
      loading: isLoadingParty,
      error: isErrorParty,
      errorMessage: errorParty,
    },
    general: {
      data: generalAccounts,
      loading: isLoadingGeneral,
      error: isErrorGeneral,
      errorMessage: errorGeneral,
    },
    walkin: {
      data: walkinAccounts,
      loading: isLoadingWalkin,
      error: isErrorWalkin,
      errorMessage: errorWalkin,
    },
  };

  const getAccountsByTypeOptions = (accountType) => {
    if (!accountType) {
      return [{ label: 'Select Ledger', value: null, isDisabled: true }];
    }

    const { data, loading } = accountData[accountType] || {};

    if (loading) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }

    let options =
      data?.map((x) => ({
        value: x?.id,
        label: x?.title,
      })) || [];
    switch (accountType) {
      case 'party':
        options.push({ label: `Add New PL`, value: null });
        break;
      case 'general':
        options.push({ label: `Add New GL`, value: null });
        break;
      case 'walkin':
        options.push({ label: `Add New WIC`, value: null });
        break;
      default:
        break;
    }
    return options;
  };

  const renderAddLedgerForm = () => {
    switch (showAddLedgerModal) {
      case 'add new pl':
        return (
          <PartyLedgerForm
            inPopup
            onSuccess={(newlyCreatedAccount) => {
              setNewlyCreatedAccount(newlyCreatedAccount);
              setShowAddLedgerModal('');
            }}
            onCancel={() => setShowAddLedgerModal('')}
          />
        );
      case 'add new wic':
        return (
          <WalkInCustomerForm
            inPopup
            onSuccess={(newlyCreatedAccount) => {
              setNewlyCreatedAccount(newlyCreatedAccount);
              setShowAddLedgerModal('');
            }}
            onCancel={() => setShowAddLedgerModal('')}
          />
        );
      case 'add new gl':
        return (
          <ChartOfAccountForm
            inPopup
            onSuccess={(newlyCreatedAccount) => {
              setNewlyCreatedAccount(newlyCreatedAccount);
              setShowAddLedgerModal('');
            }}
            onCancel={() => setShowAddLedgerModal('')}
          />
        );
      case 'add new beneficiary':
        return (
          <BeneficiaryRegisterForm
            inPopup
            onSuccess={(newlyCreatedAccount) => {
              setNewlyCreatedAccount(newlyCreatedAccount);
              setNewlyCreatedBeneficiary(newlyCreatedAccount);
              setShowAddLedgerModal('');
            }}
            onCancel={() => setShowAddLedgerModal('')}
          />
        );
      default:
        break;
    }
  };

  return (
    <section>
      <div className="d-flex gap-3 justify-content-between flex-wrap mb-4">
        <h2 className="screen-title mb-0">Generate Post Dated Cheque Report</h2>
      </div>
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={{
                pdc_type: 'all',
                ledger_type: 'all',
                from_account: '',
                to_account: '',
                sort_by: 'account',
                cheque_status: 'all',
                cheque_no_from: '',
                cheque_no_to: '',
                amount_from: '',
                amount_to: '',
                due_date_from: '',
                due_date_to: '',
                report_as_of_date: '',
              }}
              // validationSchema={generateJournalReportValidationSchema}
              onSubmit={handleSubmit}
            >
              {({
                values,
                errors,
                handleChange,
                handleBlur,
                setFieldValue,
              }) => (
                <Form>
                  <div className="row mb-4">
                    {/* pdc */}
                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        label="PDC"
                        name="pdc_type"
                        id="pdc_type"
                        options={[
                          { value: 'all', label: 'All' },
                          { value: 'received', label: 'Received' },
                          { value: 'issued', label: 'Issued' },
                        ]}
                        value={values.pdc_type}
                        onChange={(v) => {
                          setFieldValue('pdc_type', v.value);
                        }}
                        placeholder="Select PDC Type"
                        error={errors.pdc_type}
                      />
                    </div>
                    {/* ledger */}
                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        label="Ledger"
                        name="ledger_type"
                        id="ledger_type"
                        options={[
                          { label: 'All', value: 'all' },
                          ...ledgerOptions,
                        ]}
                        value={values.ledger_type}
                        onChange={(v) => {
                          setFieldValue('ledger_type', v.value);
                        }}
                        placeholder="Select Ledger"
                        error={errors.ledger_type}
                      />
                    </div>
                    {/* from account */}
                    {values?.ledger_type !== 'all' && (
                      <div className="col-12 col-sm-6 mb-3">
                        <SearchableSelect
                          label="From Account"
                          name="from_account"
                          id="from_account"
                          options={getAccountsByTypeOptions(
                            values.ledger_type,
                            false
                          )}
                          value={values.from_account}
                          onChange={(v) => {
                            setFieldValue('from_account', v.value);
                          }}
                          placeholder="Select Account"
                          error={errors.from_account}
                        />
                      </div>
                    )}
                    {/* to account */}
                    {values?.ledger_type !== 'all' && (
                      <div className="col-12 col-sm-6 mb-3">
                        <SearchableSelect
                          label="To Account"
                          name="to_account"
                          id="to_account"
                          options={getAccountsByTypeOptions(
                            values.ledger_type,
                            false
                          )}
                          value={values.to_account}
                          onChange={(v) => {
                            setFieldValue('to_account', v.value);
                          }}
                          placeholder="Select Account"
                          error={errors.to_account}
                        />
                      </div>
                    )}
                    {/* sort by */}
                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        label="Sort By"
                        name="sort_by"
                        id="sort_by"
                        options={[
                          { value: 'account', label: 'Account' },
                          { value: 'due_date', label: 'Due Date' },
                          { value: 'posting_date', label: 'Posting Date' },
                          { value: 'cheque_number', label: 'Cheque Number' },
                          { value: 'amount', label: 'Amount' },
                          { value: 'bank', label: 'Bank' },
                        ]}
                        value={values.sort_by}
                        onChange={(v) => {
                          setFieldValue('sort_by', v.value);
                        }}
                        placeholder="Sort By"
                        error={errors.sort_by}
                      />
                    </div>
                    {/* cheque status */}
                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        label="Cheque Status"
                        name="cheque_status"
                        id="cheque_status"
                        options={
                          values?.pdc_type === 'issued'
                            ? [
                                { value: 'all', label: 'All' },
                                { value: 'opened', label: 'Opened' },
                                { value: 'cancelled', label: 'Cancelled' },
                                { value: 'settled', label: 'Settled' },
                              ]
                            : [
                                { value: 'all', label: 'All' },
                                { value: 'opened', label: 'Opened' },
                                { value: 'settled', label: 'Settled' },
                                { value: 'cancelled', label: 'Cancelled' },
                                {
                                  value: 'discounted_collection',
                                  label: 'Discounted Collection',
                                },
                                { value: 'collection', label: 'Collection' },
                              ]
                        }
                        value={values.cheque_status}
                        onChange={(v) => {
                          setFieldValue('cheque_status', v.value);
                        }}
                        placeholder="cheque status"
                        error={errors.cheque_status}
                      />
                    </div>

                    {/* cheque no from */}
                    <div className="col-12">
                      <div className="row flex-wrap">
                        <label htmlFor="cheque_no_from">Cheque No. Range</label>
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name="cheque_no_from"
                            id="cheque_no_from"
                            type="number"
                            placeholder="From"
                            value={values.cheque_no_from}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.cheque_no_from}
                          />
                        </div>

                        {/* cheque no to */}
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name="cheque_no_to"
                            id="cheque_no_to"
                            type="number"
                            placeholder="To"
                            value={values.cheque_no_to}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.cheque_no_to}
                          />
                        </div>
                      </div>
                    </div>

                    {/* amount no from */}
                    <div className="col-12">
                      <div className="row flex-wrap">
                        <label htmlFor="amount_from">Amount Range</label>
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name="amount_from"
                            id="amount_from"
                            type="number"
                            placeholder="From"
                            value={values.amount_from}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.amount_from}
                          />
                        </div>

                        {/* amount no to */}
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name="amount_to"
                            id="amount_to"
                            type="number"
                            placeholder="To"
                            value={values.amount_to}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.amount_to}
                          />
                        </div>
                      </div>
                    </div>

                    {/* date from */}
                    <div className="col-12">
                      <div className="row flex-wrap">
                        <label htmlFor="due_date_from">Due Date Range</label>
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name="due_date_from"
                            id="due_date_from"
                            type="date"
                            placeholder="From"
                            value={values.due_date_from}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.due_date_from}
                          />
                        </div>

                        {/* date to */}
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name="due_date_to"
                            id="due_date_to"
                            type="date"
                            placeholder="To"
                            value={values.due_date_to}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.due_date_to}
                          />
                        </div>
                      </div>
                    </div>

                    {/* posting date from */}
                    <div className="col-12">
                      <div className="row flex-wrap">
                        <label htmlFor="posting_date_from">
                          Posting Date Range
                        </label>
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name="posting_date_from"
                            id="posting_date_from"
                            type="date"
                            placeholder="From"
                            value={values.posting_date_from}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.posting_date_from}
                          />
                        </div>

                        {/* posting date to */}
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name="posting_date_to"
                            id="posting_date_to"
                            type="date"
                            placeholder="To"
                            value={values.posting_date_to}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.posting_date_to}
                          />
                        </div>
                      </div>
                    </div>

                    {/* report as of date */}
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        label="Report As of Date"
                        name="report_as_of_date"
                        id="report_as_of_date"
                        type="date"
                        value={values.report_as_of_date}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.report_as_of_date}
                      />
                    </div>
                  </div>

                  <div className="d-flex mb-4">
                    <CustomButton type="submit" text="Generate" />
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
      {/* Add New Ledger Modal */}
      <CustomModal
        show={!!showAddLedgerModal}
        close={() => setShowAddLedgerModal('')}
        size="xl"
        style={{ minHeight: '812px' }}
      >
        {renderAddLedgerForm()}
      </CustomModal>
    </section>
  );
};

export default GeneratePostDatedChequeReport;
