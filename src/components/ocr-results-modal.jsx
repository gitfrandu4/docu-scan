import React from 'react'
import { MdContentCopy, MdClose } from 'react-icons/md'

const OcrResultsModal = ({ isOpen, onClose, results }) => {
  if (!isOpen) return null

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        // Could add a toast notification here
        console.log('Texto copiado')
      },
      (err) => {
        console.error('Error al copiar:', err)
      }
    )
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Resultados OCR</h3>
          <button onClick={onClose} className="modal-close-button">
            <MdClose size={24} />
          </button>
        </div>
        <div className="modal-body">
          {results.map((result, index) => (
            <div key={index} className="ocr-result-item">
              <div className="ocr-field-name">{result.field}</div>
              <div className="ocr-result-content">
                <p>{result.text}</p>
                <button
                  onClick={() => handleCopy(result.text)}
                  className="copy-button"
                  title="Copiar texto"
                >
                  <MdContentCopy size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default OcrResultsModal
