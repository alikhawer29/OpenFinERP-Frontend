import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import { useLocation, useNavigate } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import ChartOfAccountForm from '../../../Components/ChartOfAccountForm/ChartOfAccountForm';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import PartyLedgerForm from '../../../Components/PartyLedgerForm/PartyLedgerForm';
import WalkInCustomerForm from '../../../Components/WalkInCustomerForm/WalkInCustomerForm';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { getAccountsbyType } from '../../../Services/Transaction/InternalPaymentVoucher.js';
import { getCurrencyOptions } from '../../../Utils/Utils';
import { getPDCRoucherNumber } from '../../../Services/Transaction/PdcrVoucher.js';
import EditPdcrIssueAsPdcp from './EditPdcrIssueAsPdcp';
import NewPdcrIssueAsPdcp from './NewPdcrIssueAsPdcp';
import PdcrIssueAsPdcpTable from './PdcrIssueAsPdcpTable';
import ViewPdcrIssueAsPdcp from './ViewPdcrIssueAsPdcp';
import useModulePermissions from '../../../Hooks/useModulePermissions.js';

const PdcrIssueAsPdcp = () => {
    usePageTitle('PDCR Issue as PDCP');
    const currencyOptions = getCurrencyOptions();
    const { state } = useLocation();
    const navigate = useNavigate();
    const [pageState, setPageState] = useState(state?.pageState || 'new');
    const [isDisabled, setIsDisabled] = useState(true);
    const [writeTerm, setWriteTerm] = useState(state?.searchTerm || '');
    const [searchTerm, setSearchTerm] = useState(state?.searchTerm || '');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const [showAddLedgerModal, setShowAddLedgerModal] = useState('');
    const [showMissingCurrencyRateModal, setShowMissingCurrencyRateModal] = useState(false);
    const [currencyToSelect, setCurrencyToSelect] = useState(null);
    const [newlyCreatedAccount, setNewlyCreatedAccount] = useState(null);
    const [lastVoucherNumbers, setLastVoucherNumbers] = useState({
        heading: 'Last PDCR Number: ',
        current: '',
        previous: '',
        next: '',
        isLoadingVoucherNumber: false,
        isErrorVoucherNumber: false,
        errorVoucherNumber: null,
    });

    // Get last voucher number
    const {
        data: voucherNumber,
        isLoading: isLoadingVoucherNumber,
        isError: isErrorVoucherNumber,
        error: errorVoucherNumber,
    } = useQuery({
        queryKey: ['voucherNumber', searchTerm],
        queryFn: () => getPDCRoucherNumber(searchTerm),
        refetchOnWindowFocus: false,
        retry: 1,
    });

    useEffect(() => {
        setLastVoucherNumbers({
            heading: 'Last PDCR Number: ',
            last: voucherNumber?.default_voucher_no,
            current: voucherNumber?.current_voucher_no,
            previous: voucherNumber?.previous_voucher_no,
            next: voucherNumber?.next_voucher_no,
            isLoadingVoucherNumber: isLoadingVoucherNumber,
            isErrorVoucherNumber: isErrorVoucherNumber,
            errorVoucherNumber: errorVoucherNumber,
        });
    }, [
        voucherNumber,
        isLoadingVoucherNumber,
        isErrorVoucherNumber,
        errorVoucherNumber,
    ]);

    // Get account options
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

        const { data, loading, error, errorMessage } = accountData[accountType] || {};

        if (loading) {
            return [{ label: 'Loading...', value: null, isDisabled: true }];
        }

        if (error) {
            console.error('Unable to fetch Accounts', errorMessage);
            return [{ label: 'Unable to fetch Accounts', value: null }];
        }

        let options = data?.map((x) => ({
            value: x?.id,
            label: x?.title,
        })) || [];

        switch (accountType) {
            case 'party':
                options.push({
                    label: `Add New PL`,
                    value: 'add new pl',
                });
                break;
            case 'general':
                options.push({
                    label: `Add New GL`,
                    value: 'add new gl',
                });
                break;
            case 'walkin':
                options.push({
                    label: `Add New WIC`,
                    value: 'add new wic',
                });
                break;
            default:
                break;
        }
        return options;
    };

    // Update page state and search term if provided
    useEffect(() => {
        if (state?.pageState) {
            setPageState(state.pageState);
        }
        if (state?.searchTerm) {
            setSearchTerm(state.searchTerm);
            setWriteTerm(state.searchTerm);
        }
    }, [state]);
    const permissions = useModulePermissions('transactions', 'pdcr_payment_voucher');
    const {
        create: hasCreatePermission,
        edit: hasEditPermission,
        delete: hasDeletePermission,
        print: hasPrintPermission,
        view: hasViewPermission,
    } = permissions;
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
            default:
                break;
        }
    };

    const renderPageContent = () => {
        const pageComponents = {
            new: (
                <NewPdcrIssueAsPdcp
                    date={date}
                    setDate={setDate}
                    state={state}
                    getAccountsByTypeOptions={getAccountsByTypeOptions}
                    currencyOptions={currencyOptions}
                    isDisabled={isDisabled}
                    setIsDisabled={setIsDisabled}
                    setSearchTerm={setSearchTerm}
                    setPageState={setPageState}
                    setWriteTerm={setWriteTerm}
                    setShowAddLedgerModal={setShowAddLedgerModal}
                    setCurrencyToSelect={setCurrencyToSelect}
                    setShowMissingCurrencyRateModal={setShowMissingCurrencyRateModal}
                    newlyCreatedAccount={newlyCreatedAccount}
                    lastVoucherNumbers={lastVoucherNumbers}
                    permissions={permissions}
                    hasPrintPermission={hasPrintPermission}
                />
            ),
            view: (
                <ViewPdcrIssueAsPdcp
                    searchTerm={searchTerm}
                    setDate={setDate}
                    setWriteTerm={setWriteTerm}
                    setSearchTerm={setSearchTerm}
                    setPageState={setPageState}
                    lastVoucherNumbers={lastVoucherNumbers}
                    permissions={permissions}
                    hasPrintPermission={hasPrintPermission}
                    hasDeletePermission={hasDeletePermission}
                    hasViewPermission={hasViewPermission}
                    hasEditPermission={hasEditPermission}
                    hasCreatePermission={hasCreatePermission}
                />
            ),
            list: (
                <PdcrIssueAsPdcpTable
                    date={date}
                    setSearchTerm={setSearchTerm}
                    setPageState={setPageState}
                />
            ),
            edit: (
                <EditPdcrIssueAsPdcp
                    date={date}
                    state={state}
                    setDate={setDate}
                    getAccountsByTypeOptions={getAccountsByTypeOptions}
                    currencyOptions={currencyOptions}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    setPageState={setPageState}
                    isDisabled={false}
                    setIsDisabled={setIsDisabled}
                    setShowAddLedgerModal={setShowAddLedgerModal}
                    setCurrencyToSelect={setCurrencyToSelect}
                    setShowMissingCurrencyRateModal={setShowMissingCurrencyRateModal}
                    newlyCreatedAccount={newlyCreatedAccount}
                    lastVoucherNumbers={lastVoucherNumbers}
                    permissions={permissions}
                    hasPrintPermission={hasPrintPermission}
                />
            ),
        };

        return pageComponents[pageState] || null;
    };

    return (
        <>
            <section className="position-relative">
                <div
                    style={{ height: 43 }}
                    className="d-flex gap-3 justify-content-between align-items-center flex-wrap mb-4"
                >
                    <div>
                        {(pageState == 'list' ||
                            pageState == 'view' ||
                            pageState == 'edit' ||
                            (pageState == 'new' && !isDisabled)) && (
                                <BackButton
                                    handleBack={() => {
                                        if (pageState == 'edit') {
                                            setPageState('view');
                                        } else if (pageState == 'new' && !isDisabled) {
                                            setDate(new Date().toISOString().split('T')[0]);
                                            setIsDisabled(true);
                                        } else {
                                            setDate(new Date().toISOString().split('T')[0]);
                                            setPageState('new');
                                            setWriteTerm('');
                                            setSearchTerm('');
                                        }
                                    }}
                                />
                            )}
                        <h2 className="screen-title mb-0">PDCR Issue as PDCP</h2>
                    </div>
                    {hasCreatePermission && pageState == 'new' && isDisabled && (
                        <div className="d-flex gap-2">
                            <CustomButton text={'New'} onClick={() => {
                                setDate(new Date().toISOString().split('T')[0]);
                                setIsDisabled(false);
                            }} />
                        </div>
                    )}
                </div>
                <Row>
                    <Col xs={12}>
                        <div className="d-flex align-items-start justify-content-between flex-wrap-reverse mb-3">
                            <div className="d-flex align-items-end mt-3">
                                <CustomInput
                                    style={{ width: '180px' }}
                                    type="text"
                                    placeholder="Search PDCR"
                                    error={false}
                                    showBorders={false}
                                    borderRadius={10}
                                    name="search"
                                    rightIcon={FaMagnifyingGlass}
                                    value={writeTerm}
                                    onChange={(e) => {
                                        setWriteTerm(e.target.value);
                                    }}
                                    onButtonClick={() => {
                                        setSearchTerm(writeTerm);
                                        if (writeTerm === '') {
                                            setPageState('list');
                                            setDate(new Date().toISOString().split('T')[0]);
                                        } else {
                                            setPageState('view');
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <CustomInput
                                    name="Date"
                                    label={'Date'}
                                    type="date"
                                    showBorders={false}
                                    error={false}
                                    borderRadius={10}
                                    value={date}
                                    readOnly={pageState == 'view'}
                                    onChange={(e) => {
                                        setDate(e.target.value);
                                    }}
                                />
                            </div>
                        </div>
                        {renderPageContent()}
                    </Col>
                </Row>
            </section>

            {/* Add New Ledger Modal */}
            <CustomModal
                show={!!showAddLedgerModal}
                close={() => setShowAddLedgerModal('')}
                size="xl"
            >
                {renderAddLedgerForm()}
            </CustomModal>

            {/* Missing Currency Rate Modal */}
            <CustomModal
                show={showMissingCurrencyRateModal}
                close={() => setShowMissingCurrencyRateModal(false)}
                title={'Missing Rate of Exchange'}
                description={'Rate of exchange is missing for selected currency.'}
                variant={'error'}
                btn1Text={'Update Rate of Exchange'}
                action={() => {
                    navigate('/transactions/remittance-rate-of-exchange', {
                        state: { currencyToSelect },
                    });
                }}
            />
        </>
    );
};

export default PdcrIssueAsPdcp;
