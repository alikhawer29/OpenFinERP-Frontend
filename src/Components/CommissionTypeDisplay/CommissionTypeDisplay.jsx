import React from 'react';
import { getCommissionTypeInfo } from '../../Utils/Utils';
import './CommissionTypeDisplay.css';
const CommissionTypeDisplay = ({
  item,
  children,
  className = '',
  tag = 'p',
  style = {},
  onClick,
  showTooltip = true,
  ...otherProps
}) => {
  const commissionTypeInfo = getCommissionTypeInfo(item);
  
  // Combine base classes with commission type class
  const combinedClassName = `mb-0 ${commissionTypeInfo.className} ${className}`.trim();
  
  // Prepare props for the element
  const elementProps = {
    className: combinedClassName,
    style,
    onClick,
    ...(showTooltip && commissionTypeInfo.tooltipText && {
      title: commissionTypeInfo.tooltipText,
      'aria-label': commissionTypeInfo.tooltipText,
    }),
    ...otherProps,
  };

  // Render based on tag type
  switch (tag) {
    case 'span':
      return <span {...elementProps}>{children}</span>;
    case 'div':
      return <div {...elementProps}>{children}</div>;
    case 'td':
      return <td {...elementProps}>{children}</td>;
    default:
      return <p {...elementProps}>{children}</p>;
  }
};

export default CommissionTypeDisplay;

