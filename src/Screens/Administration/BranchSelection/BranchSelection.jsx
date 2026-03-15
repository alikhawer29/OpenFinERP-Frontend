import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import Skeleton from 'react-loading-skeleton';
import CustomButton from '../../../Components/CustomButton';
import { showToast } from '../../../Components/Toast/Toast';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  getBranchDetails,
  getBranchSelectionList,
  updateSelectedBranch,
} from '../../../Services/Administration/BranchSelection';
import useUserStore from '../../../Stores/UserStore';
import { isNullOrEmpty, showErrorToast } from '../../../Utils/Utils';

const BranchSelection = () => {
  usePageTitle('Branch Selection');
  const {
    setUser,
    setSelectedBranch: setStoreSelectedBranch,
    setBranchName,
    hasPermission,
  } = useUserStore();
  const [selectedBranch, setSelectedBranch] = useState(null);
  const queryClient = useQueryClient();

  // Queries //
  const {
    data: branchList,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['branchList'],
    queryFn: getBranchSelectionList,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const {
    data: branchDetails,
    isLoading: isLoadingDetails,
    isError: isErrorDetails,
    error: errorDetails,
  } = useQuery({
    queryKey: ['branchDetails', selectedBranch?.id],
    queryFn: () => getBranchDetails(selectedBranch?.id),
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !isNullOrEmpty(selectedBranch),
  });
  // Queries End //

  // Mutations //
  const updateSelectedBranchMutation = useMutation({
    mutationFn: (id) => updateSelectedBranch(id),
    onSuccess: (data) => {
      setUser(data);
      setStoreSelectedBranch(data.selected_branch);
      setBranchName(data.branch_name);
      showToast(`${selectedBranch?.name} Branch selected`, 'success');
      queryClient.invalidateQueries(['branchList']);
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });
  // Mutations End //

  useEffect(() => {
    if (!isNullOrEmpty(branchList) && isNullOrEmpty(selectedBranch)) {
      const activeBranch = branchList.find((x) => x.is_selected === 'active');
      if (activeBranch) {
        setSelectedBranch(activeBranch);
      }
    }
  }, [branchList, selectedBranch]);

  if (isLoading) {
    return (
      <>
        <div className="d-flex align-items-start mb-4 justify-content-between flex-wrap">
          <h2 className="screen-title m-0 d-inline">Branch Selection</h2>
        </div>
        <div className="d-card">
          <Row>
            <Col
              xs={12}
              lg={4}
              className="d-flex flex-column justify-content-between"
            >
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="col-12 mb-3 align-items-center"
                  style={{ height: 26 }}
                >
                  <Skeleton
                    duration={1}
                    width={'80%'}
                    baseColor="#ddd"
                    height={22}
                  />
                </div>
              ))}
              <div className="d-flex mt-5">
                <CustomButton
                  text={'Save'}
                  onClick={() => console.log('')}
                />
              </div>
            </Col>
            <Col xs={12} lg={1} offset={1}>
              <div className="vertical-line" />
            </Col>
            <Col xs={12} lg={7}>
              <Row>
                <h3 className="screen-title-body fw-normal mb-4">
                  Branch Details
                </h3>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="col-12 col-sm-6 mb-3  align-items-center"
                    style={{ height: 56 }}
                  >
                    <Skeleton
                      style={{ marginTop: 20 }}
                      duration={1}
                      width={'80%'}
                      baseColor="#ddd"
                      height={22}
                    />
                  </div>
                ))}
              </Row>
            </Col>
          </Row>
        </div>
      </>
    );
  }
  if (isError) {
    showErrorToast(error);
    return (
      <>
        <div className="d-flex align-items-start mb-4 justify-content-between flex-wrap">
          <h2 className="screen-title m-0 d-inline">Branch Selection</h2>
        </div>
        <div className="d-card">
          <p className="text-danger">{error.message}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="d-flex align-items-start mb-4 justify-content-between flex-wrap">
        <h2 className="screen-title m-0 d-inline">Branch Selection</h2>
      </div>
      <div className="d-card">
        <Row>
          <Col
            xs={12}
            lg={4}
            className="d-flex flex-column justify-content-between"
          >
            <div className="branch-list d-block radio-group mb-5 mb-lg-4 mt-2 mt-md-0">
              {branchList?.map((branch, index) => (
                hasPermission('administration', 'branch_selection', branch?.name) && (
                  <div key={branch.id} className="mb-2">
                    <label>
                      <input
                        type="radio"
                        id={`branch-${index}`}
                        name="branch"
                        defaultChecked={branch.is_selected === 'active' ? 1 : 0}
                        onChange={() => setSelectedBranch(branch)}
                      />
                      <span>{branch.name}</span>
                    </label>
                  </div>
                )
              ))}
            </div>
            <div className="d-flex">
              <CustomButton
                text={'Save'}
                disabled={
                  updateSelectedBranchMutation.isPending ||
                  branchList.find((x) => x.is_selected === 'active')?.id ===
                  selectedBranch?.id
                }
                loading={updateSelectedBranchMutation.isPending}
                onClick={() =>
                  updateSelectedBranchMutation.mutate(selectedBranch?.id)
                }
              />
            </div>
          </Col>
          <Col xs={12} lg={1} offset={1}>
            <div className="vertical-line" />
          </Col>
          <Col xs={12} lg={7}>
            <Row>
              <h3 className="screen-title-body fw-normal mb-4">
                Branch Details
              </h3>
              {isLoadingDetails ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="col-12 col-sm-6 mb-3  align-items-center"
                    style={{ height: 56 }}
                  >
                    <Skeleton
                      style={{ marginTop: 20 }}
                      duration={1}
                      width={'80%'}
                      baseColor="#ddd"
                      height={22}
                    />
                  </div>
                ))
              ) : isErrorDetails ? (
                <p className="text-danger">{errorDetails.message}</p>
              ) : (
                [
                  {
                    label: 'Branch Name',
                    value: branchDetails?.name,
                  },
                  {
                    label: 'Manager Name',
                    value: branchDetails?.manager?.user_name,
                  },
                  {
                    label: 'Supervisor Name',
                    value: branchDetails?.supervisor?.user_name,
                  },
                  {
                    label: 'Number of Users',
                    value: branchDetails?.total_users,
                  },
                ].map((x, i) => {
                  if (isNullOrEmpty(x.value)) return null;
                  return (
                    <div key={i} className="col-12 col-sm-6 mb-4">
                      <p className="detail-title detail-label-color mb-1">
                        {x.label}
                      </p>
                      <p className="detail-text wrapText mb-0">{x.value}</p>
                    </div>
                  );
                })
              )}
            </Row>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default BranchSelection;
