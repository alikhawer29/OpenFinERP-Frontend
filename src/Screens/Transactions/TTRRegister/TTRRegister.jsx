import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import CustomButton from '../../../Components/CustomButton';
import HorizontalTabs from '../../../Components/HorizontalTabs/HorizontalTabs';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  printAllocation,
  printBankDetails,
  printConfirmation,
} from '../../../Services/Transaction/TtrRegister';
import TTRRegisterAllocation from './TTRRegisterAllocation';
import TTRRegisterBankDetails from './TTRRegisterBankDetails';
import TTRRegisterConfirmation from './TTRRegisterConfirmation';
import useModulePermissions from '../../../Hooks/useModulePermissions';

// Constants for better maintainability
const TAB_CONFIG = {
  BANK_DETAILS: 'bank_details',
  ALLOCATION: 'allocation',
  CONFIRMATION: 'confirmation',
};

const TAB_OPTIONS = [
  { label: 'Bank Details', value: TAB_CONFIG.BANK_DETAILS },
  { label: 'Allocation', value: TAB_CONFIG.ALLOCATION },
  { label: 'Confirmation', value: TAB_CONFIG.CONFIRMATION },
];

const NAVIGATION_PATHS = {
  [TAB_CONFIG.BANK_DETAILS]: '/transactions/ttr-register/bank-details/new',
  [TAB_CONFIG.ALLOCATION]: '/transactions/ttr-register/allocation/new',
  [TAB_CONFIG.CONFIRMATION]: '/transactions/ttr-register/confirmation/new',
};

const TTRRegister = () => {
  usePageTitle('TTR Register');
  const navigate = useNavigate();
  const location = useLocation();

  // Permissions
  const permissions = useModulePermissions('transactions', 'ttr_register');
  const {
    create: hasCreatePermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
    print: hasPrintPermission,
  } = permissions || {};

  // ✅ UPDATED: Constants for persistence
  const STORAGE_KEY = 'ttr_register_selected_tab';

  // ✅ UPDATED: Sync selected tab with session storage for persistence across navigations
  const [selectedTab, setSelectedTab] = useState(() => {
    return (
      location.state?.selectedTab ||
      sessionStorage.getItem(STORAGE_KEY) ||
      TAB_CONFIG.BANK_DETAILS
    );
  });

  // ✅ UPDATED: Persistent tab change handler
  const handleTabChange = useCallback((tab) => {
    setSelectedTab(tab);
    sessionStorage.setItem(STORAGE_KEY, tab);
  }, []);

  // const [selectedTab, setSelectedTab] = useState(TAB_CONFIG.BANK_DETAILS);
  const [selectedConfirmationId, setSelectedConfirmationId] = useState(null);
  const [printType, setPrintType] = useState(null);

  // ✅ UPDATED: Enhanced navigation state handling
  useEffect(() => {
    if (location.state?.selectedTab) {
      const newTab = location.state.selectedTab;
      setSelectedTab(newTab);
      sessionStorage.setItem(STORAGE_KEY, newTab);

      // ✅ Clear the navigation state after using it to prevent sticking
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  // Common query options for print queries
  const commonQueryOptions = {
    enabled: false,
    refetchOnWindowFocus: false,
    retry: 1,
  };

  // Print queries
  const printQueries = {
    [TAB_CONFIG.BANK_DETAILS]: useQuery({
      queryKey: ['printBankDetails'],
      queryFn: printBankDetails,
      ...commonQueryOptions,
    }),
    [TAB_CONFIG.ALLOCATION]: useQuery({
      queryKey: ['printAllocation'],
      queryFn: printAllocation,
      ...commonQueryOptions,
    }),
    [TAB_CONFIG.CONFIRMATION]: useQuery({
      queryKey: ['printConfirmation'],
      queryFn: printConfirmation,
      ...commonQueryOptions,
    }),
  };

  // Get current query based on selected tab
  const currentQuery = printQueries[selectedTab];

  // Memoized tab renderer
  const renderTab = useCallback((tab) => {
    const tabComponents = {
      [TAB_CONFIG.BANK_DETAILS]: (
        <TTRRegisterBankDetails
          permissions={permissions}
          hasCreatePermission={hasCreatePermission}
          hasEditPermission={hasEditPermission}
          hasDeletePermission={hasDeletePermission}
        />
      ),
      [TAB_CONFIG.ALLOCATION]: (
        <TTRRegisterAllocation
          permissions={permissions}
          hasCreatePermission={hasCreatePermission}
          hasEditPermission={hasEditPermission}
          hasDeletePermission={hasDeletePermission}
        />
      ),
      [TAB_CONFIG.CONFIRMATION]: (
        <TTRRegisterConfirmation
          setSelectedConfirmationId={setSelectedConfirmationId}
          permissions={permissions}
          hasCreatePermission={hasCreatePermission}
          hasEditPermission={hasEditPermission}
          hasDeletePermission={hasDeletePermission}
        />
      ),
    };
    return tabComponents[tab] || null;
  }, [permissions, hasCreatePermission, hasEditPermission, hasDeletePermission, setSelectedConfirmationId]);

  // Handle print functionality
  const handlePrintClick = useCallback(() => {
    if (printQueries[selectedTab]) {
      setPrintType(selectedTab);
      printQueries[selectedTab].refetch();
    }
  }, [selectedTab, printQueries]);

  // Handle new button navigation
  const handleNewClick = useCallback(() => {
    const basePath = NAVIGATION_PATHS[selectedTab];

    if (selectedTab === TAB_CONFIG.CONFIRMATION) {
      navigate(basePath, {
        state: { selectedId: selectedConfirmationId },
      });
    } else {
      navigate(basePath);
    }
  }, [selectedTab, selectedConfirmationId, navigate]);

  // Handle edit navigation for confirmation tab
  const handleEditClick = useCallback(() => {
    // if (selectedConfirmationId) {
    navigate(`/transactions/ttr-register/confirmation/edit`, {
      state: { selectedId: selectedConfirmationId },
    });
    // }
  }, [navigate]);

  // Handle file open when print data is available
  useEffect(() => {
    if (printType && currentQuery?.data?.pdf_url) {
      window.open(currentQuery.data.pdf_url, '_blank');
      setPrintType(null); // Reset print type after opening
    }
  }, [currentQuery?.data, printType]);

  // Memoized button disabled state
  const isNewButtonDisabled = useMemo(
    () => selectedTab === TAB_CONFIG.CONFIRMATION && !selectedConfirmationId,
    [selectedTab, selectedConfirmationId]
  );

  return (
    <section>
      <div className="d-flex gap-3 justify-content-between flex-wrap mb-5">
        <h2 className="screen-title mb-0">TTR Register</h2>
        <div className="d-flex gap-2">
          {hasCreatePermission && (
            <CustomButton
              text="New"
              disabled={isNewButtonDisabled}
              onClick={handleNewClick}
            />
          )}

          {selectedTab === TAB_CONFIG.CONFIRMATION && hasEditPermission && (
            <CustomButton
              text="Edit"
              onClick={handleEditClick}
            // disabled={!selectedConfirmationId}
            />
          )}

          {hasPrintPermission && (
            <CustomButton
              text="Print"
              onClick={handlePrintClick}
              disabled={currentQuery?.isLoading}
            />
          )}
        </div>
      </div>

      <Row>
        <Col xs={12}>
          <div className="beechMein">
            <HorizontalTabs
              tabs={TAB_OPTIONS}
              activeTab={selectedTab}
              style={{ width: 270 }}
              onTabChange={handleTabChange}
            />
          </div>
          {renderTab(selectedTab)}
        </Col>
      </Row>
    </section>
  );
};

export default TTRRegister;
