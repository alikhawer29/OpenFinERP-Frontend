import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import BeneficiaryRegisterForm from '../../../Components/BeneficiaryRegisterForm/BeneficiaryRegisterForm';
import { usePageTitle } from '../../../Hooks/usePageTitle';

const NewBeneficiaryRegister = () => {
  usePageTitle('Beneficiary Register - Create');

  const navigate = useNavigate();

  return (
    <div>
      <div className="d-flex flex-column align-items-start gap-2 mb-4">
        <BackButton />
        <h2 className="screen-title m-0">Beneficiary Register</h2>
      </div>

      <BeneficiaryRegisterForm
        onCancel={() => navigate(-1)}
        onSuccess={() => navigate(-1)}
      />
    </div>
  );
};

export default NewBeneficiaryRegister;
