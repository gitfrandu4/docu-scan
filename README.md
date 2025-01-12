# Aplicación Web de Escaneo de Documentos con Técnicas de Visión por Computador

Proyecto final para la asignatura de Visión por Computador de la Universidad de Las Palmas de Gran Canaria (ULPGC) en el Grado de Ingeniería Informática.

## Descripción del Proyecto

Este proyecto aborda la necesidad de mejorar la calidad de las fotografías de documentos tomadas por conductores de una empresa de transporte. Implementa una aplicación web que escanea documentos utilizando diversas tecnologías de visión por computador estudiadas durante el curso.

## Características Técnicas

### 1. Mejora de Documentos con OpenCV.js

- Implementación de técnicas avanzadas de procesamiento de imágenes usando OpenCV.js:

  ```javascript
  // Ejemplo de transformación de perspectiva
  function fourPointTransform(cv, mat, pts) {
    let [tl, tr, br, bl] = pts
    let M = cv.getPerspectiveTransform(srcCoords, dstCoords)
    let warped = new cv.Mat()
    cv.warpPerspective(mat, warped, M, dsize, cv.INTER_LINEAR)
    return warped
  }

  // Ejemplo de mejora de nitidez
  function sharpenImage(cv, grayMat) {
    let blurred = new cv.Mat()
    cv.GaussianBlur(grayMat, blurred, new cv.Size(3, 3), 0)
    let sharpened = new cv.Mat()
    cv.addWeighted(grayMat, 1.5, blurred, -0.5, 0, sharpened)
    return sharpened
  }
  ```

### 2. Detección de Documentos con YOLOv11 y TensorFlow.js

- Detección en tiempo real usando modelo YOLOv11
- Inferencia en navegador usando TensorFlow.js con backend WebGL
- Pipeline de preprocesamiento personalizado:

  ```javascript
  // Ejemplo de preprocesamiento para YOLO
  const preprocess = (source, modelWidth, modelHeight) => {
    const input = tf.tidy(() => {
      const img = tf.browser.fromPixels(source)
      // Normalización y redimensionamiento
      return tf.image
        .resizeBilinear(img, [modelWidth, modelHeight])
        .div(255.0)
        .expandDims(0)
    })
    return input
  }

  // Ejemplo de post-procesamiento NMS
  const nms = await tf.image.nonMaxSuppressionAsync(
    boxes,
    scores,
    500, // maxOutputSize
    0.45, // iouThreshold
    0.25 // scoreThreshold
  )
  ```

### 3. Extracción de Texto con Tesseract.js

- Implementación de OCR usando Tesseract.js
- Reconocimiento de campos específicos del DNI:

  ```javascript
  // Ejemplo de extracción de campos específicos
  const fieldCoordinates = [
    { name: 'DNI', x: 704, y: 181, width: 475, height: 73 },
    { name: 'APELLIDOS', x: 634, y: 297, width: 541, height: 97 }
  ]

  // Procesamiento OCR por regiones
  const processWithOCR = async (canvas, fields) => {
    for (const { name, x, y, width, height } of fields) {
      const region = canvas.getContext('2d').getImageData(x, y, width, height)
      const {
        data: { text }
      } = await Tesseract.recognize(region, 'spa', {
        logger: (m) => console.log(m)
      })
    }
  }
  ```

## Detalles de Implementación Técnica

### Pipeline de Procesamiento de Imágenes

```javascript
// Pasos clave del procesamiento
1. Mejora inicial de contraste
   cv.convertScaleAbs(gray, enhanced, 1.2, 10)

2. Filtrado bilateral para reducción de ruido
   cv.bilateralFilter(enhanced, denoised, 9, 75, 75)

3. Detección de bordes con Canny
   cv.Canny(preThresh, edges, 50, 150)

4. Detección y validación de contornos
   cv.findContours(dilated, contours, hierarchy,
                   cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

5. Transformación de perspectiva
   cv.warpPerspective(mat, warped, M, dsize)

6. Mejora de texto con umbralización adaptativa
   cv.adaptiveThreshold(cleaned, result, 255,
                       cv.ADAPTIVE_THRESH_GAUSSIAN_C,
                       cv.THRESH_BINARY, 21, 10)
```

## Instalación y Configuración

1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/tu-repositorio.git
cd tu-repositorio
```

2. Instalar dependencias

```bash
yarn install
```

3. Iniciar servidor de desarrollo

```bash
yarn start
```

4. Compilar para producción

```bash
yarn build
```

## Detalles del Modelo

El proyecto utiliza un modelo YOLOv11n convertido a formato TensorFlow.js:

- Formato: Capas TensorFlow.js
- Backend: WebGL para rendimiento óptimo

## Créditos

Este proyecto parte de [yolov8-tfjs](https://github.com/Hyuto/yolov8-tfjs) de Hyuto, que proporcionó la implementación de inferencia con TensorFlow.js. El repositorio original ha sido extendido con técnicas adicionales de visión por computador y capacidades de procesamiento de documentos.

## Mejoras Futuras

- Optimización de técnicas de preprocesamiento para reducción de ruido
- Ampliación del dataset para mejorar la precisión del modelo YOLO
- Integración de almacenamiento en la nube para documentos escaneados
- Soporte para tipos adicionales de documentos
- Interfaz optimizada para móviles

## Referencias

- [Ultralytics YOLOv11](https://github.com/ultralytics/ultralytics)
- [Documentación OpenCV.js](https://docs.opencv.org/4.x/d5/d10/tutorial_js_root.html)
- [Tesseract.js](https://github.com/naptha/tesseract.js)
- [TensorFlow.js](https://www.tensorflow.org/js)
