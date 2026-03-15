import React from 'react';
import { statusClassMap } from '../../Utils/Constants/SelectOptions';

const StatusChip = ({ status = '', className = '', onClick }) => {
  if (!status) return null;
  return (
    <span
      onClick={onClick}
      className={`chip ${statusClassMap[status?.toLowerCase()]} ${className} ${
        onClick ? 'cp' : ''
      }`}
    >
      {status?.charAt(0)?.toUpperCase() + status?.slice(1)}
    </span>
  );
};

export default StatusChip;
