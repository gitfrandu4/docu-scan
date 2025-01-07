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

    // Convert to grayscale and enhance initial contrast
    let gray = new cv.Mat()
    cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY)
    let enhanced = new cv.Mat()
    cv.convertScaleAbs(gray, enhanced, 1.2, 10)
    console.log('2️⃣ Initial contrast enhancement')

    // Apply bilateral filter to preserve edges while removing noise
    let denoised = new cv.Mat()
    cv.bilateralFilter(enhanced, denoised, 9, 75, 75)
    console.log('3️⃣ Applied bilateral filter')

    // Initial light threshold to help with edge detection
    let preThresh = new cv.Mat()
    cv.threshold(denoised, preThresh, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU)

    // Edge detection
    let edges = new cv.Mat()
    cv.Canny(preThresh, edges, 50, 150)

    // Connect edges
    let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3))
    let dilated = new cv.Mat()
    cv.dilate(edges, dilated, kernel)
    cv.morphologyEx(dilated, dilated, cv.MORPH_CLOSE, kernel)
    console.log('4️⃣ Enhanced edges')

    // Find contours
    let contours = new cv.MatVector()
    let hierarchy = new cv.Mat()
    cv.findContours(
      dilated,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE
    )

    // Find the largest contour and try to get corners
    let maxArea = 0
    let largestContour = null
    let documentCorners = null
    const imgArea = mat.cols * mat.rows

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i)
      const area = cv.contourArea(contour)

      if (area > maxArea && area > imgArea * settings.minAreaRatio) {
        maxArea = area
        largestContour = contour

        // Try to get corners
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

          const angleRange = calculateAngleRange(points)
          if (angleRange < settings.maxAngleRange) {
            documentCorners = approx
          } else {
            approx.delete()
          }
        } else {
          approx.delete()
        }
      }
    }

    let result = new cv.Mat()
    if (documentCorners || largestContour) {
      console.log('5️⃣ Found document contour')

      let points = []
      if (documentCorners) {
        // Use the found corners
        for (let i = 0; i < 4; i++) {
          points.push({
            x: documentCorners.data32S[i * 2],
            y: documentCorners.data32S[i * 2 + 1]
          })
        }
      } else {
        // Fallback to minimum area rectangle
        let rotatedRect = cv.minAreaRect(largestContour)
        let vertices = cv.boxPoints(rotatedRect)
        for (let i = 0; i < 4; i++) {
          points.push({
            x: vertices.data32F[i * 2],
            y: vertices.data32F[i * 2 + 1]
          })
        }
      }

      // Apply perspective transform
      const sortedPoints = sortPoints(points)
      result = fourPointTransform(cv, enhanced, sortedPoints)
      console.log('6️⃣ Applied perspective transform')

      // Enhanced text processing pipeline
      // 1. Apply Laplacian-based unsharp mask
      let lap = new cv.Mat()
      let sharp = new cv.Mat()
      cv.Laplacian(result, lap, cv.CV_8U, 3, 1, 0, cv.BORDER_DEFAULT)
      cv.subtract(result, lap, sharp)
      console.log('7️⃣ Applied unsharp mask')

      // 2. Enhance local contrast
      let localContrast = new cv.Mat()
      cv.convertScaleAbs(sharp, localContrast, 1.2, 10)

      // 3. Otsu's binarization
      let thresh = new cv.Mat()
      cv.threshold(
        localContrast,
        thresh,
        0,
        255,
        cv.THRESH_BINARY + cv.THRESH_OTSU
      )

      // 4. Morphological cleanup
      let cleanKernel = cv.getStructuringElement(
        cv.MORPH_RECT,
        new cv.Size(2, 2)
      )
      let cleaned = new cv.Mat()

      // Open to remove noise, then close to connect text
      cv.morphologyEx(thresh, cleaned, cv.MORPH_OPEN, cleanKernel)
      cv.morphologyEx(cleaned, cleaned, cv.MORPH_CLOSE, cleanKernel)

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
      lap.delete()
      sharp.delete()
      localContrast.delete()
      thresh.delete()
      cleaned.delete()
      cleanKernel.delete()
    } else {
      console.log('⚠️ No document found, processing full image')
      enhanced.copyTo(result)
    }

    // Cleanup
    mat.delete()
    gray.delete()
    enhanced.delete()
    denoised.delete()
    preThresh.delete()
    edges.delete()
    dilated.delete()
    kernel.delete()
    hierarchy.delete()
    if (documentCorners) documentCorners.delete()
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
