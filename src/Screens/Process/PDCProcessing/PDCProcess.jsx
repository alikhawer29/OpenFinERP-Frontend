import { React, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import HorizontalTabs from '../../../Components/HorizontalTabs/HorizontalTabs';
import PayablesTable from './PayablesTable';
import ReceivableTable from './ReceivableTable';
import { usePageTitle } from '../../../Hooks/usePageTitle';

const PDCProcess = () => {
  const [activeTab, setActiveTab] = useState('receivables');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  usePageTitle('P.D.C Process');
  
  useEffect(() => {
    let tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case 'receivables':
        return <ReceivableTable />;
      case 'payables':
        return <PayablesTable />;
      default:
        return <p>Select a Tab</p>;
    }
  };

  return (
    <>
      <div className=" mb-5">
        <h2 className="screen-title mb-0">P.D.C Process</h2>
      </div>
      <div className="beechMein">
        <HorizontalTabs
          tabs={[
            { label: 'Receivables', value: 'receivables' },
            { label: 'Payables', value: 'payables' },
          ]}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            searchParams.set('tab', tab);
            navigate(`?tab=${tab}`);
          }}
        />
      </div>
      {renderTab()}
    </>
  );
};

export default PDCProcess;
