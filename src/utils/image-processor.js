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
 * Enhanced image processing with document scanning features
 */
export function processImage(cv, sourceCanvas, settings = {}) {
  try {
    console.group('🔧 OpenCV Processing Steps')

    let mat = cv.imread(sourceCanvas)
    console.log('1️⃣ Image loaded to Mat:', {
      width: mat.cols,
      height: mat.rows,
      channels: mat.channels(),
      type: mat.type()
    })

    const RESCALED_HEIGHT = 500.0
    const ratio = mat.rows / RESCALED_HEIGHT
    let resized = new cv.Mat()
    let dsize = new cv.Size(
      Math.round(mat.cols / ratio),
      Math.round(RESCALED_HEIGHT)
    )
    cv.resize(mat, resized, dsize, 0, 0, cv.INTER_AREA)
    console.log('2️⃣ Image resized:', {
      newWidth: resized.cols,
      newHeight: resized.rows,
      ratio: ratio
    })

    let gray = new cv.Mat()
    cv.cvtColor(resized, gray, cv.COLOR_RGBA2GRAY)
    console.log('3️⃣ Converted to grayscale')

    let blurred = new cv.Mat()
    cv.GaussianBlur(gray, blurred, new cv.Size(7, 7), 0)
    console.log('4️⃣ Applied Gaussian blur: 7x7 kernel')

    let kernel = cv.getStructuringElement(
      cv.MORPH_RECT,
      new cv.Size(settings.morphKernelSize, settings.morphKernelSize)
    )
    let dilated = new cv.Mat()
    cv.morphologyEx(blurred, dilated, cv.MORPH_CLOSE, kernel)
    console.log('5️⃣ Applied morphological closing:', {
      kernelSize: settings.morphKernelSize
    })

    let edges = new cv.Mat()
    cv.Canny(dilated, edges, settings.cannyLow, settings.cannyHigh)
    console.log('6️⃣ Detected edges:', {
      low: settings.cannyLow,
      high: settings.cannyHigh
    })

    let contours = new cv.MatVector()
    let hierarchy = new cv.Mat()
    cv.findContours(
      edges,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE
    )
    console.log('7️⃣ Found contours:', { count: contours.size() })

    // Sort contours by area
    let contourAreas = []
    for (let i = 0; i < Math.min(5, contours.size()); i++) {
      let cnt = contours.get(i)
      contourAreas.push({
        index: i,
        area: cv.contourArea(cnt)
      })
    }
    contourAreas.sort((a, b) => b.area - a.area)

    // Find best contour with validation
    let bestApprox = null
    for (let i = 0; i < contourAreas.length; i++) {
      let cnt = contours.get(contourAreas[i].index)
      let peri = cv.arcLength(cnt, true)
      let approx = new cv.Mat()
      cv.approxPolyDP(cnt, approx, 0.02 * peri, true)

      if (validateContour(approx, resized.cols, resized.rows, settings)) {
        bestApprox = approx
        console.log('8️⃣ Found valid document contour:', {
          points: approx.rows,
          perimeter: peri,
          area: cv.contourArea(approx)
        })
        break
      }
      approx.delete()
    }

    // Perspective transform and final processing
    let finalMat
    if (bestApprox) {
      console.log('9️⃣ Applying perspective transform')
      let points = []
      for (let i = 0; i < 4; i++) {
        points.push({
          x: bestApprox.data32S[i * 2] * ratio,
          y: bestApprox.data32S[i * 2 + 1] * ratio
        })
      }
      finalMat = fourPointTransform(cv, mat, sortPoints(points))
      bestApprox.delete()
    } else {
      console.log('⚠️ No valid contour found, using original image')
      finalMat = mat.clone()
    }

    // Enhanced final processing
    cv.cvtColor(finalMat, finalMat, cv.COLOR_RGBA2GRAY)
    let sharpened = sharpenImage(cv, finalMat, settings)

    let result = new cv.Mat()
    cv.adaptiveThreshold(
      sharpened,
      result,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      21,
      15
    )

    console.log('🏁 Processing complete')
    console.groupEnd()

    // Cleanup
    mat.delete()
    resized.delete()
    gray.delete()
    blurred.delete()
    kernel.delete()
    dilated.delete()
    edges.delete()
    hierarchy.delete()
    finalMat.delete()
    sharpened.delete()
    for (let i = 0; i < contours.size(); i++) {
      contours.get(i).delete()
    }
    contours.delete()

    return result
  } catch (error) {
    console.error('❌ Error in OpenCV processing:', error)
    console.groupEnd()
    throw error
  }
}
