import React, { useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import { useTranslation } from 'react-i18next';
import Loader from "./components/loader";
import DocumentScanner from "./components/DocumentScanner";
import './i18n/config';
import "./style/App.css";

const App = () => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState({ loading: true, progress: 0 });
  const [model, setModel] = useState({
    net: null,
    inputShape: [1, 0, 0, 3],
  });
  const [scannedDocument, setScannedDocument] = useState(null);

  // model configs
  const modelName = "yolov11n";

  useEffect(() => {
    tf.ready().then(async () => {
      const yolov11 = await tf.loadGraphModel(
        `${window.location.href}/${modelName}_web_model/model.json`,
        {
          onProgress: (fractions) => {
            setLoading({ loading: true, progress: fractions });
          },
        }
      );

      // warming up model
      const dummyInput = tf.ones(yolov11.inputs[0].shape);
      const warmupResults = yolov11.execute(dummyInput);

      setLoading({ loading: false, progress: 1 });
      setModel({
        net: yolov11,
        inputShape: yolov11.inputs[0].shape,
      });

      tf.dispose([warmupResults, dummyInput]);
    });
  }, []);

  const handleDocumentDetected = ({ image, text }) => {
    setScannedDocument({ image, text });
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="App">
      <div className="language-switcher">
        <button onClick={() => changeLanguage('en')}>EN</button>
        <button onClick={() => changeLanguage('es')}>ES</button>
      </div>
      {loading.loading ? (
        <Loader>{t('loading.model', { progress: (loading.progress * 100).toFixed(2) })}</Loader>
      ) : (
        <div className="content">
          <h1>{t('documentScanner.title')}</h1>
          <DocumentScanner
            model={model}
            onDocumentDetected={handleDocumentDetected}
          />
          {scannedDocument && (
            <div className="scanned-document">
              <h2>{t('documentScanner.scannedDocument')}</h2>
              <img
                src={scannedDocument.image}
                alt={t('documentScanner.scannedDocument')}
                style={{ maxWidth: '100%', maxHeight: '50vh' }}
              />
              <div className="ocr-text">
                <h3>{t('documentScanner.extractedText')}:</h3>
                <pre>{scannedDocument.text}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
