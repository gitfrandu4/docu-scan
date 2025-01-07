/**
 * Ordena 4 puntos en orden: top-left, top-right, bottom-right, bottom-left.
 */
function sortPoints(pts) {
  pts.sort((a, b) => a.y - b.y)
  const top = pts.slice(0, 2).sort((a, b) => a.x - b.x)
  const bottom = pts.slice(2, 4).sort((a, b) => a.x - b.x)
  return [top[0], top[1], bottom[1], bottom[0]]
}

/**
 * Realiza la transformación de perspectiva dada una matriz (mat) y 4 puntos.
 */
function fourPointTransform(cv, mat, pts) {
  let [tl, tr, br, bl] = pts

  let widthA = Math.hypot(br.x - bl.x, br.y - bl.y)
  let widthB = Math.hypot(tr.x - tl.x, tr.y - tl.y)
  let maxWidth = Math.max(widthA, widthB)

  let heightA = Math.hypot(tr.x - br.x, tr.y - br.y)
  let heightB = Math.hypot(tl.x - bl.x, tl.y - bl.y)
  let maxHeight = Math.max(heightA, heightB)

  let srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [
    tl.x,
    tl.y,
    tr.x,
    tr.y,
    br.x,
    br.y,
    bl.x,
    bl.y
  ])

  let dstCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0,
    0,
    maxWidth - 1,
    0,
    maxWidth - 1,
    maxHeight - 1,
    0,
    maxHeight - 1
  ])

  let M = cv.getPerspectiveTransform(srcCoords, dstCoords)
  let dsize = new cv.Size(maxWidth, maxHeight)
  let warped = new cv.Mat()
  cv.warpPerspective(
    mat,
    warped,
    M,
    dsize,
    cv.INTER_LINEAR,
    cv.BORDER_CONSTANT,
    new cv.Scalar()
  )

  srcCoords.delete()
  dstCoords.delete()
  M.delete()

  return warped
}

/**
 * Calculates angle between three points with p2 as vertex
 */
function calculateAngle(p1, p2, p3) {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y }
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y }

  const dot = v1.x * v2.x + v1.y * v2.y
  const mag1 = Math.hypot(v1.x, v1.y)
  const mag2 = Math.hypot(v2.x, v2.y)

  if (mag1 === 0 || mag2 === 0) return 0

  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)))
  return (Math.acos(cos) * 180.0) / Math.PI
}

/**
 * Validates contour angles and area
 */
function validateContour(approx, imgWidth, imgHeight, settings) {
  if (approx.rows !== 4) return false

  const imgArea = imgWidth * imgHeight
  const area = cv.contourArea(approx)
  if (area < imgArea * settings.minAreaRatio) return false

  const points = []
  for (let i = 0; i < 4; i++) {
    points.push({
      x: approx.data32S[i * 2],
      y: approx.data32S[i * 2 + 1]
    })
  }

  const [tl, tr, br, bl] = sortPoints(points)
  const angles = [
    calculateAngle(tl, tr, br),
    calculateAngle(tr, br, bl),
    calculateAngle(br, bl, tl),
    calculateAngle(bl, tl, tr)
  ]

  const angleRange = Math.max(...angles) - Math.min(...angles)
  return angleRange <= settings.maxAngleRange
}

/**
 * Mejora la nitidez de una imagen en escala de grises
 */
function sharpenImage(cv, grayMat, settings) {
  let blurred = new cv.Mat()
  cv.GaussianBlur(
    grayMat,
    blurred,
    new cv.Size(settings.gaussianBlurSize, settings.gaussianBlurSize),
    0
  )

  let sharpened = new cv.Mat()
  cv.addWeighted(grayMat, settings.sharpenWeight, blurred, -0.5, 0, sharpened)

  blurred.delete()
  return sharpened
}

/**
 * Enhanced image processing with document scanning features (Less Aggressive Version)
 */
export function processImage(cv, sourceCanvas, settings = {}) {
  try {
    console.group('🔧 OpenCV Processing Steps')

    // Load image
    let mat = cv.imread(sourceCanvas)
    console.log('1️⃣ Image loaded')

    // Convert to grayscale and enhance contrast
    let gray = new cv.Mat()
    cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY)

    // Enhance contrast using CLAHE (Contrast Limited Adaptive Histogram Equalization)
    let clahe = new cv.Mat()
    let equalizedGray = new cv.Mat()
    cv.convertScaleAbs(gray, clahe, 1.5, 0) // Increase contrast
    cv.equalizeHist(clahe, equalizedGray) // Equalize histogram
    console.log('2️⃣ Enhanced contrast')

    // Apply bilateral filter to preserve edges while removing noise
    let bilateral = new cv.Mat()
    cv.bilateralFilter(equalizedGray, bilateral, 9, 75, 75)
    console.log('3️⃣ Applied bilateral filter')

    // Morphological operations to clean up the image
    let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(9, 9))
    let dilated = new cv.Mat()
    cv.morphologyEx(bilateral, dilated, cv.MORPH_CLOSE, kernel)
    console.log('4️⃣ Applied morphological operations')

    // Edge detection with careful thresholds
    let edges = new cv.Mat()
    cv.Canny(dilated, edges, 0, 84)
    console.log('5️⃣ Detected edges')

    // Find contours and detect document
    let contours = new cv.MatVector()
    let hierarchy = new cv.Mat()
    cv.findContours(
      edges,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE
    )

    // Find the document contour
    let documentContour = null
    let maxArea = 0
    const imgArea = mat.cols * mat.rows

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i)
      const area = cv.contourArea(contour)

      if (area > maxArea && area > imgArea * settings.minAreaRatio) {
        const perimeter = cv.arcLength(contour, true)
        const approx = new cv.Mat()
        cv.approxPolyDP(contour, approx, 0.02 * perimeter, true)

        if (approx.rows === 4) {
          const points = []
          for (let j = 0; j < 4; j++) {
            points.push({
              x: approx.data32S[j * 2],
              y: approx.data32S[j * 2 + 1]
            })
          }

          const sortedPoints = sortPoints(points)
          const angleRange = calculateAngleRange(sortedPoints)

          if (angleRange < settings.maxAngleRange) {
            maxArea = area
            documentContour = approx
          } else {
            approx.delete()
          }
        } else {
          approx.delete()
        }
      }
    }

    let result = new cv.Mat()
    if (documentContour) {
      console.log('6️⃣ Found document contour')

      // Get corners and apply perspective transform
      const points = []
      for (let i = 0; i < 4; i++) {
        points.push({
          x: documentContour.data32S[i * 2],
          y: documentContour.data32S[i * 2 + 1]
        })
      }
      const sortedPoints = sortPoints(points)
      result = fourPointTransform(cv, equalizedGray, sortedPoints)
      console.log('7️⃣ Applied perspective transform')

      // Enhanced post-processing pipeline for text clarity
      // 1. Apply unsharp masking for sharper text
      let blurred = new cv.Mat()
      let sharpened = new cv.Mat()
      cv.GaussianBlur(result, blurred, new cv.Size(0, 0), 3)
      cv.addWeighted(result, 2.0, blurred, -0.5, 0, sharpened)

      // 2. Enhance local contrast
      let localContrast = new cv.Mat()
      cv.convertScaleAbs(sharpened, localContrast, 1.3, 15)

      // 3. Apply Otsu's thresholding for better binarization
      let thresh = new cv.Mat()
      cv.threshold(
        localContrast,
        thresh,
        0,
        255,
        cv.THRESH_BINARY + cv.THRESH_OTSU
      )

      // 4. Clean up noise and enhance text
      let cleanKernel = cv.getStructuringElement(
        cv.MORPH_RECT,
        new cv.Size(2, 2)
      )
      let cleaned = new cv.Mat()
      cv.morphologyEx(thresh, cleaned, cv.MORPH_CLOSE, cleanKernel)

      // 5. Final adaptive threshold for consistent text
      cv.adaptiveThreshold(
        cleaned,
        result,
        255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv.THRESH_BINARY,
        21,
        10
      )
      console.log('8️⃣ Enhanced text clarity')

      // Cleanup
      blurred.delete()
      sharpened.delete()
      localContrast.delete()
      thresh.delete()
      cleaned.delete()
      cleanKernel.delete()
    } else {
      console.log('⚠️ No document found, processing full image')
      equalizedGray.copyTo(result)
    }

    // Cleanup
    mat.delete()
    gray.delete()
    clahe.delete()
    equalizedGray.delete()
    bilateral.delete()
    dilated.delete()
    edges.delete()
    kernel.delete()
    hierarchy.delete()
    if (documentContour) documentContour.delete()
    for (let i = 0; i < contours.size(); i++) {
      contours.get(i).delete()
    }
    contours.delete()

    console.log('✅ Processing complete')
    console.groupEnd()
    return result
  } catch (error) {
    console.error('❌ Error in OpenCV processing:', error)
    console.groupEnd()
    throw error
  }
}

function calculateAngleRange(points) {
  // Calculate angles between vectors
  function getAngle(p1, p2, p3) {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y }
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y }

    const dot = v1.x * v2.x + v1.y * v2.y
    const mag1 = Math.hypot(v1.x, v1.y)
    const mag2 = Math.hypot(v2.x, v2.y)

    const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)))
    return Math.acos(cos) * (180 / Math.PI)
  }

  const [tl, tr, br, bl] = points
  const angles = [
    getAngle(bl, tl, tr), // top-left angle
    getAngle(tl, tr, br), // top-right angle
    getAngle(tr, br, bl), // bottom-right angle
    getAngle(br, bl, tl) // bottom-left angle
  ]

  return Math.max(...angles) - Math.min(...angles)
}
