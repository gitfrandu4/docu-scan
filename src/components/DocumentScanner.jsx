import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import cv from '@techstark/opencv-js';
import Tesseract from 'tesseract.js';
import { useTranslation } from 'react-i18next';
import { Camera, StopCircle, Camera as CameraIcon, ScanLine } from 'lucide-react';
import { Button } from './ui/button';
import { detect, detectVideo } from '../utils/detect';

const DocumentScanner = ({ model, onDocumentDetected }) => {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: isMobile ? 'environment' : 'user',
            width: { ideal: isMobile ? 1080 : 1920 },
            height: { ideal: isMobile ? 1920 : 1080 }
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);

          videoRef.current.onloadedmetadata = () => {
            const width = videoRef.current.videoWidth;
            const height = videoRef.current.videoHeight;
            setDimensions({ width, height });
            
            if (canvasRef.current) {
              canvasRef.current.width = width;
              canvasRef.current.height = height;
            }
          };
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasPermission(false);
      }
    };

    setupCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [isMobile]);

  useEffect(() => {
    const handleResize = () => {
      if (videoRef.current) {
        const aspectRatio = videoRef.current.videoHeight / videoRef.current.videoWidth;
        const width = Math.min(window.innerWidth, 1200);
        setDimensions({
          width: width,
          height: width * aspectRatio
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startScanning = () => {
    setIsScanning(true);
    if (videoRef.current) {
      videoRef.current.play();
      detectVideo(videoRef.current, model, canvasRef.current);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const captureDocument = async () => {
    if (!canvasRef.current) return;
    
    const imageData = canvasRef.current.toDataURL('image/jpeg');
    const { data: { text } } = await Tesseract.recognize(
      imageData,
      'eng',
      { logger: m => console.log(m) }
    );

    onDocumentDetected({ image: imageData, text });
  };

  return (
    <div className="w-full max-w-screen-lg mx-auto px-4">
      <div className="relative aspect-[9/16] md:aspect-video w-full bg-black rounded-lg overflow-hidden shadow-lg">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        
        {/* Scanning overlay */}
        {isScanning && (
          <div className="absolute inset-0 border-2 border-white/20 rounded-lg">
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-blue-500/50 animate-scan" />
          </div>
        )}
      </div>

      <div className="fixed bottom-8 inset-x-0 flex justify-center gap-4 px-4">
        {!hasPermission ? (
          <p className="text-center text-white bg-red-500/90 p-4 rounded-lg">
            {t('documentScanner.cameraPermission')}
          </p>
        ) : (
          <div className="flex gap-4">
            <Button
              size="lg"
              variant={isScanning ? "destructive" : "default"}
              className="rounded-full shadow-lg"
              onClick={isScanning ? stopScanning : startScanning}
            >
              {isScanning ? (
                <>
                  <StopCircle className="w-5 h-5 mr-2" />
                  {t('documentScanner.stopScanning')}
                </>
              ) : (
                <>
                  <CameraIcon className="w-5 h-5 mr-2" />
                  {t('documentScanner.startScanning')}
                </>
              )}
            </Button>
            
            {isScanning && (
              <Button
                size="lg"
                variant="secondary"
                className="rounded-full shadow-lg"
                onClick={captureDocument}
              >
                <ScanLine className="w-5 h-5 mr-2" />
                {t('documentScanner.captureDocument')}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentScanner; 
