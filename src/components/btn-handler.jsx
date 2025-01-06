import { useState, useRef, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Webcam } from "../utils/webcam";
import LanguageSwitcher from "./language-switcher";

const ButtonHandler = ({ imageRef, cameraRef, isModelLoaded }) => {
  const { t } = useTranslation();
  const [streaming, setStreaming] = useState('camera');
  const inputImageRef = useRef(null);
  const webcam = new Webcam();

  useEffect(() => {
    if (isModelLoaded && streaming === 'camera') {
      webcam.open(cameraRef.current);
      cameraRef.current.style.display = "block";
    }
  }, [isModelLoaded]);

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

  if (!isModelLoaded) {
    return null;
  }

  return (
    <div className="btn-container">
      <button
        onClick={() => {
          if (streaming === null || streaming === 'camera') {
            webcam.close(cameraRef.current);
            cameraRef.current.style.display = "none";
            inputImageRef.current.click();
          } else if (streaming === "image") {
            closeImage();
          }
        }}
      >
        {streaming === "image" ? "📷" : "📁"}
      </button>

      <button
        className="capture-btn"
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
      />

      <LanguageSwitcher />

      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const url = URL.createObjectURL(e.target.files[0]);
          imageRef.current.src = url;
          imageRef.current.style.display = "block";
          webcam.close(cameraRef.current);
          cameraRef.current.style.display = "none";
          setStreaming("image");
        }}
        ref={inputImageRef}
      />
    </div>
  );
};

export default ButtonHandler;
