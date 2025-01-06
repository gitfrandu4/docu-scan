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
    const canvas = tempCanvasRef.current;
    
    // Set canvas size to match video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Stop the video stream
    webcam.close(cameraRef.current);
    
    // Convert to blob and create URL
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      imageRef.current.src = url;
      imageRef.current.style.display = "block";
      video.style.display = "none";
      setStreaming("image");
      // Run single detection on the captured frame
      detect(imageRef.current, model, canvasRef.current, null);
      setShouldCrop(true); // This will trigger the crop in handleDetection
    }, 'image/jpeg', 0.95);
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
          <button
            onClick={() => {
              if (streaming === "camera") {
                webcam.close(cameraRef.current);
                cameraRef.current.style.display = "none";
                setStreaming(null);
              } else {
                webcam.open(cameraRef.current);
                cameraRef.current.style.display = "block";
                setStreaming("camera");
              }
            }}
            title={t('toggleCamera')}
          >
            <MdCameraswitch size={24} />
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
