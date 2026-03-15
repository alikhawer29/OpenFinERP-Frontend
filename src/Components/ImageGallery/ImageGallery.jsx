import React, { useEffect, useState } from 'react';
import { FaXmark } from 'react-icons/fa6';
import Styles from './ImageGallery.module.css';

// images = array of urls/string
// gap = 1, 2, 3, 4, 5 (applies sebsequent Bootstrap classes)
// scaleOnHover = true or false (scales up image slightly on mouse hover)
const ImageGallery = ({
  images,
  width = 'auto',
  maxWidth,
  height = 'auto',
  maxHeight = 'auto',
  gap = '2',
  borderRadius = 0,
  scaleOnHover = true,
}) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openModal = (index) => {
    setCurrentIndex(index);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isModalOpen) {
        if (e.key === 'ArrowLeft') {
          goToPrevious();
        } else if (e.key === 'ArrowRight') {
          goToNext();
        } else if (e.key === 'Escape') {
          closeModal();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);
  return (
    <div className={`d-flex gap-${gap} flex-wrap`}>
      {images?.map((image, i) => (
        <img
          key={i}
          src={image}
          alt="banner image"
          className={`${Styles.thumbnail} ${!scaleOnHover ? Styles.noScale : ''}`}
          style={{
            objectFit: 'cover',
            width: width,
            maxWidth: maxWidth,
            maxHeight: maxHeight,
            height: height,
            borderRadius: borderRadius,
          }}
          onClick={() => openModal(i)}
        />
      ))}

      {isModalOpen && (
        <div className={Styles.modal} onClick={closeModal}>
          <div
            className={Styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <span className={Styles.close} onClick={closeModal}>
              <FaXmark />
            </span>
            <img
              src={images[currentIndex]}
              alt="Selected"
              className={Styles.modalImage}
            />
            {images.length > 1 && (
              <>
                <button className={Styles.previous} onClick={goToPrevious}>
                  &#10094;
                </button>
                <button className={Styles.next} onClick={goToNext}>
                  &#10095;
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
