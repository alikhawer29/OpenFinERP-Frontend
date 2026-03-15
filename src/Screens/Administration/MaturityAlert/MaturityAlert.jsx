import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import Skeleton from 'react-loading-skeleton';
import { useNavigate } from 'react-router-dom';
import { PulseLoader } from 'react-spinners';
import CustomButton from '../../../Components/CustomButton';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import HorizontalTabs from '../../../Components/HorizontalTabs/HorizontalTabs';
import { showToast } from '../../../Components/Toast/Toast';
import withFilters from '../../../HOC/withFilters ';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  getMaturityAlertTabListing,
  getMaturityAlertTabs,
  updateMaturityAlertTabs,
} from '../../../Services/Administration/MaturityAlert';
import {
  allMaturityAlertTabs,
  maturityAlertDebitNoteHeaders,
  maturityAlertDocumentHeaders,
  maturityAlertFCRemittanceHeaders,
  maturityAlertPDCHeaders,
} from '../../../Utils/Constants/TableHeaders';
import {
  formatDate,
  isNullOrEmpty,
  openFileFromURLwithParams,
  showErrorToast,
} from '../../../Utils/Utils';
import useModulePermissions from '../../../Hooks/useModulePermissions';

const MaturityAlert = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Maturity Alert');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedTab, setSelectedTab] = useState();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [tabsToShow, setTabsToShow] = useState([]);

    const permissions = useModulePermissions("administration", "maturity_alert")
  const { print } = permissions;

  //    --- QUERIES AND MUTATIONS ---
  const tableDataQuery = useFetchTableData(
    ['maturityAlertListing', selectedTab],
    filters,
    updatePagination,
    () => getMaturityAlertTabListing(selectedTab, filters),
    {
      enabled: !!selectedTab, // Only fetch when selectedTab exists
    }
  );

  const {
    data: { data: maturityAlertData = [] } = {},
    isLoading,
    isError,
    error,
  } = tableDataQuery;
  const {
    data: maturityAlertTabs,
    isLoading: maturityAlertTabsLoading,
    isError: maturityAlertTabsError,
    error: maturityAlertTabsErrorMessage,
  } = useQuery({
    queryKey: ['maturityAlertTabs'], // Ensure it updates on change
    queryFn: getMaturityAlertTabs, // Use separate state value
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Update Maturity Alert Setup Mutation
  const updateSetupMutation = useMutation({
    mutationFn: (values) => updateMaturityAlertTabs(values),
    onSuccess: () => {
      setShowSetupModal(false);
      showToast('Maturity Alert Setup Updated Successfully', 'success');
      queryClient.invalidateQueries(['maturityAlertListing', filters]);
    },
    onError: (error) => {
      setShowSetupModal(false);
      showErrorToast(error);
    },
  });

  //  --- MUTATIONS END ---
  useEffect(() => {
    if (!maturityAlertTabsLoading && !isNullOrEmpty(maturityAlertTabs)) {
      const tabs = maturityAlertTabs
        .filter((tab) => tab.status === 'active')
        .map((x) => ({ label: x.levels, value: x.levels }));
      setTabsToShow(tabs);
      setSelectedTab(tabs[0].value);
    }
  }, [maturityAlertTabs, maturityAlertTabsLoading]);

  const getSetupInitialValues = () => {
    const result = {};
    maturityAlertTabs.forEach((item) => {
      if (item.status === 'active') {
        result[item.levels] = 1;
      }
    });
    return result;
  };

  const handleUpdateSetup = (values) => {
    let levels = Object.keys(values).filter((key) => values[key] === 1);
    updateSetupMutation.mutate({ levels });
  };

  if (isError || maturityAlertTabsError) {
    showErrorToast(error || maturityAlertTabsErrorMessage);
  }
  if (maturityAlertTabsLoading) {
    return (
      <>
        <div className="d-flex gap-3 justify-content-between flex-wrap mb-5">
          <h2 className="screen-title mb-0">Maturity Alert</h2>
          <div className="d-flex gap-2">
            <CustomButton
              text={'Setup'}
              onClick={() => console.log('')}
            />
          </div>
        </div>
        <Row className="beechMein">
          <Col xs={8}>
            <div className="col-12 mb-3" style={{ height: 56 }}>
              <Skeleton duration={1} baseColor="#ddd" height={36} />
            </div>
          </Col>
          <Col xs={12}>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={maturityAlertDocumentHeaders}
              pagination={pagination}
              isLoading={true}
              additionalFilters={[{ title: 'Due Date', type: 'date' }]}
            ></CustomTable>
          </Col>
        </Row>
      </>
    );
  }
  if (isLoading) {
    return (
      <>
        <div className="d-flex gap-3 justify-content-between flex-wrap mb-5">
          <h2 className="screen-title mb-0">Maturity Alert</h2>
          <div className="d-flex gap-2">
            <CustomButton
              text={'Setup'}
              onClick={() => console.log('')}
            />
          </div>
        </div>
        <Row className="beechMein">
          <div className="beechMein">
            <HorizontalTabs
              tabs={tabsToShow}
              activeTab={selectedTab}
              style={{ width: 270 }}
              onTabChange={setSelectedTab}
            />
          </div>
          <Col xs={12}>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={maturityAlertDocumentHeaders}
              pagination={pagination}
              isLoading={true}
              additionalFilters={[{ title: 'Due Date', type: 'date' }]}
            ></CustomTable>
          </Col>
        </Row>
      </>
    );
  }

  const renderTab = (tab) => {
    switch (tab) {
      case 'Documents':
        return (
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={maturityAlertDocumentHeaders}
            pagination={pagination}
            isLoading={isLoading}
            additionalFilters={[{ title: 'Due Date', type: 'date' }]}
          >
            {(maturityAlertData.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={maturityAlertDocumentHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {maturityAlertData?.map((item, index) => (
                  <tr key={item.id}>
                    <td>{item?.group?.type}</td>
                    <td>{item?.classification?.description}</td>
                    <td>{item.description}</td>
                    <td>{item.number}</td>
                    <td>{formatDate(item.issue_date, 'DD/MM/YYYY')}</td>
                    <td>{formatDate(item.due_date, 'DD/MM/YYYY')}</td>
                  </tr>
                ))}
              </tbody>
            )}
          </CustomTable>
        );
      case 'PDCs':
        return (
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={maturityAlertPDCHeaders}
            pagination={pagination}
            isLoading={isLoading}
            additionalFilters={[{ title: 'Due Date', type: 'date' }]}
          >
            {(maturityAlertData.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={maturityAlertPDCHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {maturityAlertData?.map((item, index) => (
                  <tr key={item.id}>
                    <td>{item.group?.type}</td>
                    <td>{item.type}</td>
                    <td>{item.description}</td>
                    <td>{item.number}</td>
                    <td>{formatDate(item.issue_date, 'DD/MM/YYYY')}</td>
                    <td>{formatDate(item.due_date, 'DD/MM/YYYY')}</td>
                  </tr>
                ))}
              </tbody>
            )}
          </CustomTable>
        );
      case 'Debit Note Payment':
        return (
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={maturityAlertDebitNoteHeaders}
            pagination={pagination}
            isLoading={isLoading}
            additionalFilters={[{ title: 'Due Date', type: 'date' }]}
          >
            {(maturityAlertData.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={maturityAlertDebitNoteHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {maturityAlertData?.map((item, index) => (
                  <tr key={item.id}>
                    <td>{item.group?.type}</td>
                    <td>{item.type}</td>
                    <td>{item.description}</td>
                    <td>{item.number}</td>
                    <td>{formatDate(item.issue_date, 'DD/MM/YYYY')}</td>
                    <td>{formatDate(item.due_date, 'DD/MM/YYYY')}</td>
                  </tr>
                ))}
              </tbody>
            )}
          </CustomTable>
        );
      case 'FC Remittance':
        return (
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={maturityAlertFCRemittanceHeaders}
            pagination={pagination}
            isLoading={isLoading}
            additionalFilters={[{ title: 'Due Date', type: 'date' }]}
          >
            {(maturityAlertData.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={maturityAlertFCRemittanceHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {maturityAlertData?.map((item, index) => (
                  <tr key={item.id}>
                    <td>{item.group?.type}</td>
                    <td>{item.type}</td>
                    <td>{item.description}</td>
                    <td>{item.number}</td>
                    <td>{formatDate(item.issue_date, 'DD/MM/YYYY')}</td>
                    <td>{formatDate(item.due_date, 'DD/MM/YYYY')}</td>
                  </tr>
                ))}
              </tbody>
            )}
          </CustomTable>
        );
      default:
        return null;
    }
  };
  return (
    <>
      <section>
        <div className="d-flex gap-3 justify-content-between flex-wrap mb-5">
          <h2 className="screen-title mb-0">Maturity Alert</h2>
          <div className="d-flex gap-2">
            <CustomButton
              text={'Setup'}
              onClick={() => setShowSetupModal(true)}
            />
            {
              print &&
              <CustomButton
                text={'Print'}
                onClick={() =>
                  openFileFromURLwithParams('maturity-alert', 'pdf', selectedTab)
                }
              />
            }
          </div>
        </div>
        <Row>
          <Col xs={12}>
            <div className="beechMein">
              <HorizontalTabs
                tabs={tabsToShow}
                activeTab={selectedTab}
                onTabChange={setSelectedTab}
              />
            </div>
            {renderTab(selectedTab)}
          </Col>
        </Row>
      </section>
      {/* Update Maturity Alert Setup */}
      <CustomModal show={showSetupModal} close={() => setShowSetupModal(false)}>
        <div className="text-center mb-45">
          <h4 className="modalTitle">Setup Alert configuration</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={getSetupInitialValues()}
            onSubmit={handleUpdateSetup}
          >
            {({ values, errors, setFieldValue }) => (
              <Form>
                {allMaturityAlertTabs.map((tab, index) => (
                  <div key={index} className="mb-2">
                    <CustomCheckbox
                      style={{ border: 'none', marginBottom: 0 }}
                      label={tab}
                      checked={values?.[tab]}
                      onChange={(e) =>
                        setFieldValue(tab, e.target.checked ? 1 : 0)
                      }
                    />
                  </div>
                ))}

                <div className="d-flex gap-3 justify-content-center mb-3 mt-45">
                  {updateSetupMutation.isPending ? (
                    <PulseLoader size={11} className="modalLoader" />
                  ) : (
                    <>
                      <CustomButton
                        variant={'primary'}
                        type="submit"
                        text={'Save'}
                        disabled={updateSetupMutation.isPending}
                      />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        disabled={updateSetupMutation.isPending}
                        onClick={() => setShowSetupModal(false)}
                      />
                    </>
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>
    </>
  );
};

export default withFilters(MaturityAlert);
