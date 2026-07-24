import React from 'react';
import { HiOutlineRefresh, HiOutlineHome } from 'react-icons/hi';
import './ErrorBoundary.css';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-card">
            <div className="error-boundary-icon">⚠️</div>
            <h1 className="error-boundary-title">Something Went Wrong</h1>
            <div className="error-boundary-subtitle">
              A textbook fell off the shelf and blocked the hallway! 📚
            </div>
            
            {this.state.error && (
              <pre className="error-boundary-details">
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            )}

            <p className="error-boundary-text">
              Try refreshing the app or heading back to the dashboard.
            </p>

            <div className="error-boundary-actions">
              <button className="btn btn-outline" onClick={() => window.location.reload()}>
                <HiOutlineRefresh /> Reload Page
              </button>
              <button className="btn btn-accent" onClick={this.handleReset}>
                <HiOutlineHome /> Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
