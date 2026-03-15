// useSubscriptionAccess.js

import useUserStore from "../Stores/UserStore";

const useSubscriptionAccess = () => {
    const hasFullAccess = useUserStore((state) => state.hasFullAccess());
    // const hasViewOnlyAccess = useUserStore((state) => state.hasViewOnlyAccess());

    return {
        canModify: hasFullAccess,
        // canViewOnly: hasViewOnlyAccess,
    };
};

export default useSubscriptionAccess;
