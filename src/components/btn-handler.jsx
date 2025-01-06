import { useState, useRef, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { MdCameraAlt, MdFileUpload, MdCameraswitch } from "react-icons/md";
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
