import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { MdArrowBack, MdFileDownload, MdAutoFixHigh } from 'react-icons/md'
import { processImage } from '../utils/image-processor'
import ImageSettings, { defaultSettings } from './image-settings'
import Tesseract from 'tesseract.js'
import cv from 'opencv.js'

const fieldCoordinates = [
  { name: 'DNI', x: 704, y: 181, width: 475, height: 73 },
  { name: 'APELLIDOS', x: 634, y: 297, width: 541, height: 97 }
]

// Tamaño fijo al que se redimensionará el DNI
const FIXED_WIDTH = 1586
const FIXED_HEIGHT = 1000

const ResultPage = ({ croppedImage, onBack }) => {
  const { t } = useTranslation()
  const [processedImage, setProcessedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const [settings, setSettings] = useState(defaultSettings)

  const [selectedType, setSelectedType] = useState('')
  const [isEnhanced, setIsEnhanced] = useState(false)
  const enhancedCanvasRef = useRef(null);

  // Función para redimensionar la imagen
  const resizeImage = (imageElement, targetWidth, targetHeight) => {
    // Crear un canvas temporal para realizar la redimensión
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = targetWidth
    tempCanvas.height = targetHeight

    const ctx = tempCanvas.getContext('2d')
    ctx.drawImage(imageElement, 0, 0, targetWidth, targetHeight)

    return tempCanvas.toDataURL('image/png') // Devuelve la imagen redimensionada como Data URL
  }

  // Función para dividir la imagen en subimágenes
  const cropFields = (imageElement, coordinates) => {
    // funcion a realizar
  }

  // Función para procesar cada subimagen con OCR
  const processWithOCR = (canvas_imgToProcess, fields) => {
    fields.forEach(({ name, x, y, width, height }) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      // Configura el canvas para el tamaño del campo
      canvas.width = width
      canvas.height = height

      // Dibuja el trozo de la imagen en el canvas
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(
        canvas_imgToProcess,
        x,
        y,
        width,
        height,
        0,
        0,
        width,
        height
      )

      // Pasa el canvas al OCR
      Tesseract.recognize(canvas, 'eng', {
        logger: (info) => console.log(info)
      })
        .then(({ data: { text } }) => {
          alert(`Campo: ${name}\nResultado OCR: ${text}`)
        })
        .catch((error) => {
          console.error(`Error procesando OCR para el campo ${name}:`, error)
          alert(`Error en OCR para el campo ${name}.`)
        })
    })
  }

  const handleProcess = () => {
    if (!selectedType) {
      alert('Por favor, seleccione un tipo de documento antes de procesar.')
      return
    }

    if (selectedType === 'DNI') {
      if (isEnhanced && enhancedCanvasRef.current) {
        // Use the stored enhanced canvas directly for OCR
        processWithOCR(enhancedCanvasRef.current, fieldCoordinates)
        
        // Ensure the enhanced image stays displayed
        const resultContainer = document.querySelector('.result-content')
        const oldImage = resultContainer.querySelector('img.result-image')
        if (oldImage) {
          oldImage.src = enhancedCanvasRef.current.toDataURL('image/png')
        }
      } else {
        // Process the original image if not enhanced
        const imageElement = new Image()
        imageElement.src = processedImage || croppedImage

        imageElement.onload = () => {
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = FIXED_WIDTH
          tempCanvas.height = FIXED_HEIGHT
          const ctx = tempCanvas.getContext('2d')
          ctx.drawImage(imageElement, 0, 0, FIXED_WIDTH, FIXED_HEIGHT)
          processWithOCR(tempCanvas, fieldCoordinates)
        }
      }
    }
  }

  useEffect(() => {
    if (croppedImage) {
      setProcessedImage(croppedImage)
      setIsProcessing(false)
    }
  }, [croppedImage])

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = processedImage || croppedImage
    link.download = 'docuscan-result.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleEnhanceImage = () => {
    try {
      const displayCanvas = document.createElement('canvas')
      const img = new Image()
      img.onload = () => {
        displayCanvas.width = FIXED_WIDTH
        displayCanvas.height = FIXED_HEIGHT
        const ctx = displayCanvas.getContext('2d')
        ctx.drawImage(img, 0, 0, FIXED_WIDTH, FIXED_HEIGHT)

        const processedMat = processImage(window.cv, displayCanvas, {
          morphKernelSize: 3,
          cannyLow: 30,
          cannyHigh: 80,
          gaussianBlurSize: 3,
          sharpenWeight: 1.0,
          useAdaptiveThreshold: false,
          adaptiveBlockSize: 9,
          adaptiveC: 4,
          minAreaRatio: 0.1,
          maxAngleRange: 40
        })

        // Store the enhanced canvas for later use
        enhancedCanvasRef.current = document.createElement('canvas')
        enhancedCanvasRef.current.width = FIXED_WIDTH
        enhancedCanvasRef.current.height = FIXED_HEIGHT
        cv.imshow(enhancedCanvasRef.current, processedMat)
        processedMat.delete()

        // Update the image display
        setProcessedImage(enhancedCanvasRef.current.toDataURL('image/png'))
        setIsEnhanced(true)
      }
      img.src = processedImage || croppedImage
    } catch (error) {
      console.error('Error enhancing image:', error)
      alert('Error al mejorar la imagen. Por favor, inténtelo de nuevo.')
    }
  }

  return (
    <div className="result-page">
      <div className="result-header">
        <button onClick={onBack} className="back-button">
          <MdArrowBack size={24} />
        </button>
        <h2>Resultado</h2>
        <button onClick={handleDownload} className="download-button">
          <MdFileDownload size={24} />
        </button>
      </div>
      <div className="result-content">
        <img
          src={processedImage || croppedImage}
          alt="Resultado"
          className="result-image"
        />
        <div className="action-section">
          <div className="controls-group">
            <button
              onClick={handleEnhanceImage}
              className={`enhance-button ${isEnhanced ? 'enhanced' : ''}`}
              disabled={isEnhanced}
              title={
                isEnhanced ? 'Imagen ya mejorada' : 'Mejorar imagen con IA'
              }
            >
              <MdAutoFixHigh size={20} />
            </button>
            <div className="separator-vertical" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="document-type-selector"
            >
              <option value="" disabled>
                Seleccione tipo de documento
              </option>
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
    </div>
  )
}

export default ResultPage
