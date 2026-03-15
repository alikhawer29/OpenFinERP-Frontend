import React, { useState } from 'react';
import CustomModal from '../Components/CustomModal';

const withModal = (WrappedComponent) => {
  return (props) => {
    const [modalState, setModalState] = useState({
      show: false,
      variant: '',
      title: '',
      description: '',
      action: null,
      postAction: null, // Function to be called after modal is closed
      showReason: false,
      errorMessage: '', // For error messages
      isLoading: false, // Loading state for modal actions
    });

    const showModal = (
      title,
      description,
      action,
      variant = 'info',
      postAction = null
    ) => {
      setModalState({
        title,
        description,
        action,
        variant,
        show: true,
        postAction, // Set postAction
        isLoading: false, // Reset loading state
      });
    };

    const handleModalClose = () => {
      setModalState((prev) => ({
        ...prev,
        show: false,
        action: null,
        isLoading: false, // Reset loading state on close
      }));
      if (modalState.postAction) {
        modalState.postAction(); // Execute the postAction after closing the modal
      }
    };

    const handleSubmit = () => {
      // Execute action and set loading state
      if (modalState.action) {
        setModalState((prev) => ({ ...prev, isLoading: true }));
        modalState.action();
      }
    };

    return (
      <>
        <WrappedComponent
          {...props}
          showModal={showModal}
          closeModal={handleModalClose}
        />
        <CustomModal
          show={modalState.show}
          close={handleModalClose}
          action={handleSubmit}
          title={modalState.title}
          description={modalState.description}
          variant={modalState.variant}
          btnText={'Submit'}
          errorMessage={modalState.errorMessage}
          disableClick={modalState.isLoading} // Pass loading state to disable modal buttons
        />
      </>
    );
  };
};

export default withModal;

//Example-1 for just confirmation

// const confirmPopup = (id, status) => {
//   showModal(
//     `Are you sure you want to ${status === "Active" ? "Inactivate" : "Activate"} this User?`, //heading
//1-     () => onConfirm(status, id) //action
//2-     () => navigate(`/dashboard`) // If you want direct navigate without any confirmation just use navigate do not use 2 actions
//   );
// };
