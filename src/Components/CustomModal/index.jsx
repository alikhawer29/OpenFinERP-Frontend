import React from 'react';
import { Modal } from 'react-bootstrap';
import { IoCloseCircle, IoCloseOutline } from 'react-icons/io5';
import { PulseLoader } from 'react-spinners';
import CustomButton from '../CustomButton';
import './style.css';
import {
  BsCheckCircleFill,
  BsQuestionCircleFill,
  BsCurrencyExchange,
} from 'react-icons/bs';

const CustomModal = ({
  background,
  show,
  close,
  size,
  fullscreen,
  contentClassName,
  hideClose,
  showImage,
  variant, // prop to handle image types
  showTitle,
  title,
  children,
  description,
  note,
  btntext,
  action,
  btn1Text,
  btn2Text,
  disableClick,
  style,
  closeOnOutsideClick = true,
}) => {
  const renderImage = (type) => {
    switch (type) {
      case 'success':
        return (
          <div className="modalImageWrapper rounded-circle beechMein">
            <BsCheckCircleFill size={100} color="#28AA72" />
          </div>
        );
      case 'error':
        return (
          <div className="modalImageWrapper rounded-circle beechMein">
            <IoCloseCircle size={100} color="red" />
          </div>
        );
      case 'info':
        return (
          <div className="modalImageWrapper rounded-circle beechMein">
            <BsQuestionCircleFill size={100} color="#fdc770" />
          </div>
        );
      case 'rates':
        return (
          <div className="modalImageWrapper rounded-circle beechMein">
            <BsCurrencyExchange size={100} color="#f39c12" />
          </div>
        );
      default:
        return (
          <div className="modalImageWrapper rounded-circle beechMein">
            <BsQuestionCircleFill size={100} color="#fdc770" />
          </div>
        );
    }
  };

  return (
    <Modal
      className={`${background ? 'modal-lg' : ''}`}
      show={show}
      centered
      onHide={close}
      size={size}
      fullscreen={fullscreen}
      contentClassName={contentClassName}
      backdrop={closeOnOutsideClick ? undefined : 'static'}
    >
      <div className={`${background}`}>
        {!hideClose && (
          <div className="d-flex justify-content-end">
            <button
              className="closeButton notButton rounded-circle beechMein mt-2 me-2 p-1 kaata"
              onClick={close}
            >
              <IoCloseOutline size={20} color="red" />
            </button>
          </div>
        )}
      </div>
      <Modal.Body
        className={`mb-3 ${!children && 'text-center'} `}
        style={style}
      >
        {children ? (
          <div className="modalInputs">
            {showImage && renderImage(variant)}
            {showTitle && (
              <div className="pt-3 text-center">
                <h4 className="modalTitle">{title}</h4>
              </div>
            )}
            {children}
          </div>
        ) : (
          <div className="beechMein flex-column">
            {renderImage(variant)}
            <div className="modalContent">
              {title && <h4 className="modalTitle">{title}</h4>}
              <p className="modalText">{description}</p>
              {note && <p className="modalNote">{note}</p>}
            </div>
            {variant === 'success' ? (
              <div
                className={`d-flex align-content-center justify-content-center pt-3 ${
                  variant === 'success' ? 'gap-2 flex-wrap' : ''
                }`}
              >
                <CustomButton
                  style={{ width: '100%' }}
                  type="button"
                  className="modalPrimaryButton modal-btn"
                  text={btntext || 'Ok'}
                  onClick={action ? action : close}
                />
              </div>
            ) : (
              <>
                {variant === 'error' ? (
                  <div className="beechMein gap-2 gap-sm-3 flex-wrap">
                    <CustomButton
                      type="button"
                      text={btn1Text || 'Ok'}
                      className="modalPrimaryButton modal-btn"
                      onClick={action ?? close}
                    />
                  </div>
                ) : (
                  <div className="beechMein gap-2 gap-sm-3 flex-wrap">
                    {!disableClick ? (
                      <>
                        <CustomButton
                          type="button"
                          text={btn1Text || 'Yes'}
                          className="modalPrimaryButton modal-btn"
                          onClick={action}
                        />
                        <CustomButton
                          type="button"
                          text={btn2Text || 'No'}
                          variant={'secondaryButton'}
                          className="modalSecondaryButton modal-btn text-black"
                          onClick={close}
                        />
                      </>
                    ) : (
                      <PulseLoader size={11} className="modalLoader" />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default CustomModal;
