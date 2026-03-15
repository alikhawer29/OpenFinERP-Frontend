import { FaXmark } from 'react-icons/fa6';
import { formatFileSize, getIcon } from '../../Utils/Utils';
import Styles from './FileDisplayList.module.css';

/**
 * FileDisplayList Component
 *
 * A reusable component for displaying a list of uploaded files with remove functionality
 *
 * @param {Object} props - Component props
 * @param {Object|Array} props.files - Files to display (can be object with values or array)
 * @param {Function} props.onRemoveFile - Callback function when file is removed
 * @param {string} props.className - Additional CSS class name
 * @returns {JSX.Element} FileDisplayList component
 */

const FileDisplayList = ({ files = [], onRemoveFile, className = '' }) => {
  // Convert files to array if it's an object
  const fileArray = Array.isArray(files) ? files : Object.values(files);

  if (!fileArray.length) {
    return null;
  }

  return (
    <div className={`mb-4 ${className}`}>
      {fileArray.map((file, index) => (
        <div key={index} style={{ position: 'relative' }} className="mb-3">
          <div className={Styles.uploadedFiles}>
            <div className={Styles.nameIconWrapper}>
              <div className="beechMein" style={{ minWidth: 28 }}>
                {getIcon(file.type)}
              </div>
              <div style={{ width: 126 }} className="d-flex flex-column flex-1">
                <p className={Styles.fileName}>{file.name}</p>
                <p className={Styles.size}>{formatFileSize(file.size)}</p>
              </div>
            </div>
            <button
              type="button"
              className={Styles.fileRemoveButton}
              onClick={() => {
                onRemoveFile(file);
              }}
            >
              <FaXmark size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FileDisplayList;
