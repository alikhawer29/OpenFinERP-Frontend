import { BsArrowLeft } from 'react-icons/bs';
import { useNavigate } from 'react-router';
import './style.css';

const BackButton = ({ handleBack, url = '' }) => {
  const navigate = useNavigate(); 

  const goBack = () => {
    if (url) {
      navigate(url);
    } else {
      navigate(-1);
    }
  };

  return (
    <button className="backButton" onClick={handleBack || goBack}>
      <BsArrowLeft size={20} />
      <p>Back</p>
    </button>
  );
};

export default BackButton;
