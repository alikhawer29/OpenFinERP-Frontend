import React, { useRef, useState } from 'react';
import { FaMinus, FaPlus } from 'react-icons/fa';
import Styles from './CustomAccordian.module.css';

//  accordionitem component
const AccordionItem = ({ question, answer, isOpen, onClick }) => {
  const contentHeight = useRef();
  return (
    <div className={Styles.wrapper}>
      <button
        className={`${Styles.questionContainer} ${isOpen ? Styles.active : ''}`}
        onClick={onClick}
      >
        <p className={Styles.questionContent}>{question}</p>
        {isOpen ? (
          <div className={Styles.iconWrapper}>
            <FaMinus />
          </div>
        ) : (
          <div className={Styles.iconWrapper}>
            <FaPlus />
          </div>
        )}
      </button>

      <div
        ref={contentHeight}
        className={Styles.answerContainer}
        style={
          isOpen
            ? { height: contentHeight.current.scrollHeight }
            : { height: '0px' }
        }
      >
        <p className={Styles.answerContent}>{answer}</p>
      </div>
    </div>
  );
};

// main Accordion component
const Accordion = ({ data = [] }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const handleItemClick = (index) => {
    setActiveIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <div className={Styles.container}>
      {data?.map((item, index) => (
        <AccordionItem
          key={index}
          question={item.question}
          answer={item.answer}
          isOpen={activeIndex === index}
          onClick={() => handleItemClick(index)}
        />
      ))}
      {children ?? children}
    </div>
  );
};

export default Accordion;
