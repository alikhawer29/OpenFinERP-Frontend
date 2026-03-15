import React, { useEffect, useMemo, useState } from 'react';
import { FaFile, FaXmark } from 'react-icons/fa6';
import DOC from '../../assets/images/doc.svg?react';
import PDF from '../../assets/images/pdf.svg?react';
import TXT from '../../assets/images/txt.svg?react';
import XLS from '../../assets/images/xls.svg?react';
import XML from '../../assets/images/xml.svg?react';
import { formatFileSize } from '../../Utils/Utils';
import Styles from './UploadAndDisplayFiles.module.css';

const UploadAndDisplayFiles = ({
  files = [],
  className,
  label,
  required = false,
  onChange,
  numberOfFiles = 3,
  allowSameFileUpload = true,
  showNumberOfFilesText = false,
  errorFromParent = '',
  height = '',
  onDelete,
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false); // New flag

  // Memoize files array
  const memoizedFiles = useMemo(() => files, [files]);

  // Initialize images from parent only once
  useEffect(() => {
    if (memoizedFiles.length && !initialized) {
      const initializedFiles = memoizedFiles.map((file) => ({
        id: file.id,
        name: file.name,
        file_url: file.file_url,
        type: file.path.split('.').pop(), // Infer type from file extension
      }));
      setSelectedFiles(initializedFiles);
    }
    setInitialized(true);
  }, [memoizedFiles, initialized]);

  // Call onChange when files are updated, but skip initialization case
  useEffect(() => {
    if (initialized && onChange) {
      onChange(selectedFiles);
    }
  }, [selectedFiles, initialized]);
  useEffect(() => {
    setError(errorFromParent);
  }, [errorFromParent]);

  const handleFileChange = (e) => {
    const selectedFilesArray = Array.from(e.target.files);
    const validFileTypes = [
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/pdf', // .pdf
      'text/plain', // .txt
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/xml', // .xml
      'text/xml', // .xml (some systems use this)
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/gif',
      'image/png',
    ];

    e.target.value = null; // Reset input to allow selecting the same file again

    const allValid = selectedFilesArray.every((file) =>
      validFileTypes.includes(file.type)
    );

    if (!allValid) {
      setError(
        'Only files with type PNG, JPG, JPEG, TXT, PDF, DOC, XLS are allowed.'
      );
      return;
    }

    if (selectedFilesArray.length + selectedFiles.length > numberOfFiles) {
      setError(`You can only upload up to ${numberOfFiles} files.`);
      return;
    }
    const newFiles = allowSameFileUpload
      ? selectedFilesArray
      : selectedFilesArray.filter(
          (file) =>
            !selectedFiles.some(
              (f) => f.name === file.name && f.size === file.size
            )
        );

    setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]);
    setError('');
  };

  const handleRemoveFile = (index, id) => {
    setError('');
    if (typeof selectedFiles[index] === 'string') {
      let newFiles = [...selectedFiles];
      newFiles.splice(index, 1);
      setSelectedFiles(newFiles);
    } else {
      setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    }
    if (onDelete) {
      onDelete(id);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'doc':
      case 'docx':
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return <DOC />;

      case 'pdf':
      case 'application/pdf':
        return <PDF />;

      case 'txt':
      case 'text/plain':
        return <TXT />;

      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      case 'xls':
      case 'xlsx':
        return <XLS />;

      case 'application/xml':
      case 'text/xml':
        return <XML />;

      default:
        return <FaFile size={25} />;
    }
  };
  return (
    <div
      style={{ position: 'relative' }}
      className={`${
        Styles[className] ? Styles[className] : ''
      } position-relative`}
    >
      <p className={Styles.fileUploaderLabel}>
        {label}
        {required ? <span className="text-danger">*</span> : ''}
      </p>

      {/* Conditionally render the selected files */}
      {!!selectedFiles.length && (
        <div
          className={`d-flex flex-column justify-content-start gap-3 my-3 ${Styles.displayFiles}`}
        >
          {selectedFiles?.map((file, index) => (
            <div key={index} style={{ height: height, position: 'relative' }}>
              {file.file_url ? (
                <>
                  <div className={Styles.uploadedFiles}>
                    <div className={Styles.nameIconWrapper}>
                      <div style={{ minWidth: 28 }}>{getIcon(file.type)}</div>
                      <a
                        style={{ width: 126 }}
                        className="d-flex flex-column flex-1"
                        target="_blank"
                        href={file.file_url}
                      >
                        <p className={Styles.fileName}>{file.name}</p>
                      </a>
                    </div>
                    <button
                      type="button"
                      className={Styles.fileRemoveButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(index, file?.id);
                      }}
                    >
                      <FaXmark size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <div className={Styles.uploadedFiles}>
                  <div className={Styles.nameIconWrapper}>
                    <div className="beechMein" style={{ minWidth: 28 }}>
                      {getIcon(file.type)}
                    </div>
                    <div
                      style={{ width: 126 }}
                      className="d-flex flex-column flex-1"
                    >
                      <p className={Styles.fileName}>{file.name}</p>
                      <p className={Styles.size}>{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={Styles.fileRemoveButton}
                    onClick={() => {
                      handleRemoveFile(index, file?.id);
                    }}
                  >
                    <FaXmark size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedFiles?.length < numberOfFiles ? (
        <label
          style={{ height: height }}
          htmlFor="myDocument"
          className={Styles.fileUploadArea}
        >
          <div>
            <div className="d-flex flex-column justify-content-center align-items-center gap-2">
              <FaFile size={32} color="#666" />
              <p>Upload File{numberOfFiles > 1 ? '(s)' : ''}</p>
            </div>
            {/* <p>Or</p> */}
            {/* <p>Drag & Drop Document{numberOfFiles > 1 && "(s)"}</p> */}
            {numberOfFiles > 1 && showNumberOfFilesText ? (
              <p style={{ color: '#999', fontSize: '12px' }}>
                Minimum 1 Maximum {numberOfFiles} Documents
              </p>
            ) : null}
          </div>
        </label>
      ) : (
        ''
      )}

      <input
        id="myDocument"
        style={{
          opacity: 0,
          position: 'absolute',
          bottom: 0,
          cursor: 'pointer',
          zIndex: -1,
        }}
        type="file"
        multiple={numberOfFiles > 1}
        // required={required}
        name="document"
        accept=".txt,.pdf,.doc,.docx"
        onChange={handleFileChange}
      />
      {error && (
        <p className="mb-0 mt-1 input-error-message text-danger">
          {error}
        </p>
      )}
    </div>
  );
};

export default UploadAndDisplayFiles;
