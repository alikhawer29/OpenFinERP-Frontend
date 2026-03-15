import React from 'react';

const HorizontalTabs = ({
  tabs = [],
  activeTab = '',
  style = {},
  onTabChange = () => {},
}) => {
  // Ensure tabs is an array and each tab has required properties
  const safeTabs = tabs.filter(
    (tab) => tab && typeof tab === 'object' && 'label' in tab && 'value' in tab
  );

  if (safeTabs.length === 0) {
    return null;
  }

  return (
    <div className="horizontal-tabs mb-4">
      {safeTabs.map((tab) => (
        <button
          key={tab.value || Math.random()}
          style={style}
          onClick={() => onTabChange(tab.value)}
          className={`tab-button ${activeTab === tab.value ? 'active' : ''}`}
        >
          {tab.label || ''}
        </button>
      ))}
    </div>
  );
};

export default HorizontalTabs;
