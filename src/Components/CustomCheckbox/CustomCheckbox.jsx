import React from 'react';
import './CustomCheckbox.css';

const CustomCheckbox = ({
  label,
  checked,
  onChange,
  name,
  readOnly,
  style = {},
}) => {
  return (
    <label
      className={`checkbox-wrapper cp checkbox-component-wrapper ${
        readOnly ? 'readonly' : ''
      }`}
      style={style}
    >
      <div className="checkbox-container">
        <input
          type="checkbox"
          checked={checked}
          onChange={readOnly ? undefined : onChange}
          name={name}
          readOnly={readOnly}
          disabled={readOnly}
        />
        <span className="custom-checkbox"></span>
      </div>
      <span className="checkbox-label">{label}</span>
    </label>
  );
};

export default CustomCheckbox;
