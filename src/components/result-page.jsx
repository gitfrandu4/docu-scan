import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { MdArrowBack, MdFileDownload, MdAutoFixHigh } from 'react-icons/md'
import { processImage } from '../utils/image-processor'
import Tesseract from 'tesseract.js'
import cv from 'opencv.js'
import OcrResultsModal from './ocr-results-modal'

const fieldCoordinates = [
  { name: 'NumeroDNI', x: 702, y: 170, width: 492, height: 77 },
  { name: 'Apellidos', x: 629, y: 286, width: 441, height: 99 },
  { name: 'Nombre', x: 623, y: 428, width: 404, height: 47 },
  { name: 'sexo', x: 619, y: 520, width: 45, height: 49 },
  { name: 'Fecha de Nacimiento', x: 1248, y: 518, width: 286, height: 52 }
]

// Tamaño fijo al que se redimensionará el DNI
const FIXED_WIDTH = 1586
const FIXED_HEIGHT = 1000

const ResultPage = ({ croppedImage, onBack }) => {
  const { t } = useTranslation()
  const [processedImage, setProcessedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedType, setSelectedType] = useState('')
  const [isEnhanced, setIsEnhanced] = useState(false)
  const [enhanceError, setEnhanceError] = useState(null)
  const enhancedCanvasRef = useRef(null)

  // New state for OCR results modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [ocrResults, setOcrResults] = useState([])

  const [isOpenCVReady, setIsOpenCVReady] = useState(false)

  useEffect(() => {
    // Listen for OpenCV.js ready event
    const handleOpenCVReady = () => {
      console.log('✅ OpenCV.js is ready in ResultPage')
      setIsOpenCVReady(true)
    }

    // Check if OpenCV is already ready
    if (window.cv && typeof window.cv.imread === 'function') {
      handleOpenCVReady()
    } else {
      window.addEventListener('opencv-ready', handleOpenCVReady)
    }

    return () => {
      window.removeEventListener('opencv-ready', handleOpenCVReady)
    }
  }, [])

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

  // Updated OCR processing function
  const processWithOCR = async (canvas_imgToProcess, fields) => {
    const results = []

    for (const { name, x, y, width, height } of fields) {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = width
      canvas.height = height

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

      try {
        const {
          data: { text }
        } = await Tesseract.recognize(canvas, 'eng', {
          logger: (info) => console.log(info)
        })

        results.push({
          field: name,
          text: text.trim()
        })
      } catch (error) {
        console.error(`Error procesando OCR para el campo ${name}:`, error)
        results.push({
          field: name,
          text: 'Error en el procesamiento'
        })
      }
    }

    setOcrResults(results)
    setIsModalOpen(true)
  }

  // Process entire document with OCR
  const processFullDocument = async (canvas) => {
    try {
      setIsProcessing(true)
      const {
        data: { text }
      } = await Tesseract.recognize(canvas, 'eng', {
        logger: (info) => console.log(info)
      })

      setOcrResults([
        {
          field: 'Texto Completo',
          text: text.trim()
        }
      ])
      setIsModalOpen(true)
    } catch (error) {
      console.error('Error procesando OCR del documento:', error)
      setOcrResults([
        {
          field: 'Error',
          text: 'Error al procesar el documento'
        }
      ])
      setIsModalOpen(true)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProcess = () => {
    if (!selectedType) {
      alert(t('result.process.selectFirst'))
      return
    }

    const canvas =
      isEnhanced && enhancedCanvasRef.current
        ? enhancedCanvasRef.current
        : (() => {
            const tempCanvas = document.createElement('canvas')
            const img = new Image()
            img.src = processedImage || croppedImage

            if (selectedType === 'DNI') {
              tempCanvas.width = FIXED_WIDTH
              tempCanvas.height = FIXED_HEIGHT
            } else {
              tempCanvas.width = img.width
              tempCanvas.height = img.height
            }

            const ctx = tempCanvas.getContext('2d')
            ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height)
            return tempCanvas
          })()

    if (selectedType === 'DNI') {
      processWithOCR(canvas, fieldCoordinates)
    } else if (selectedType === 'Documento genérico') {
      processFullDocument(canvas)
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

  const handleEnhanceImage = async () => {
    if (!isOpenCVReady) {
      console.error('OpenCV is not ready yet')
      alert(t('errorProcessingImage'))
      return
    }

    setIsProcessing(true)
    setEnhanceError(null)

    try {
      const img = new Image()

      img.onload = async () => {
        try {
          // Calculate dimensions with a maximum size to prevent memory issues
          const MAX_DIMENSION = 1500
          let displayWidth, displayHeight
          const aspectRatio = img.width / img.height

          if (aspectRatio > 1) {
            displayWidth = Math.min(img.width, MAX_DIMENSION)
            displayHeight = displayWidth / aspectRatio
          } else {
            displayHeight = Math.min(img.height, MAX_DIMENSION)
            displayWidth = displayHeight * aspectRatio
          }

          // Create the canvas with the calculated dimensions
          const displayCanvas = document.createElement('canvas')
          displayCanvas.width = displayWidth
          displayCanvas.height = displayHeight

          const ctx = displayCanvas.getContext('2d', {
            willReadFrequently: true,
            alpha: false
          })
          ctx.drawImage(img, 0, 0, displayWidth, displayHeight)

          // Process the image with lower quality settings for mobile
          const isMobile = window.innerWidth <= 768
          const processedMat = processImage(window.cv, displayCanvas, {
            minAreaRatio: isMobile ? 0.15 : 0.25,
            maxAngleRange: isMobile ? 30 : 40,
            gaussianBlurSize: isMobile ? 3 : 5
          })

          // Store the enhanced canvas
          enhancedCanvasRef.current = document.createElement('canvas')
          enhancedCanvasRef.current.width = displayWidth
          enhancedCanvasRef.current.height = displayHeight

          // Use requestAnimationFrame to prevent UI blocking
          requestAnimationFrame(() => {
            try {
              cv.imshow(enhancedCanvasRef.current, processedMat)
              processedMat.delete()

              // Update the image display
              setProcessedImage(
                enhancedCanvasRef.current.toDataURL(
                  'image/png',
                  isMobile ? 0.8 : 1.0
                )
              )
              setIsEnhanced(true)
              setIsProcessing(false)
            } catch (error) {
              console.error('Error in final image processing:', error)
              setEnhanceError(t('errorProcessingImage'))
              setIsProcessing(false)
            }
          })
        } catch (error) {
          console.error('Error during enhancement:', error)
          setEnhanceError(t('errorProcessingImage'))
          setIsProcessing(false)
        }
      }

      img.onerror = () => {
        console.error('Error loading image')
        setEnhanceError(t('errorProcessingImage'))
        setIsProcessing(false)
      }

      img.src = processedImage || croppedImage
    } catch (error) {
      console.error('Error in enhancement process:', error)
      setEnhanceError(t('errorProcessingImage'))
      setIsProcessing(false)
    }
  }

  return (
    <div className="result-page">
      <div className="result-header">
        <button onClick={onBack} className="back-button">
          <MdArrowBack size={24} />
        </button>
        <h2>{t('result.title')}</h2>
        <button onClick={handleDownload} className="download-button">
          <MdFileDownload size={24} />
        </button>
      </div>
      <div className="result-content">
        <img
          src={processedImage || croppedImage}
          alt={t('result.title')}
          className="result-image"
        />
        <div className="action-section">
          <div className="controls-group">
            <button
              onClick={handleEnhanceImage}
              className={`enhance-button ${isEnhanced ? 'enhanced' : ''} ${
                isProcessing ? 'processing' : ''
              }`}
              disabled={isEnhanced || isProcessing}
              title={
                isEnhanced
                  ? t('result.enhanceImage.alreadyEnhanced')
                  : isProcessing
                  ? t('processingImage')
                  : t('result.enhanceImage.button')
              }
            >
              {isProcessing ? (
                <div className="spinner"></div>
              ) : (
                <MdAutoFixHigh size={20} />
              )}
            </button>
            {enhanceError && (
              <div className="error-message">{enhanceError}</div>
            )}
            <div className="separator-vertical" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="document-type-selector"
            >
              <option value="" disabled>
                {t('result.documentType.select')}
              </option>
              <option value="DNI">{t('result.documentType.dni')}</option>
              <option value="Documento genérico">
                {t('result.documentType.generic')}
              </option>
            </select>
            <button
              onClick={handleProcess}
              className="process-button"
              disabled={isProcessing}
            >
              {isProcessing
                ? t('result.process.processing')
                : t('result.process.button')}
            </button>
          </div>
        </div>
      </div>

      <OcrResultsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        results={ocrResults}
      />
    </div>
  )
}

export default ResultPage
