import { Link } from 'react-router-dom';
import { HiOutlineHome, HiOutlineArrowLeft } from 'react-icons/hi';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="notfound-container">
      <div className="notfound-card">
        <div className="notfound-glitch" data-text="404">404</div>
        <div className="notfound-banner">
          School Bus Missing! 🚌
        </div>
        <p className="notfound-text">
          The page you are looking for has taken a field trip or never existed. Check the URL or head back home!
        </p>
        <div className="notfound-actions">
          <button className="btn btn-outline" onClick={() => window.history.back()}>
            <HiOutlineArrowLeft /> Go Back
          </button>
          <Link to="/" className="btn btn-accent">
            <HiOutlineHome /> Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
