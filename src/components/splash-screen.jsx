import React from 'react';
import '../style/splash-screen.css';

const SplashScreen = () => {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="logo-container">
          <span className="logo">📑</span>
          <div className="scan-line"></div>
        </div>
        <h1 className="app-name">DocuScan AI</h1>
        <p className="tagline">Intelligent Document Scanning</p>
      </div>
    </div>
  );
};

export default SplashScreen; 
