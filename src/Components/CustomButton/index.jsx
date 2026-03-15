import { PulseLoader } from 'react-spinners';
import './style.css';

const CustomButton = ({
  style,
  type,
  variant,
  className,
  disabled,
  onClick,
  text,
  children,
  loading,
}) => {
  return (
    <div style={{ ...style }}>
      <button
        type={type}
        className={`customButton ${variant} ${className} ${
          disabled ? 'disabled' : ''
        }`}
        onClick={onClick}
        disabled={disabled}
      >
        {loading ? (
          <PulseLoader size={8} className="beechMein" style={{ height: 21 }} />
        ) : (
          text || children
        )}
      </button>
    </div>
  );
};

export default CustomButton;
