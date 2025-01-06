import React, { useState, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import { useTranslation } from 'react-i18next';
import './i18n';
import Loader from "./components/loader";
import ButtonHandler from "./components/btn-handler";
import SplashScreen from "./components/splash-screen";
import ResultPage from "./components/result-page";
import { detect, detectVideo } from "./utils/detect";
import "./style/App.css";

const App = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState({ loading: true, progress: 0 });
  const [showSplash, setShowSplash] = useState(true);
  const [croppedImage, setCroppedImage] = useState(null);
  const [shouldCrop, setShouldCrop] = useState(false);
  const [model, setModel] = useState({
    net: null,
    inputShape: [1, 0, 0, 3],
  });

  const imageRef = useRef(null);
  const cameraRef = useRef(null);
  const canvasRef = useRef(null);

  const modelName = "yolov11n";

  const handleDetection = (boxes_data, ratios, modelWidth, modelHeight) => {
    console.group('🎯 Cropping Process');
    if (boxes_data.length > 0) {
      // Get the first detection
      const [y1, x1, y2, x2] = boxes_data.slice(0, 4);
      console.log('📦 Raw detection box:', { y1, x1, y2, x2 });
      
      // First check if video is active, then fallback to image
      const sourceElement = cameraRef.current?.style.display !== "none" ? cameraRef.current : imageRef.current;
      console.log('🖼️ Source element type:', sourceElement instanceof HTMLVideoElement ? 'video' : 'image');
      
      // Only proceed with cropping if it's an image or if shouldCrop is true for video
      if (sourceElement instanceof HTMLVideoElement && !shouldCrop) {
        console.log('⏳ Waiting for shot button click...');
        console.groupEnd();
        return;
      }
      
      // For video, ensure it's ready and has valid dimensions
      if (sourceElement instanceof HTMLVideoElement) {
        if (!sourceElement.videoWidth || !sourceElement.videoHeight) {
          console.log('⏳ Waiting for video dimensions to be available...');
          console.groupEnd();
          return;
        }
      }
      
      // Check if the source element is ready
      if (!sourceElement || 
          (sourceElement instanceof HTMLImageElement && !sourceElement.complete) ||
          (sourceElement instanceof HTMLVideoElement && sourceElement.readyState < 2)) {
        console.error('❌ Source element not ready:', {
          exists: !!sourceElement,
          complete: sourceElement instanceof HTMLImageElement ? sourceElement.complete : 'N/A',
          readyState: sourceElement instanceof HTMLVideoElement ? sourceElement.readyState : 'N/A'
        });
        console.groupEnd();
        return;
      }

      // Get the actual dimensions of the source element
      const sourceWidth = sourceElement instanceof HTMLVideoElement ? sourceElement.videoWidth : sourceElement.naturalWidth;
      const sourceHeight = sourceElement instanceof HTMLVideoElement ? sourceElement.videoHeight : sourceElement.naturalHeight;

      console.log('📐 Source dimensions:', { sourceWidth, sourceHeight });

      if (sourceWidth === 0 || sourceHeight === 0) {
        console.error('❌ Source element has no dimensions');
        console.groupEnd();
        return;
      }

      // The model gives coordinates in 640x640 space after padding
      // First, we need to unpad these coordinates
      const modelAspectRatio = modelWidth / modelHeight;
      const sourceAspectRatio = sourceWidth / sourceHeight;
      
      let unpadX1, unpadX2, unpadY1, unpadY2;
      
      if (sourceAspectRatio > modelAspectRatio) {
        // Image was padded vertically
        const scaleFactor = modelWidth / sourceWidth;
        const unpadHeight = sourceHeight * scaleFactor;
        const padding = (modelHeight - unpadHeight) / 2;
        
        unpadX1 = x1;
        unpadX2 = x2;
        unpadY1 = Math.max(0, y1 - padding);
        unpadY2 = Math.min(modelHeight - padding, y2 - padding);
      } else {
        // Image was padded horizontally
        const scaleFactor = modelHeight / sourceHeight;
        const unpadWidth = sourceWidth * scaleFactor;
        const padding = (modelWidth - unpadWidth) / 2;
        
        unpadX1 = Math.max(0, x1 - padding);
        unpadX2 = Math.min(modelWidth - padding, x2 - padding);
        unpadY1 = y1;
        unpadY2 = y2;
      }
      
      console.log('📏 Unpadded model coordinates:', {
        x1: unpadX1,
        x2: unpadX2,
        y1: unpadY1,
        y2: unpadY2
      });

      // Now scale these coordinates to the source dimensions
      const scaleX = sourceWidth / modelWidth;
      const scaleY = sourceHeight / modelHeight;
      
      console.log('📊 Scale factors:', { scaleX, scaleY });
      
      // Calculate actual coordinates in the original image space
      const actualX1 = Math.max(0, Math.round(unpadX1 * scaleX));
      const actualX2 = Math.min(sourceWidth, Math.round(unpadX2 * scaleX));
      const actualY1 = Math.max(0, Math.round(unpadY1 * scaleY));
      const actualY2 = Math.min(sourceHeight, Math.round(unpadY2 * scaleY));
      
      console.log('🎯 Final crop coordinates:', {
        x1: actualX1,
        x2: actualX2,
        y1: actualY1,
        y2: actualY2
      });
      
      // Create a temporary canvas to crop the image
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      
      // Set canvas size to the crop size
      const cropWidth = actualX2 - actualX1;
      const cropHeight = actualY2 - actualY1;
      
      console.log('✂️ Crop dimensions:', { cropWidth, cropHeight });
      
      if (cropWidth <= 0 || cropHeight <= 0) {
        console.error('❌ Invalid crop dimensions');
        console.groupEnd();
        return;
      }

      tempCanvas.width = cropWidth;
      tempCanvas.height = cropHeight;
      
      try {
        console.log('🎨 Drawing crop to canvas...');
        // Draw the cropped portion
        tempCtx.drawImage(
          sourceElement,
          actualX1, actualY1, // Start at detection box
          cropWidth, cropHeight, // Width and height of detection
          0, 0, // Place at 0,0 in destination
          cropWidth, cropHeight // Same size in destination
        );
        
        // Convert to base64
        const croppedDataUrl = tempCanvas.toDataURL('image/png');
        console.log('✅ Successfully created cropped image');
        setCroppedImage(croppedDataUrl);
        // Reset the crop flag after successful crop
        setShouldCrop(false);
      } catch (error) {
        console.error('❌ Error cropping image:', error);
        setShouldCrop(false);
      }
    } else {
      console.log('ℹ️ No detections found');
    }
    console.groupEnd();
  };

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('🔧 ServiceWorker registration successful:', registration.scope);
          })
          .catch(error => {
            console.warn('🚫 ServiceWorker registration failed:', error);
          });
      });
    }

    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 5000);

    // Load model
    tf.ready().then(async () => {
      try {
        const yolov11 = await tf.loadGraphModel(
          `${window.location.href}/${modelName}_web_model/model.json`,
          {
            onProgress: (fractions) => {
              setLoading({ loading: true, progress: fractions });
            },
          }
        );

        const dummyInput = tf.ones(yolov11.inputs[0].shape);
        const warmupResults = yolov11.execute(dummyInput);

        setLoading({ loading: false, progress: 1 });
        setModel({
          net: yolov11,
          inputShape: yolov11.inputs[0].shape,
        });

        tf.dispose([warmupResults, dummyInput]);
      } catch (error) {
        console.error('❌ Error loading model:', error);
        setLoading({ loading: false, progress: 0 });
      }
    });

    return () => clearTimeout(splashTimer);
  }, []);

  if (showSplash || loading.loading) {
    return (
      <>
        {showSplash && <SplashScreen />}
        {loading.loading && <Loader>{t('loading')} {(loading.progress * 100).toFixed(2)}%</Loader>}
      </>
    );
  }

  if (croppedImage) {
    return (
      <ResultPage 
        croppedImage={croppedImage} 
        onBack={() => {
          setCroppedImage(null);
          // Reset video if it was active
          if (cameraRef.current && cameraRef.current.style.display !== "none") {
            cameraRef.current.style.display = "block";
            detectVideo(cameraRef.current, model, canvasRef.current, handleDetection);
          }
        }}
      />
    );
  }

  return (
    <div className="App">
      <div className="header">
        <h1>DocuScan AI</h1>
      </div>

      <div className="content">
        {model.net && (
          <>
            <img
              src="#"
              ref={imageRef}
              onLoad={() => detect(imageRef.current, model, canvasRef.current, handleDetection)}
            />
            <video
              autoPlay
              muted
              ref={cameraRef}
              style={{ display: "none" }}
              onPlay={() => {
                if (!croppedImage && !showSplash && !loading.loading) {
                  // Only start detection when everything is ready
                  detectVideo(cameraRef.current, model, canvasRef.current, handleDetection);
                }
              }}
            />
            <canvas width={model.inputShape[1]} height={model.inputShape[2]} ref={canvasRef} />
          </>
        )}
      </div>

      <ButtonHandler 
        imageRef={imageRef} 
        cameraRef={cameraRef} 
        canvasRef={canvasRef}
        model={model}
        isModelLoaded={!!model.net}
        setShouldCrop={setShouldCrop}
      />
    </div>
  );
};

export default App;
