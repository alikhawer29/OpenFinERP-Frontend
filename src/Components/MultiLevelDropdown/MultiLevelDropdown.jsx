import React, { useState } from 'react';
import {
  HiChevronDown,
  HiChevronUp,
  HiMiniEye,
  HiMiniLockClosed,
  HiOutlineEye,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from 'react-icons/hi2';
import TableActionDropDown from '../TableActionDropDown/TableActionDropDown';
import './multiLevelDropdown.css';

const MenuItem = ({
  item,
  level,
  expandedItems,
  toggleItem,
  handleAccountClick,
  activeItemId,
}) => {
  const isExpanded = expandedItems.includes(item.id);
  const hasChildren = item?.children && item?.children?.length > 0;
  const isActive = item?.status === 'active';
  const isActiveClass = activeItemId === item.id;

  return (
    <div className="menu-item detail-text">
      <div
        className={`menu-item-content ${isActiveClass ? 'active' : ''}`}
        style={{ paddingLeft: `${level * 1}rem` }}
        onClick={() => hasChildren && toggleItem(item.id)}
      >
        <p className="d-flex gap-2 m-0">
          <span
            style={{ flexBasis: 16, minWidth: 16 }}
            className="align-self-center"
          >
            {level > 2 && !isActive && <HiMiniLockClosed />}
          </span>
          {`${item.account_code} - ${item.account_name}`}
        </p>
        <div
          style={{ flexBasis: 58, minWidth: 58 }}
          className="d-flex gap-1 justify-content-end"
        >
          <div className="beechMein">
            {hasChildren &&
              (isExpanded ? (
                <HiChevronUp size={20} className="menu-item-content-icon" />
              ) : (
                <HiChevronDown size={20} className="menu-item-content-icon" />
              ))}
          </div>
          {level > 2 &&
              (!isActive ?(
              <button
                className="notButton menu-item-content-icon-wrapper p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  // Close any open TableActionDropDowns before opening the view
                  try {
                    document.dispatchEvent(new Event('closeAllTableActionDropdowns'));
                  } catch (err) {
                    // ignore
                  }
                  handleAccountClick(item, 'view');
                }}
              >
                <HiMiniEye className="menu-item-content-icon" />
              </button>
            ) : (
              <button className="notButton menu-item-content-icon-wrapper p-2">
                <TableActionDropDown
                  actions={[
                    {
                      name: 'View',
                      icon: HiOutlineEye,
                      onClick: () => handleAccountClick(item, 'view'),
                      className: 'view',
                    },
                    {
                      name: 'Edit',
                      icon: HiOutlinePencilSquare,
                      onClick: () => handleAccountClick(item, 'edit'),
                      className: 'edit',
                    },
                    {
                      name: 'Delete',
                      icon: HiOutlineTrash,
                      onClick: () => handleAccountClick(item, 'delete'),
                      className: 'delete',
                    },
                  ]}
                />
              </button>
            ))}
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="menu-item-children">
          {item.children.map((child) => (
            <MenuItem
              key={child.id}
              item={child}
              level={level + 1}
              expandedItems={expandedItems}
              toggleItem={toggleItem}
              handleAccountClick={handleAccountClick}
              activeItemId={activeItemId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MultiLevelDropdown = ({ data, handleAccountClick, expandedItems: controlledExpandedItems, activeItemId: controlledActiveItemId, onToggleExpand }) => {
  const [internalExpandedItems, setInternalExpandedItems] = useState([]);
  const [internalActiveItemId, setInternalActiveItemId] = useState(null);

  // Use controlled props if provided, otherwise use internal state
  const expandedItems = controlledExpandedItems !== undefined ? controlledExpandedItems : internalExpandedItems;
  const activeItemId = controlledActiveItemId !== undefined ? controlledActiveItemId : internalActiveItemId;

  const toggleItem = (id) => {
    if (controlledExpandedItems !== undefined && onToggleExpand) {
      // If controlled, call parent handler
      onToggleExpand(id);
    } else {
      // Use internal state
      setInternalExpandedItems((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    }
  };

  const handleActiveItem = (item) => {
    if (controlledActiveItemId === undefined) {
      setInternalActiveItemId(item.id);
    }
    handleAccountClick(item, 'view'); // Call the provided handler
  };

  return (
    <div className="dropdown-container">
      {data.map((item) => (
        <MenuItem
          key={item.id}
          item={item}
          level={1}
          expandedItems={expandedItems}
          toggleItem={toggleItem}
          // handleAccountClick={handleAccountClick}
          handleAccountClick={(item, action) => {
            if (action === 'view') {
              handleActiveItem(item);
            } else {
              handleAccountClick(item, action);
            }
          }}
          activeItemId={activeItemId}
        />
      ))}
    </div>
  );
};

export default MultiLevelDropdown;
