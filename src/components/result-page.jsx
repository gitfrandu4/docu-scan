import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { MdArrowBack, MdFileDownload } from 'react-icons/md'
import { processImage } from '../utils/image-processor'
import ImageSettings, { defaultSettings } from './image-settings'
import Tesseract from 'tesseract.js';
import cv from 'opencv.js';

const fieldCoordinates = [
  { name: 'DNI', x: 704, y: 181, width: 475, height: 73 },
  { name: 'APELLIDOS', x: 634, y: 297, width: 541, height: 97 },
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
  const processWithOCR = (canvas_imgToProcess, fields) => {
  
    fields.forEach(({ name, x, y, width, height }) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        // Configura el canvas para el tamaño del campo
        canvas.width = width;
        canvas.height = height;
    
        // Dibuja el trozo de la imagen en el canvas
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(canvas_imgToProcess, x, y, width, height, 0, 0, width, height);
    
        // Pasa el canvas al OCR
        Tesseract.recognize(canvas, "eng", {
          logger: (info) => console.log(info),
        })
          .then(({ data: { text } }) => {
            alert(`Campo: ${name}\nResultado OCR: ${text}`);
          })
          .catch((error) => {
            console.error(`Error procesando OCR para el campo ${name}:`, error);
            alert(`Error en OCR para el campo ${name}.`);
          });
      });
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
      
          //Procesamos con el ocr
          processWithOCR(tempCanvas, fieldCoordinates);
      
      
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
}

export default ResultPage
