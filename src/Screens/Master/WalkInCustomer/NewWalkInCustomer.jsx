import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import WalkInCustomerForm from '../../../Components/WalkInCustomerForm/WalkInCustomerForm';
import { usePageTitle } from '../../../Hooks/usePageTitle';

const NewWalkInCustomer = () => {
  usePageTitle('Walk In Customer - Create');

  const navigate = useNavigate();

  return (
    <div>
      <div className="d-flex flex-column gap-2 mb-4">
        <BackButton />
        <h2 className="screen-title m-0 d-inline">Walk-in Customer Register</h2>
      </div>

      <WalkInCustomerForm
        onCancel={() => navigate(-1)}
        onSuccess={() => navigate(-1)}
      />
    </div>
  );
};

export default NewWalkInCustomer;
