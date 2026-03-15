import React, { useState } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import Theme1 from '../../assets/images/theme1.jpg';
import Theme2 from '../../assets/images/theme2.jpg';
import Theme3 from '../../assets/images/theme3.jpg';
import Theme4 from '../../assets/images/theme4.jpg';
import Theme5 from '../../assets/images/theme5.jpg';
import CustomButton from '../../Components/CustomButton';
import useThemeStore from '../../Stores/ThemeStore';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../Hooks/usePageTitle';

const Preferences = () => {
  usePageTitle('Themes');
  let navigate = useNavigate();
  const setTheme = useThemeStore((state) => state.setTheme);
  const theme = useThemeStore((state) => state.theme);
  const [selectedTheme, setSelectedTheme] = useState(theme);
  return (
    <section>
      <h2 className="screen-title">Themes</h2>
      <div className="d-card py-45">
        <div className="d-flex flex-wrap gap-4">
          <div
            className="select-item-box dark-teal"
            onClick={() => setSelectedTheme('dark-teal')}
          >
            <div className="theme-image-wrapper">
              <img src={Theme1} />
            </div>
            <div className="d-flex justify-content-between mt-2">
              <p className="m-0">Glow</p>
              {selectedTheme === 'dark-teal' ? (
                <FaCheckCircle size={24} color="#5CD873" />
              ) : null}
            </div>
          </div>
          <div
            className="select-item-box purple"
            onClick={() => setSelectedTheme('purple')}
          >
            <div className="theme-image-wrapper">
              <img src={Theme2} />
            </div>
            <div className="d-flex justify-content-between mt-2">
              <p className="m-0">Royal</p>
              {selectedTheme === 'purple' ? (
                <FaCheckCircle size={24} color="#5CD873" />
              ) : null}
            </div>
          </div>
          <div
            className="select-item-box teal"
            onClick={() => setSelectedTheme('teal')}
          >
            <div className="theme-image-wrapper">
              <img src={Theme3} />
            </div>
            <div className="d-flex justify-content-between mt-2">
              <p className="m-0">Breeze</p>
              {selectedTheme === 'teal' ? (
                <FaCheckCircle size={24} color="#5CD873" />
              ) : null}
            </div>
          </div>
          <div
            className="select-item-box blue"
            onClick={() => setSelectedTheme('blue')}
          >
            <div className="theme-image-wrapper">
              <img src={Theme4} />
            </div>
            <div className="d-flex justify-content-between mt-2">
              <p className="m-0">Midnight</p>
              {selectedTheme === 'blue' ? (
                <FaCheckCircle size={24} color="#5CD873" />
              ) : null}
            </div>
          </div>
          <div
            className="select-item-box yellow"
            onClick={() => setSelectedTheme('yellow')}
          >
            <div className="theme-image-wrapper">
              <img src={Theme5} />
            </div>
            <div className="d-flex justify-content-between mt-2">
              <p className="m-0">Amber</p>
              {selectedTheme === 'yellow' ? (
                <FaCheckCircle size={24} color="#5CD873" />
              ) : null}
            </div>
          </div>
        </div>

        <div className="d-flex">
          <CustomButton
            text={'Set Preference'}
            className={'mt-45'}
            onClick={() => {
              if (selectedTheme) {
                setTheme(selectedTheme);
                navigate('/dashboard');
              }
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default Preferences;
