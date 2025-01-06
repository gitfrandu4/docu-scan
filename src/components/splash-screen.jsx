import React from 'react';
import { useTranslation } from 'react-i18next';
import '../style/splash-screen.css';

const SplashScreen = () => {
  const { t } = useTranslation();

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="logo-container">
          <div className="morph-background"></div>
          <img 
            src="/icons/android/android-launchericon-144-144.png" 
            alt={t('appName')}
            className="logo"
          />
          <div className="scan-line"></div>
        </div>
        <h1 className="app-name">{t('appName')}</h1>
        <p className="tagline">{t('tagline')}</p>
      </div>
    </div>
  );
};

export default SplashScreen; 
