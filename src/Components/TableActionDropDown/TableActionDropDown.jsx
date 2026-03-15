import React, { useEffect, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { HiDotsHorizontal } from 'react-icons/hi';
import './tableActionDropDown.css';
// action = [{name, icon, onClick, className, }]
const TableActionDropDown = ({
  actions = [],
  children,
  displaySeparator = true,
}) => {
  let Icon, Icon2;
  Icon = actions?.[0]?.icon;
  if (!actions.length) {
    return null;
  }
  if (actions.length == 2) {
    Icon2 = actions[1].icon;
  }

  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!action.disabled && action.onClick) {
        action.onClick();
      }
    }
  };

  const handleFocus = (action) => {
    // Optional focus handler - can be extended if needed
    if (action.onFocus) {
      action.onFocus();
    }
  };

  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = () => setShow(false);
    // Listen for a global event to close dropdowns
    document.addEventListener('closeAllTableActionDropdowns', handler);
    return () => document.removeEventListener('closeAllTableActionDropdowns', handler);
  }, []);

  return (
    <>
      {actions.length > 2 ? (
        <Dropdown
          className="tableAction table-action-wrapper"
          show={show}
          onToggle={(nextShow) => setShow(nextShow)}
        >
          <Dropdown.Toggle
            className="p-0 m-0 border-0"
            style={{ boxShadow: 'none' }}
            tabIndex={0}
            aria-label="Actions menu"
            onClick={() => setShow((s) => !s)}
          >
            {children ?? (
              <HiDotsHorizontal size={20} style={{ cursor: 'pointer' }} />
            )}
          </Dropdown.Toggle>

          <Dropdown.Menu align="end" className={`shadow-sm`}>
            {actions.map((action, i) => (
              <Dropdown.Item
                key={i}
                onClick={action.disabled ? undefined : action.onClick}
                onKeyDown={(e) => handleKeyDown(e, action)}
                onFocus={() => handleFocus(action)}
                className={`${action.className} ${!action.className ? 'bg-hover' : ''
                  } d-flex align-items-center gap-2 ${action.disabled ? 'disabled' : ''
                  }`}
                tabIndex={action.disabled ? -1 : 0}
                role="menuitem"
                aria-disabled={action.disabled}
              >
                <action.icon size={20} />
                <span>{action.name}</span>
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      ) : (
        <div className="d-flex cp gap-3 tableAction align-items-center justify-content-center">
          <span
            className={`${actions?.[0].className}  ${actions?.[0].disabled ? 'disabled' : 'tooltip-toggle'
              }`}
            aria-label={actions?.[0].name}
            onClick={actions?.[0].disabled ? undefined : actions?.[0].onClick}
            onKeyDown={(e) => handleKeyDown(e, actions?.[0])}
            onFocus={() => handleFocus(actions?.[0])}
            tabIndex={actions?.[0].disabled ? -1 : 0}
            role="button"
            aria-disabled={actions?.[0].disabled}
            style={{
              cursor: actions?.[0].disabled ? 'not-allowed' : 'pointer',
            }}
          >
            {actions[0]?.icon
              ? React.isValidElement(actions[0].icon)
                ? actions[0].icon
                : <Icon size={20} />
              : <p className='p-0 m-0'>{actions[0].name}</p>}

          </span>
          {actions.length == 2 ? (
            <>
              {displaySeparator && <span>|</span>}
              <span
                className={`action-icon ${actions?.[1].className} ${actions?.[1].disabled ? 'disabled' : 'tooltip-toggle'
                  }`}
                aria-label={actions?.[1].name}
                onClick={
                  actions?.[1].disabled ? undefined : actions?.[1].onClick
                }
                onKeyDown={(e) => handleKeyDown(e, actions?.[1])}
                onFocus={() => handleFocus(actions?.[1])}
                tabIndex={actions?.[1].disabled ? -1 : 0}
                role="button"
                aria-disabled={actions?.[1].disabled}
                style={{
                  cursor: actions?.[1].disabled ? 'not-allowed' : 'pointer',
                }}
              >
                {React.isValidElement(actions[1].icon)
                  ? actions[1].icon
                  : <Icon2 size={20} />}
              </span>
            </>
          ) : null}
        </div>
      )}
    </>
  );
};

export default TableActionDropDown;
