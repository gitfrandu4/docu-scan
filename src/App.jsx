import React, { useState, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl"; // set backend to webgl
import { useTranslation } from 'react-i18next';
import './i18n';
import Loader from "./components/loader";
import ButtonHandler from "./components/btn-handler";
import LanguageSwitcher from "./components/language-switcher";
import { detect, detectVideo } from "./utils/detect";
import "./style/App.css";

const App = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState({ loading: true, progress: 0 }); // loading state
  const [model, setModel] = useState({
    net: null,
    inputShape: [1, 0, 0, 3],
  }); // init model & input shape

  // references
  const imageRef = useRef(null);
  const cameraRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // model configs
  const modelName = "yolov11n";

  useEffect(() => {
    tf.ready().then(async () => {
      const yolov11 = await tf.loadGraphModel(
        `${window.location.href}/${modelName}_web_model/model.json`,
        {
          onProgress: (fractions) => {
            setLoading({ loading: true, progress: fractions }); // set loading fractions
          },
        }
      ); // load model

      // warming up model
      const dummyInput = tf.ones(yolov11.inputs[0].shape);
      const warmupResults = yolov11.execute(dummyInput);

      setLoading({ loading: false, progress: 1 });
      setModel({
        net: yolov11,
        inputShape: yolov11.inputs[0].shape,
      }); // set model & input shape

      tf.dispose([warmupResults, dummyInput]); // cleanup memory
    });
  }, []);

  return (
    <div className="App">
      <LanguageSwitcher />
      {loading.loading && <Loader>{t('loading')} {(loading.progress * 100).toFixed(2)}%</Loader>}
      <div className="header">
        <h1>{t('title')}</h1>
        <p>
          {t('description')} <code>tensorflow.js</code>
        </p>
        <p>
          {t('serving')}: <code className="code">{modelName}</code>
        </p>
      </div>

      <div className="content">
        <img
          src="#"
          ref={imageRef}
          onLoad={() => detect(imageRef.current, model, canvasRef.current)}
        />
        <video
          autoPlay
          muted
          ref={cameraRef}
          onPlay={() => detectVideo(cameraRef.current, model, canvasRef.current)}
        />
        <video
          autoPlay
          muted
          ref={videoRef}
          onPlay={() => detectVideo(videoRef.current, model, canvasRef.current)}
        />
        <canvas width={model.inputShape[1]} height={model.inputShape[2]} ref={canvasRef} />
      </div>

      <ButtonHandler imageRef={imageRef} cameraRef={cameraRef} videoRef={videoRef} />
    </div>
  );
};

export default App;
