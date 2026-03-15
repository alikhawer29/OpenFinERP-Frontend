import React, { useState, useRef, useEffect } from 'react';
import './Accordion.css';
import { HiChevronDown } from 'react-icons/hi2';

const Accordion = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContentHeight(entry.target.scrollHeight);
        }
      });

      resizeObserver.observe(contentRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  return (
    <div className={`accordion ${isOpen ? 'open' : ''}`}>
      <button
        type="button"
        className="accordion-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="accordion-title">{title}</span>
        <HiChevronDown size={22} className="accordion-icon" />
      </button>
      <div
        className={`accordion-content ${isOpen ? 'open' : ''}`}
        style={{ height: isOpen ? `${contentHeight}px` : '0px' }}
      >
        <div className="accordion-content-inner" ref={contentRef}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Accordion;
