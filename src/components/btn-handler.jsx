import { useState, useRef, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { MdCameraAlt, MdFileUpload, MdCameraswitch } from "react-icons/md";
import { Webcam } from "../utils/webcam";
import LanguageSwitcher from "./language-switcher";
import { detect } from "../utils/detect";

const ButtonHandler = ({ imageRef, cameraRef, canvasRef, model, isModelLoaded, setShouldCrop }) => {
  const { t } = useTranslation();
  const [streaming, setStreaming] = useState('camera');
  const inputImageRef = useRef(null);
  const tempCanvasRef = useRef(null);
  const webcam = new Webcam();

  useEffect(() => {
    if (isModelLoaded && streaming === 'camera') {
      webcam.open(cameraRef.current);
      cameraRef.current.style.display = "block";
    }
  }, [isModelLoaded]);

  useEffect(() => {
    // Create a temporary canvas for frame capture
    const canvas = document.createElement('canvas');
    tempCanvasRef.current = canvas;
  }, []);

  const closeImage = () => {
    const url = imageRef.current.src;
    imageRef.current.src = "#";
    URL.revokeObjectURL(url);
    setStreaming('camera');
    inputImageRef.current.value = "";
    imageRef.current.style.display = "none";
    webcam.open(cameraRef.current);
    cameraRef.current.style.display = "block";
  };

  const captureFrame = () => {
    const video = cameraRef.current;
    
    // Ensure video has valid dimensions
    if (!video || !video.videoWidth || !video.videoHeight) {
      console.log('⏳ Waiting for video to be ready...');
      return;
    }
    
    const canvas = tempCanvasRef.current;
    
    // Set canvas size to match video dimensions but with higher resolution
    canvas.width = video.videoWidth * 2;  // Double the resolution
    canvas.height = video.videoHeight * 2;
    
    // Draw the current frame to canvas with image smoothing optimized
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Scale up and draw
    ctx.scale(2, 2);  // Scale to match the increased canvas size
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    ctx.scale(0.5, 0.5);  // Reset scale
    
    // Stop the video stream and hide video element
    webcam.close(cameraRef.current);
    video.style.display = "none";
    setStreaming("image");
    
    // Convert to blob and create URL with higher quality
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const img = imageRef.current;
      img.src = url;
      img.style.display = "block";
      
      // Wait for the image to load before running a single detection
      img.onload = () => {
        // Run a single detection and set shouldCrop
        detect(img, model, canvasRef.current, (boxes_data, ratios, modelWidth, modelHeight) => {
          setShouldCrop(true);
          handleDetection(boxes_data, ratios, modelWidth, modelHeight);
        });
      };
    }, 'image/jpeg', 1.0);  // Máxima calidad JPEG
  };

  if (!isModelLoaded) {
    return null;
  }

  return (
    <div className="btn-container">
      {streaming === "image" ? (
        <>
          <button 
            onClick={closeImage}
            title={t('backToCamera')}
          >
            <MdCameraAlt size={24} />
          </button>
          <button 
            onClick={() => inputImageRef.current.click()}
            title={t('newImage')}
          >
            <MdFileUpload size={24} />
          </button>
        </>
      ) : (
        <>
          <button 
            onClick={() => {
              if (streaming === 'camera') {
                webcam.close(cameraRef.current);
                cameraRef.current.style.display = "none";
              }
              inputImageRef.current.click();
            }}
            title={t('uploadImage')}
          >
            <MdFileUpload size={24} />
          </button>
          <button
            className="capture-btn"
            onClick={captureFrame}
            title={t('takeShot')}
          >
            <MdCameraAlt size={24} />
          </button>
        </>
      )}

      <LanguageSwitcher />

      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files[0]) {
            const url = URL.createObjectURL(e.target.files[0]);
            imageRef.current.src = url;
            imageRef.current.style.display = "block";
            webcam.close(cameraRef.current);
            cameraRef.current.style.display = "none";
            setStreaming("image");
          }
        }}
        ref={inputImageRef}
      />
    </div>
  );
};

export default ButtonHandler;
