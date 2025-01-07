import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { MdArrowBack, MdFileDownload } from 'react-icons/md'
import { processImage } from '../utils/image-processor'
import ImageSettings, { defaultSettings } from './image-settings'
import Tesseract from 'tesseract.js';
import cv from 'opencv.js';

const fieldCoordinates = [
  { name: 'DNI', x: 50, y: 50, width: 100, height: 50 },
  { name: 'Nombre', x: 200, y: 150, width: 300, height: 50 },
  { name: 'Apellidos', x: 200, y: 210, width: 300, height: 50 },
  { name: 'Fecha de Nacimiento', x: 200, y: 270, width: 300, height: 50 },
  // Agrega más campos según la estructura del DNI
];

// Tamaño fijo al que se redimensionará el DNI

const FIXED_WIDTH = 1586;
const FIXED_HEIGHT = 1000;

const ResultPage = ({ croppedImage, onBack }) => {
  const { t } = useTranslation()
  const [processedImage, setProcessedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const [settings, setSettings] = useState(defaultSettings)

  const [selectedType, setSelectedType] = useState("");


  // Función para redimensionar la imagen
  const resizeImage = (imageElement, targetWidth, targetHeight) => {
    // Crear un canvas temporal para realizar la redimensión
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = targetWidth;
    tempCanvas.height = targetHeight;
  
    const ctx = tempCanvas.getContext('2d');
    ctx.drawImage(imageElement, 0, 0, targetWidth, targetHeight);
  
    return tempCanvas.toDataURL('image/png'); // Devuelve la imagen redimensionada como Data URL
  };

   // Función para dividir la imagen en subimágenes
  const cropFields = (imageElement, coordinates) => {
  
    // funcion a realizar
    
  };

  // Función para procesar cada subimagen con OCR
  const processWithOCR = (fields) => {
    

    //funcion a realizar
  };

  const handleProcess = () => {
    if (selectedType) {
      alert(`Se va a procesar el documento como: ${selectedType}`);
    } else {
      alert("Por favor, seleccione un tipo de documento antes de procesar.");
    }

    if (selectedType === "DNI") {
      const imageElement = new Image();
      imageElement.src = croppedImage;
  
      imageElement.onload = () => {
        // Crear un canvas temporal para redimensionar la imagen
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = FIXED_WIDTH;
        tempCanvas.height = FIXED_HEIGHT;
  
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(imageElement, 0, 0, FIXED_WIDTH, FIXED_HEIGHT);
  
        // Convertir el canvas a una URL de imagen
        const resizedImage = tempCanvas.toDataURL('image/png');
  
        // Actualizar el estado para mostrar la nueva imagen redimensionada
        setProcessedImage(resizedImage);
  
        // Si deseas reemplazar la imagen visible con un canvas:
        const displayCanvas = document.createElement('canvas');
        displayCanvas.width = FIXED_WIDTH;
        displayCanvas.height = FIXED_HEIGHT;
        displayCanvas.className = 'result-image';
  
        const displayCtx = displayCanvas.getContext('2d');
        const tempImage = new Image();
        tempImage.src = resizedImage;
  
        tempImage.onload = () => {
          displayCtx.drawImage(tempImage, 0, 0, FIXED_WIDTH, FIXED_HEIGHT);
  
          // Reemplazar la imagen actual con el canvas en el DOM
          const resultContainer = document.querySelector('.result-content');
          const oldImage = resultContainer.querySelector('img.result-image');
          if (oldImage) {
            resultContainer.replaceChild(displayCanvas, oldImage);
          }
        };
      };
    } else {
      alert("Por favor, seleccione un tipo de documento antes de procesar.");
    }

  };

  useEffect(() => {
    if (croppedImage) {
      setProcessedImage(croppedImage);
      setIsProcessing(false);
    }
  }, [croppedImage]);
  
  /*
  useEffect(() => {
    const processImageWithOpenCV = async () => {
      console.group('🔄 Image Processing Flow')
      try {
        setIsProcessing(true)
        console.log('⏳ Loading OpenCV...')

        const displayCanvas = document.createElement('canvas')
        const img = new Image()

        img.onload = () => {
          console.log('📸 Image loaded:', {
            width: img.width,
            height: img.height,
            src: croppedImage.substring(0, 50) + '...'
          })

          displayCanvas.width = img.width
          displayCanvas.height = img.height
          const ctx = displayCanvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          console.log('🎨 Image drawn to canvas')

          try {
            console.log(
              '🔍 Starting OpenCV processing with settings:',
              settings
            )
            const processedMat = processImage(
              window.cv,
              displayCanvas,
              settings
            )
            console.log('✨ OpenCV processing complete')

            cv.imshow(displayCanvas, processedMat)
            console.log('🖼️ Processed image shown on canvas')

            const dataUrl = displayCanvas.toDataURL('image/png')
            console.log('💾 Canvas converted to data URL')
            setProcessedImage(dataUrl)

            processedMat.delete()
            console.log('🧹 OpenCV resources cleaned up')
          } catch (cvError) {
            console.error('❌ OpenCV processing error:', cvError)
            setProcessedImage(croppedImage)
          }

          setIsProcessing(false)
        }

        img.onerror = (error) => {
          console.error('❌ Error loading image:', error)
          setProcessedImage(croppedImage)
          setIsProcessing(false)
        }

        img.src = croppedImage
        console.log('🔄 Image source set, waiting for load...')
      } catch (error) {
        console.error('❌ Fatal error in processing:', error)
        setProcessedImage(croppedImage)
        setIsProcessing(false)
      }
      console.groupEnd()
    }

    if (croppedImage) {
      processImageWithOpenCV()
    }

    return () => {
      // Cleanup on unmount
      setProcessedImage(null)
    }
  }, [croppedImage, settings])

  */

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = processedImage || croppedImage
    link.download = 'docuscan-result.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="result-page">
      <div className="result-header">
        <button onClick={onBack} className="back-button">
          <MdArrowBack size={24} />
        </button>
        <h2>Resultado</h2>
        <button
          onClick={() => {
            const link = document.createElement("a");
            link.href = croppedImage;
            link.download = "resultado.png";
            link.click();
          }}
          className="download-button"
        >
          <MdFileDownload size={24} />
        </button>
      </div>
      <div className="result-content">
        <img
          src={croppedImage}
          alt="Resultado"
          className="result-image"
        />
        <div className="action-section">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="document-type-selector"
          >
            <option value="" disabled>Seleccione tipo de documento</option>
            <option value="DNI">DNI</option>
            <option value="Permiso de conducir">Permiso de conducir</option>
            <option value="Documento genérico">Documento genérico</option>
          </select>
          <button onClick={handleProcess} className="process-button">
            Procesar
          </button>
        </div>
      </div>
    </div>
  );
  
  /*
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
        {isProcessing ? (
          <div className="processing-indicator">{t('processingImage')}...</div>
        ) : processedImage ? (
          <img
            src={processedImage}
            alt={t('resultImage')}
            className="result-image"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        ) : (
          <div className="error-message">{t('errorProcessingImage')}</div>
        )}
      </div>
      <ImageSettings settings={settings} onSettingsChange={setSettings} />
    </div>
  )

  */
}

export default ResultPage
