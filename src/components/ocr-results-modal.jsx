import React from 'react'
import { MdContentCopy, MdClose } from 'react-icons/md'
import { useTranslation } from 'react-i18next'

const OcrResultsModal = ({ isOpen, onClose, results }) => {
  const { t } = useTranslation()
  if (!isOpen) return null

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        console.log(t('ocr.copySuccess'))
      },
      (err) => {
        console.error(t('ocr.copyError'), err)
      }
    )
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{t('ocr.title')}</h3>
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
                  title={t('ocr.copyButton')}
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
