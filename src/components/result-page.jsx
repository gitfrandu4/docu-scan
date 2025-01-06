import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdArrowBack, MdFileDownload } from "react-icons/md";

const ResultPage = ({ croppedImage, onBack }) => {
  const { t } = useTranslation();

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = croppedImage;
    link.download = 'docuscan-result.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="result-page">
      <div className="result-header">
        <button 
          onClick={onBack}
          title={t('backToScan')}
          className="back-button"
        >
          <MdArrowBack size={24} />
        </button>
        <h2>{t('resultTitle')}</h2>
        <button
          onClick={handleDownload}
          title={t('downloadResult')}
          className="download-button"
        >
          <MdFileDownload size={24} />
        </button>
      </div>
      <div className="result-content">
        <img 
          src={croppedImage} 
          alt={t('resultImage')}
          className="result-image"
        />
      </div>
    </div>
  );
};

export default ResultPage; 
