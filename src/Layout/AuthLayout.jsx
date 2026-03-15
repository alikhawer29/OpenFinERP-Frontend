import { Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './AuthLayout.css';
import dashboardLeftImage from '../assets/images/auth-leftImg.png';

export const AuthLayout = ({
  authTitle,
  authMain,
  authParagraph,
  children,
  backOption,
  adminAuth = false,
}) => {
  return (
    <section className="auth-wrapper beechMein">
      <Container fluid>
        <Row className="beechMein h-100 g-0">
          <Col lg={6} md={6} className="">
            <div className="auth-left-section">
              <div className="auth-marketing-content">
                <div className="auth-marketing-text">
                  <h1 className="auth-marketing-title">
                    Real-Time Insight.
                    <br />
                    Real-World Results.
                  </h1>
                  <p className="auth-marketing-subtitle">
                    Your Finances, One View.
                  </p>
                </div>
                <div className="auth-dashboard-preview">
                  <img
                    src={dashboardLeftImage}
                    alt="Dashboard Preview"
                    className="dashboard-preview-img"
                  />
                </div>
              </div>
            </div>
          </Col>
          <Col lg={6} md={6} className="auth-right-section">
            <div className="authForm authBox authformBg">
              <div className="authFormHeader text-center mb-lg-5 mb-3">
                <h2 className="authTitle">{authTitle}</h2>
                {authMain && (
                  <p className="mb-0 px-lg-5 mx-lg-5 px-2 mx-2">
                    {authParagraph}
                  </p>
                )}
              </div>
              {children}
              {backOption && (
                <div className="text-center mt-4">
                  <Link
                    to={adminAuth ? '/admin/login' : '/login'}
                    className="text-link"
                  >
                    Back To Login
                  </Link>
                </div>
              )}
            </div>
          </Col>
        </Row>

      </Container>
    </section>
  );
};
