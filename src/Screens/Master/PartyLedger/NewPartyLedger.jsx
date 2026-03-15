import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import PartyLedgerForm from '../../../Components/PartyLedgerForm/PartyLedgerForm';

const NewPartyLedger = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="d-flex flex-column gap-2 mb-4">
        <BackButton />
        <h2 className="screen-title m-0 d-inline">Party Ledger</h2>
      </div>
      <PartyLedgerForm
        onCancel={() => navigate(-1)}
        onSuccess={() => navigate(-1)}
      />
    </div>
  );
};

export default NewPartyLedger;
