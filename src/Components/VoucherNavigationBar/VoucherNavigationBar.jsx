import { FaChevronLeft, FaChevronRight, FaPaperclip } from 'react-icons/fa6';
import Skeleton from 'react-loading-skeleton';
import CustomButton from '../CustomButton';

const VoucherNavigationBar = ({
  isDisabled,
  onAddRows,
  onSave,
  onCancel,
  loading = false,
  showAttachments = true,
  onAttachmentClick,
  actionButtons = [
    { text: 'Add Rows', onClick: onAddRows },
    { text: 'Save', onClick: onSave },
    { text: 'Cancel', onClick: onCancel, variant: 'secondaryButton' },
  ],
  lastVoucherNumbers = {},
  setPageState = null,
  setSearchTerm = null,
  setWriteTerm = null,
  disableSubmit = false,
  isNavigationShow = true,
  additionalRefetch= null ,
  lastVoucherNumbersShow = true,
}) => {
  return (
    <div
      style={{ bottom: 16, minHeight: 77 }}
      className="d-card w-100 mt-3 position-sticky p-3 d-flex justify-content-between align-items-center"
    >
      {/* Action Buttons */}
      <div className="d-flex flex-column justify-content-center gap-4">
        {!isDisabled ? (
          <div className="d-flex gap-3 flex-wrap">
            {actionButtons.map((button, index) => (
              <CustomButton
                key={index}
                text={button.text}
                onClick={button.onClick}
                variant={button.variant}
                loading={
                  button.loading
                    ? true
                    : button.text === 'Save' || button.text === 'Update'
                    ? loading
                    : false
                }
                disabled={
                  button.disabled ||
                  loading ||
                  button.loading ||
                  ((button.text === 'Save' || button.text === 'Update') &&
                    disableSubmit)
                }
              />
            ))}
          </div>
        ) : null}
      </div>
      {/* Navigation */}
      <div
        className={`d-flex gap-2 voucher-navigation-wrapper position-absolute start-50 translate-middle-x`}
      >
        {isNavigationShow && (
          <>
            <span
              className={`${
                lastVoucherNumbers?.previous ? 'tooltip-toggle' : ''
              }`}
              aria-label={'Previous'}
              style={{
                ...(!lastVoucherNumbers?.previous && { cursor: 'not-allowed' }),
              }}
            >
              <FaChevronLeft
                className={lastVoucherNumbers?.previous ? '' : 'pe-none'}
                size={24}
                onClick={() => {
                  if (lastVoucherNumbers?.previous) {
                    setPageState('view');
                    setSearchTerm(lastVoucherNumbers?.previous);
                    setWriteTerm && setWriteTerm(lastVoucherNumbers?.previous);
                    additionalRefetch !== null && additionalRefetch()
                  }
                }}
              />
            </span>
            <span
              className={'tooltip-toggle'}
              aria-label={'Next'}
              style={{
                ...(!lastVoucherNumbers?.next && { cursor: 'not-allowed' }),
              }}
            >
              <FaChevronRight
                className={lastVoucherNumbers?.next ? '' : 'pe-none'}
                size={24}
                onClick={() => {
                  if (lastVoucherNumbers?.next) {
                    setPageState('view');
                    setSearchTerm(lastVoucherNumbers?.next);
                    setWriteTerm && setWriteTerm(lastVoucherNumbers?.next);
                    additionalRefetch !== null && additionalRefetch()
                  }
                }}
              />
            </span>
          </>
        )}

        {showAttachments && (
          <span
            className={'tooltip-toggle'}
            style={{ ...(isDisabled && { cursor: 'not-allowed' }) }}
            aria-label={'Attachment'}
          >
            <FaPaperclip
              className={isDisabled ? 'pe-none' : ''}
              size={24}
              onClick={isDisabled ? null : onAttachmentClick}
            />
          </span>
        )}
      </div>

      {/* Right Section */}
      {lastVoucherNumbersShow && (
      <div className="d-flex align-items-center gap-3 ms-auto">
        <p style={{ fontWeight: 500 }} className="m-0">
          {lastVoucherNumbers?.heading}
          {lastVoucherNumbers?.isLoadingVoucherNumber ? (
            <Skeleton
              duration={1}
              width={'24px'}
              baseColor="#ddd"
              height={16}
            />
          ) : lastVoucherNumbers?.isErrorVoucherNumber ? (
            <span className="text-danger">
              {lastVoucherNumbers?.errorMessage}
            </span>
          ) : lastVoucherNumbers?.last ? (
            lastVoucherNumbers.last
          ) : (
            <span className="text-muted">No Entries Found</span>
          )}
        </p>
      </div>
      )}
    </div>
  );
};

export default VoucherNavigationBar;
