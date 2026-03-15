import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { HiOutlineQuestionMarkCircle } from 'react-icons/hi2';
import { Link, useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import CustomButton from '../../Components/CustomButton';
import {
  checkDowngrade,
  getPackagesListing,
} from '../../Services/Masters/Subscription';
import useThemeStore from '../../Stores/ThemeStore';
import { themeDictionary } from '../../Utils/Constants/ColorConstants';
import { showErrorToast } from '../../Utils/Utils';
import './ChangeSubscription.css';
import BackButton from '../../Components/BackButton';
import useModulePermissions from '../../Hooks/useModulePermissions';

// const SubscriptionCard = ({
//   data,
//   timePeriod = 'monthly',
//   buttons = [],
//   setSelectedSubscription,
//   isCustom = false,
//   isLoading = false,
// }) => {
//   const { theme } = useThemeStore();
//   const { id, title, price_monthly, price_yearly, no_of_users, branches } =
//     data || {};

//   const handleButtonClick = (button, isCustomCard) => {
//     // If it's a Modify button, don't set selected subscription
//     if (button.label === 'Modify') {
//       return; // Let the Link handle the navigation
//     }

//     // For Buy Now buttons on non-custom cards, set the selected subscription
//     if (!isCustomCard) {
//       setSelectedSubscription(id);
//     }
//   };

//   return (
//     <div className="subscription-card">
//       <h3 className="mb-4 fw-semibold fs-5">
//         {isCustom ? 'Customize Subscription' : title}
//       </h3>
//       {isCustom ? (
//         <div className="beechMein mb-4">
//           <HiOutlineQuestionMarkCircle
//             size={40}
//             color={themeDictionary[theme][0]}
//           />
//         </div>
//       ) : (
//         <h2 className="mb-4 fs-6 primary-color-text">
//           <span className="fs-2 fw-bold">
//             ${timePeriod === 'monthly' ? price_monthly : price_yearly}
//           </span>{' '}
//           USD / {timePeriod}
//         </h2>
//       )}
//       <p className="mb-0">
//         {isCustom
//           ? 'Custom No. of  Users'
//           : `${no_of_users} User${no_of_users > 1 ? 's' : ''}`}
//       </p>
//       <p className="mb-5">
//         {isCustom
//           ? 'Custom No. of  Branches'
//           : `${branches} Branch${branches > 1 ? 'es' : ''}`}
//       </p>
//       {buttons?.map((button) => {
//         if (button) {
//           return (
//             <div
//               key={`${button.label}-${button.id}`}
//               className="flex-grow-1 d-flex align-items-end justify-content-center"
//             >
//               <Link
//                 to={isCustom ? button.link : undefined}
//                 onClick={
//                   !isCustom ? () => setSelectedSubscription(id) : undefined
//                 }
//                 state={button?.link.state}
//               >
//                 <CustomButton
//                   loading={isLoading}
//                   disabled={isLoading}
//                   key={button.id}
//                 >
//                   {button.label}
//                 </CustomButton>
//               </Link>
//             </div>
//           );
//         }
//       })}
//     </div>
//   );
// };

const SubscriptionCard = ({
  data,
  timePeriod = 'monthly',
  buttons = [],
  setSelectedSubscription,
  isCustom = false,
  isLoading = false,
}) => {
  const { theme } = useThemeStore();
  const { id, title, price_monthly, price_yearly, no_of_users, branches } =
    data || {};


  const handleButtonClick = (button, isCustomCard) => {
    // If it's a Modify button, don't set selected subscription
    if (button.label === 'Modify') {
      return; // Let the Link handle the navigation
    }

    // For Buy Now buttons on non-custom cards, set the selected subscription
    if (!isCustomCard) {
      setSelectedSubscription(id);
    }
  };

  return (
    <div className="subscription-card">
      <h3 className="mb-4 fw-semibold fs-5">
        {isCustom ? 'Customize Subscription' : title}
      </h3>
      {isCustom ? (
        <div className="beechMein mb-4">
          <HiOutlineQuestionMarkCircle
            size={40}
            color={themeDictionary[theme][0]}
          />
        </div>
      ) : (
        <h2 className="mb-4 fs-6 primary-color-text">
          <span className="fs-2 fw-bold">
            ${timePeriod === 'monthly' ? price_monthly : price_yearly}
          </span>{' '}
          USD / {timePeriod}
        </h2>
      )}
      <p className="mb-0">
        {isCustom
          ? 'Custom No. of  Users'
          : `${no_of_users} User${no_of_users > 1 ? 's' : ''}`}
      </p>
      <p className="mb-5">
        {isCustom
          ? 'Custom No. of  Branches'
          : `${branches} Branch${branches > 1 ? 'es' : ''}`}
      </p>
      {buttons?.map((button) => {
        if (button) {
          return (
            <div
              key={`${button.label}-${button.id}`}
              className="flex-grow-1 d-flex align-items-end justify-content-center"
            >
              <Link
                to={button.link} // Use the link from button object
                onClick={() => handleButtonClick(button, isCustom)}
                state={button?.link?.state}
              >
                <CustomButton
                  loading={isLoading}
                  disabled={isLoading}
                  key={button.id}
                >
                  {button.label}
                </CustomButton>
              </Link>
            </div>
          );
        }
      })}
    </div>
  );
};

const SubscriptionCardSkeleton = () => {
  return (
    <div className="subscription-card">
      <Skeleton
        duration={1}
        baseColor="#ddd"
        height={24}
        width={'70%'}
        className="mb-4"
      />
      <Skeleton
        duration={1}
        baseColor="#ddd"
        height={40}
        width={'80%'}
        className="mb-4"
      />
      <Skeleton
        duration={1}
        baseColor="#ddd"
        height={18}
        width={'60%'}
        className="mb-2"
      />
      <Skeleton
        duration={1}
        baseColor="#ddd"
        height={18}
        width={'50%'}
        className="mb-5"
      />
      <div className="flex-grow-1 d-flex align-items-end justify-content-center">
        <Skeleton
          duration={1}
          baseColor="#ddd"
          height={40}
          width={140}
          borderRadius={12}
        />
      </div>
    </div>
  );
};

const ChangeSubscription = ({ firstTimeLanding = false }) => {
  const [activeTab, setActiveTab] = useState('monthly');
  const navigate = useNavigate();

  const [hasCustomSubscription, setHasCustomSubscription] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  
     const permissions = useModulePermissions("administration", "subscription_logs")
      const {buy_custom_subscription , change_subscription , renew_subscription,request_custom_subscription,view_subscription_logs , } = permissions;

  const {
    data: subscriptionData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => getPackagesListing(),
  });

  const {
    data: downgradeStatus,
    isLoading: isLoadingDowngrade,
    isError: isErrorDowngrade,
    error: errorDowngrade,
  } = useQuery({
    queryKey: ['downgradeStatus', selectedSubscription], // Include `selectedSubscription` in queryKey for caching
    queryFn: () => checkDowngrade(selectedSubscription), // Pass `selectedSubscription` to checkDowngrade function
    onError: (error) => {
      console.error('Error fetching downgrade status:', error);
      showErrorToast(error, 'error');
    },
    enabled: !!selectedSubscription && !firstTimeLanding, // Ensure the query runs only if `id` is available. Do not run if it's a new user
    refetchOnWindowFocus: false,
    retry: false,
  });

  // useEffect(() => {
  //   if (
  //     downgradeStatus &&
  //     Object.values(downgradeStatus).some((x) => x === true)
  //   ) {
  //     const selected = subscriptionData.find(
  //       (x) => x.id === selectedSubscription
  //     );
  //     let price =
  //       activeTab === 'monthly'
  //         ? selected.price_monthly
  //         : selected.price_yearly;
  //     navigate('downgrade-adjustment', {
  //       state: {
  //         downgradeStatus,
  //         type: activeTab,
  //         price,
  //         id: selectedSubscription,
  //       },
  //     });
  //   } else if (downgradeStatus) {
  //     const selected = subscriptionData.find(
  //       (x) => x.id === selectedSubscription
  //     );
  //     let price =
  //       activeTab === 'monthly'
  //         ? selected.price_monthly
  //         : selected.price_yearly;
  //     navigate(`/payment`, {
  //       state: {
  //         type: activeTab,
  //         price,
  //         id: selectedSubscription,
  //       },
  //     });
  //   }
  // }, [downgradeStatus, selectedSubscription]);

  useEffect(() => {
    if (!downgradeStatus && !firstTimeLanding) return;

    const selected = subscriptionData?.find(
      (x) => x.id === selectedSubscription
    );
    if (!selected) return;

    const price =
      activeTab === 'monthly' ? selected.price_monthly : selected.price_yearly;
    const state = { type: activeTab, price, id: selectedSubscription };

    if (firstTimeLanding) {
      navigate('/payment', {
        state: state,
      });
      return;
    }

    navigate(
      Object.values(downgradeStatus).some((x) => x === true)
        ? 'downgrade-adjustment'
        : '/payment',
      { state: downgradeStatus ? { ...state, downgradeStatus } : state }
    );
  }, [downgradeStatus, selectedSubscription]);

  useEffect(() => {
    setHasCustomSubscription(
      subscriptionData?.some((sub) => sub.type === 'custom')
    );
  }, [subscriptionData]);

  if (isLoading) {
    return (
      <>
        <div>
          <h2 className="screen-title">
            {firstTimeLanding ? 'Buy Subscription' : 'Change Subscription'}
          </h2>
        </div>
        <div className="d-card">
          <div>
            <div className="beechMein mt-2 mb-45">
              <div className="d-flex justify-content-center">
                <div className="subscription-tabs mb-2 d-flex gap-3">
                  <Skeleton
                    duration={1}
                    baseColor="#ddd"
                    width={140}
                    height={36}
                    borderRadius={8}
                  />
                  <Skeleton
                    duration={1}
                    baseColor="#ddd"
                    width={140}
                    height={36}
                    borderRadius={8}
                  />
                </div>
              </div>
            </div>
            <div className="d-flex gap-4 justify-content-center align-items-center flex-wrap">
              {Array.from({ length: 3 }).map((_, idx) => (
                <SubscriptionCardSkeleton key={idx} />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }
  if (isError) {
    showErrorToast(error.message, 'error');
    return (
      <>
        <div className="d-flex gap-3 justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">
            {firstTimeLanding ? 'Buy Subscription' : 'Change Subscription'}
          </h2>
        </div>

        <div className="d-card">
          <p className="text-danger mb-4">
            Error fetching subscription packages.
            {error.message}
          </p>
        </div>
      </>
    );
  }
  if (isErrorDowngrade) {
    showErrorToast(errorDowngrade, 'error');
  }
  return (
    <>
      <div>
        {firstTimeLanding ? null : <BackButton />}
        <h2 className="screen-title">
          {firstTimeLanding ? 'Buy Subscription' : 'Change Subscription'}
        </h2>
      </div>

      <div className="d-card">
        <div>
          <div className="beechMein mt-2 mb-45">
            <div className="d-flex justify-content-center">
              <div className="subscription-tabs mb-2">
                <button
                  onClick={() => setActiveTab('monthly')}
                  className={`secondaryButton tab-button ${
                    activeTab === 'monthly' && 'active'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setActiveTab('yearly')}
                  className={`secondaryButton tab-button ${
                    activeTab === 'yearly' && 'active'
                  }`}
                >
                  Annual
                </button>
              </div>
            </div>
          </div>
          <div className="d-flex gap-4 justify-content-center align-items-center flex-wrap">
            {subscriptionData.map((item) => (
              <SubscriptionCard
                key={item.id}
                data={item}
                timePeriod={activeTab}
                setSelectedSubscription={setSelectedSubscription}
                buttons={[
                  (item?.type === 'custom' && buy_custom_subscription) || (item?.type !== 'custom') ?
                  {
                    id: item.id,
                    label: 'Buy Now',
                    link: {
                      state: {
                        id: item.id,
                        type: activeTab,
                        price:
                          activeTab === 'monthly'
                            ? item?.price_monthly
                            : item?.price_yearly,
                      },
                    },
                  } : null,
                  item?.type === 'custom'
                    ? {
                        id: item.id,
                        label: 'Modify',
                        link: '/administration/subscription-logs/request',
                      }
                    : null,
                ]}
                isLoading={
                  isLoadingDowngrade && selectedSubscription === item.id
                }
              />
            ))}
            {!hasCustomSubscription ? (
              <SubscriptionCard
                isCustom={true}
                buttons={[
                  {
                    id: 'custom',
                    label: 'Contact Us',
                    link: '/administration/subscription-logs/request',
                  },
                ]}
              />
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChangeSubscription;
