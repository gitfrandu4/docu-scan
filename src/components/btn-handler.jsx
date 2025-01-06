import { useState, useRef, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Webcam } from "../utils/webcam";

const ButtonHandler = ({ imageRef, cameraRef, isModelLoaded }) => {
  const { t } = useTranslation();
  const [streaming, setStreaming] = useState('camera'); // Start with camera streaming
  const inputImageRef = useRef(null);
  const webcam = new Webcam();

  // Start webcam automatically when component mounts and model is loaded
  useEffect(() => {
    if (isModelLoaded && streaming === 'camera') {
      webcam.open(cameraRef.current);
      cameraRef.current.style.display = "block";
    }
  }, [isModelLoaded]);

  // closing image
  const closeImage = () => {
    const url = imageRef.current.src;
    imageRef.current.src = "#";
    URL.revokeObjectURL(url);

    setStreaming('camera'); // Return to camera after closing image
    inputImageRef.current.value = "";
    imageRef.current.style.display = "none";
    
    // Reopen webcam
    webcam.open(cameraRef.current);
    cameraRef.current.style.display = "block";
  };

  if (!isModelLoaded) {
    return null; // Don't show buttons until model is loaded
  }

  return (
    <div className="btn-container">
      {/* Image Handler */}
      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const url = URL.createObjectURL(e.target.files[0]);
          imageRef.current.src = url;
          imageRef.current.style.display = "block";
          // Close webcam when showing image
          webcam.close(cameraRef.current);
          cameraRef.current.style.display = "none";
          setStreaming("image");
        }}
        ref={inputImageRef}
      />
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

      {/* Webcam Handler */}
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
    </div>
  );
};

export default ButtonHandler;
