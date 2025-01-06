import React from 'react';
import '../style/splash-screen.css';

const SplashScreen = () => {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="logo-container">
          <img 
            src="/icons/android/android-launchericon-144-144.png" 
            alt="DocuScan AI"
            className="logo"
          />
          <div className="scan-line"></div>
        </div>
        <h1 className="app-name">DocuScan AI</h1>
        <p className="tagline">Intelligent Document Scanning</p>
      </div>
    </div>
  );
};

export default SplashScreen; 
