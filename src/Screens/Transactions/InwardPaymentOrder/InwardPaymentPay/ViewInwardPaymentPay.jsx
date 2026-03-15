import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import { useNavigate } from 'react-router-dom';
import AttachmentsView from '../../../../Components/AttachmentsView/AttachmentsView';
import CustomModal from '../../../../Components/CustomModal';
import { showToast } from '../../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import { usePageTitle } from '../../../../Hooks/usePageTitle';
import { deleteInwardPayment, viewInwardPaymentPayDetails } from '../../../../Services/Transaction/InwardPayment';
import { formatNumberForDisplay, showErrorToast } from '../../../../Utils/Utils';

const ViewInwardPaymentPay = ({
    searchTerm,
    setDate,
    setWriteTerm,
    setSearchTerm,
    setPageState,
    permissions,
    hasDeletePermission,
    hasPrintPermission,
}) => {
    const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    usePageTitle('Inward Payment');

    // Always fetch from API when searchTerm is available
    const {
        data: apiData,
        isLoading,
        isFetching,
        isError,
        error,
    } = useQuery({
        queryKey: ['viewInwardPaymentPayDetails', searchTerm],
        queryFn: () => viewInwardPaymentPayDetails(searchTerm),
        enabled: !!searchTerm,
        refetchOnWindowFocus: false,
        retry: 1,
    });

    // Use API data
    const inwardPaymentData = apiData;

    useEffect(() => {
        if (inwardPaymentData) {
            // Set date and write term from API data
            setDate(inwardPaymentData?.order_details?.pay_date || '');
            const settlementNo = inwardPaymentData?.voucher?.voucher_no
                ? `${inwardPaymentData?.type === 'ca' ? 'CA-' : 'DVP-'}${inwardPaymentData.voucher.voucher_no}`
                : '';
            setWriteTerm(settlementNo);
        }
    }, [inwardPaymentData]);

    // Determine type and id from API data
    const paymentType = inwardPaymentData?.type === 'ca' ? 'credit_adjustment' : 'debit_note_payment_voucher';
    const paymentId = inwardPaymentData?.id;
    const settlementNo = inwardPaymentData?.voucher?.voucher_no
        ? `${inwardPaymentData?.type === 'ca' ? 'CA-' : 'DVP-'}${inwardPaymentData.voucher.voucher_no}`
        : '';

    // Mutation: Delete Inward Payment
    const cancelInwardPaymentMutation = useMutation({
        mutationFn: ({ id, type }) => deleteInwardPayment(id, type),
        onSuccess: (success) => {
            queryClient.invalidateQueries(['viewInwardPaymentPayDetails', searchTerm]);
            showToast(success.message, 'success');
            setShowDeleteModal(false); // Close the confirmation modal after success
            navigate(-1);
        },
        onError: (error) => {
            showErrorToast(error);
            setShowDeleteModal(false); // Close modal on error as well
        },
    });

    // Show loading state while fetching data
    if (isLoading || isFetching) {
        return (
            <>
                <div className="d-card">
                    <div className="row">
                        <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
                            <div className="row mb-4">
                                {Array.from({ length: 20 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="col-12 col-sm-6 mb-3 align-items-center"
                                        style={{ height: 56 }}
                                    >
                                        <Skeleton
                                            style={{ marginTop: 28 }}
                                            duration={1}
                                            width={'50%'}
                                            baseColor="#ddd"
                                            height={22}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="d-card mt-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex gap-2">
                            <Skeleton duration={1} width={80} baseColor="#ddd" height={36} />
                            <Skeleton duration={1} width={80} baseColor="#ddd" height={36} />
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (isError) {
        showErrorToast(error);
        return (
            <div className="d-card">
                <p className="text-danger mb-0">Error fetching Inward Payment details</p>
            </div>
        );
    }

    if (!inwardPaymentData) {
        return (
            <div className="d-card">
                <p className="text-danger mb-0">
                    No Inward Payment found for {searchTerm}
                </p>
            </div>
        );
    }

    const allDetails = [
        {
            label: 'Settlement No.',
            value: inwardPaymentData?.voucher?.voucher_no ?
                `${inwardPaymentData?.type === 'ca' ? 'CA-' : 'DVP-'}${inwardPaymentData.voucher.voucher_no}` : null,
        },
        {
            label: 'Debit Note Number',
            value: inwardPaymentData?.order_details?.voucher?.voucher_no
                ? `DBN${inwardPaymentData.order_details.voucher.voucher_no}` : null,
        },
        {
            label: 'Date',
            value: inwardPaymentData?.order_details?.pay_date || null,
        },
        {
            label: 'Account',
            value: inwardPaymentData?.account_details?.title || null,
        },
        {
            label: 'Pay Date',
            value: inwardPaymentData?.order_details?.pay_date || null,
        },
        {
            label: 'Pay Type',
            value: inwardPaymentData?.type === 'ca' ? 'Credit Adjustment' : 'Debit Note Payment Voucher',
        },
        {
            label: 'Order Amount / FC Amount',
            value: inwardPaymentData?.order_details?.fc_amount
                ? `${inwardPaymentData?.order_details?.currency?.currency_code || ''} ${formatNumberForDisplay(inwardPaymentData.order_details.fc_amount, 2)}`
                : null,
        },
        {
            label: 'Beneficiary',
            value: inwardPaymentData?.walkin?.customer_name || null,
        },
        {
            label: 'Mode',
            value: inwardPaymentData?.mode || null,
        },
        {
            label: 'Paid By',
            value: inwardPaymentData?.pay_by?.user_name || null,
        },
        // Additional fields from full payment data
        {
            label: 'Balance Amount',
            value: inwardPaymentData?.balance_amount
                ? `${inwardPaymentData?.order_details?.currency?.currency_code || ''} ${formatNumberForDisplay(inwardPaymentData.balance_amount, 2)}`
                : null,
        },
        {
            label: 'Ref. No.',
            value: inwardPaymentData?.order_details?.ref_no || null,
        },
        {
            label: 'Contact No',
            value: inwardPaymentData?.order_details?.contact_no || inwardPaymentData?.walkin?.mobile_number_full || null,
        },
        {
            label: 'Nationality',
            value: inwardPaymentData?.walkin?.nationalities?.name || null,
        },
        {
            label: 'ID Detail',
            value: (() => {
                if (!inwardPaymentData?.walkin) return null;
                const idDetail = `${inwardPaymentData?.walkin?.id_types?.description || ''}, ${inwardPaymentData?.walkin?.id_number || ''}, ${inwardPaymentData?.walkin?.expiry_date || ''}`
                    .replace(/^, |, $/g, '')
                    .replace(/,\s*,/g, ',') // Remove consecutive commas
                    .trim();
                return idDetail.length > 0 && idDetail !== ',' ? idDetail : null;
            })(),
        },
        {
            label: 'Place of Issue',
            value: inwardPaymentData?.walkin?.issue_place || null,
        },
        {
            label: 'Sender',
            value: inwardPaymentData?.order_details?.sender || null,
        },
        {
            label: 'Sender Nationality',
            value: inwardPaymentData?.sender_nationality?.name || null,
        },
        {
            label: 'Origin',
            value: inwardPaymentData?.origin?.name || null,
        },
        {
            label: 'Purpose',
            value: inwardPaymentData?.purpose?.description || null,
        },
        {
            label: 'Ledger',
            value: inwardPaymentData?.new_ledger || null,
        },
        {
            label: 'Ledger Account',
            value: inwardPaymentData?.ledger_account || null,
        },
        {
            label: 'VAT Type',
            value: inwardPaymentData?.vat_type
                ? inwardPaymentData.vat_type.charAt(0).toUpperCase() + inwardPaymentData.vat_type.slice(1)
                : null,
        },
        {
            label: 'VAT Terms',
            value: inwardPaymentData?.vat_terms
                ? `${inwardPaymentData.vat_terms}${inwardPaymentData?.vat_percentage ? ' - ' + inwardPaymentData.vat_percentage + '%' : ''}`
                : null,
        },
        {
            label: 'Settle Date',
            value: inwardPaymentData?.settle_date || null,
        },
        {
            label: 'Cheque Number',
            value: inwardPaymentData?.cheque?.cheque_number || null,
        },
        {
            label: 'Due Date',
            value: inwardPaymentData?.due_date || null,
        },
        {
            label: 'Amount',
            value: inwardPaymentData?.amount
                ? `${inwardPaymentData?.order_details?.currency?.currency_code || ''} ${formatNumberForDisplay(inwardPaymentData.amount, 2)}`
                : null,
        },
        {
            label: 'Commission',
            value: inwardPaymentData?.commission
                ? formatNumberForDisplay(inwardPaymentData.commission, 2)
                : null,
        },
        {
            label: 'VAT Amount',
            value: inwardPaymentData?.vat_amount
                ? `${inwardPaymentData?.vat_percentage || '0'}% - ${formatNumberForDisplay(inwardPaymentData.vat_amount, 2)}`
                : null,
        },
        {
            label: 'Net Total',
            value: inwardPaymentData?.net_total
                ? formatNumberForDisplay(inwardPaymentData.net_total, 2)
                : null,
        },
        {
            label: 'Narration',
            value: inwardPaymentData?.narration || null,
        },
        {
            label: 'Out of Scope Reason',
            value: inwardPaymentData?.out_of_scope_reason || null,
        },
    ];

    // Filter out fields with no data
    const details = allDetails.filter(detail => detail.value !== null && detail.value !== '' && detail.value !== undefined);

    return (
        <>
            <div className="d-card">
                <div className="row">
                    <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
                        <div className="row">
                            {details.map((x, i) => (
                                <div key={i} className="col-12 col-sm-6 mb-4">
                                    <p className="detail-title detail-label-color mb-1">
                                        {x.label}
                                    </p>
                                    <p className="detail-text wrapText mb-0">
                                        {x.value || '-'}
                                    </p>
                                </div>
                            ))}

                            {/* Signature Display */}
                            {inwardPaymentData?.signature && (
                                <div className="col-12 mb-4">
                                    <p className="detail-title detail-label-color mb-1">
                                        Signature
                                    </p>
                                    <div className="mt-2">
                                        <img
                                            src={inwardPaymentData.signature}
                                            alt="Signature"
                                            style={{ maxWidth: '300px', border: '1px solid #ddd', padding: '10px' }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <VoucherNavigationBar
                searchTerm={searchTerm}
                actionButtons={[
                    ...(inwardPaymentData?.pdf_url && hasPrintPermission
                        ? [
                            {
                                text: 'Print',
                                onClick: () => {
                                    if (inwardPaymentData?.pdf_url) {
                                        window.open(inwardPaymentData.pdf_url, '_blank');
                                    }
                                },
                                variant: 'secondaryButton',
                            },
                        ]
                        : []),
                    ...(hasDeletePermission
                        ? [
                            {
                                text: 'Delete',
                                onClick: () => setShowDeleteModal(true),
                                variant: 'dangerButton',
                            }
                        ]
                        : [])
                ]}
                loading={isLoading || isFetching}
                onAttachmentClick={() => setShowAttachmentsModal(true)}
                setPageState={setPageState}
                setWriteTerm={setWriteTerm}
                setSearchTerm={setSearchTerm}
                lastVoucherNumbersShow={false}
                isNavigationShow={false}
            />

            {/* Attachments Modal */}
            <CustomModal
                show={showAttachmentsModal}
                close={() => setShowAttachmentsModal(false)}
                background={true}
            >
                <AttachmentsView
                    viewOnly
                    item={inwardPaymentData?.voucher}
                    closeUploader={() => setShowAttachmentsModal(false)}
                    voucherAttachment={true}
                    queryToInvalidate={['viewInwardPaymentPayDetails', searchTerm]}
                />
            </CustomModal>

            {/* Delete Confirmation Modal */}
            <CustomModal
                show={showDeleteModal}
                close={() => setShowDeleteModal(false)}
                action={() => {
                    cancelInwardPaymentMutation.mutate({ id: paymentId, type: paymentType });
                }}
                title="Delete"
                description={
                    paymentType === 'credit_adjustment'
                        ? `Are you sure you want to delete Credit Adjustment ${settlementNo}?`
                        : `Are you sure you want to delete Debit Note Payment Voucher ${settlementNo}?`
                }
                disableClick={cancelInwardPaymentMutation.isPending}
            />
        </>
    );
};

export default ViewInwardPaymentPay;

