import * as tf from "@tensorflow/tfjs";
import { renderBoxes } from "./renderBox";
import labels from "./labels.json";

const numClass = labels.length;

/**
 * Preprocess image / frame before forwarded into the model
 * @param {HTMLVideoElement|HTMLImageElement} source
 * @param {Number} modelWidth
 * @param {Number} modelHeight
 * @returns input tensor, xRatio and yRatio
 */
const preprocess = (source, modelWidth, modelHeight) => {
  let xRatio, yRatio; // ratios for boxes
  console.log('🖼️ Source dimensions:', {
    width: source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth,
    height: source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight,
    type: source instanceof HTMLVideoElement ? 'video' : 'image'
  });

  const input = tf.tidy(() => {
    const img = tf.browser.fromPixels(source);
    console.log('📊 Original tensor shape:', img.shape);

    // padding image to square => [n, m] to [n, n], n > m
    const [h, w] = img.shape.slice(0, 2); // get source width and height
    const maxSize = Math.max(w, h); // get max size
    console.log('📐 Padding dimensions:', {
      originalWidth: w,
      originalHeight: h,
      maxSize,
      paddingRight: maxSize - w,
      paddingBottom: maxSize - h
    });

    const imgPadded = img.pad([
      [0, maxSize - h], // padding y [bottom only]
      [0, maxSize - w], // padding x [right only]
      [0, 0],
    ]);

    xRatio = maxSize / w; // update xRatio
    yRatio = maxSize / h; // update yRatio
    console.log('📏 Scale ratios:', { xRatio, yRatio });

    const processedInput = tf.image
      .resizeBilinear(imgPadded, [modelWidth, modelHeight]) // resize frame
      .div(255.0) // normalize
      .expandDims(0); // add batch
    
    console.log('🔄 Final input shape:', processedInput.shape);
    return processedInput;
  });

  return [input, xRatio, yRatio];
};

/**
 * Function run inference and do detection from source.
 * @param {HTMLImageElement|HTMLVideoElement} source
 * @param {tf.GraphModel} model loaded YOLOv11 tensorflow.js model
 * @param {HTMLCanvasElement} canvasRef canvas reference
 * @param {Function} onDetection callback function to handle detection results
 * @param {VoidFunction} callback function to run after detection process
 */
export const detect = async (source, model, canvasRef, onDetection = null, callback = () => {}) => {
  console.group('🔍 Detection Process');
  const [modelWidth, modelHeight] = model.inputShape.slice(1, 3);
  console.log('📐 Model dimensions:', { modelWidth, modelHeight });

  tf.engine().startScope();
  console.log('🎯 Starting preprocessing...');
  const [input, xRatio, yRatio] = preprocess(source, modelWidth, modelHeight);

  if (!model.net) {
    console.error('❌ Model is not loaded');
    console.groupEnd();
    return;
  }

  console.log('🤖 Running inference...');
  const res = model.net?.execute(input);
  const transRes = res.transpose([0, 2, 1]);

  console.log('📦 Processing boxes...');
  const boxes = tf.tidy(() => {
    const w = transRes.slice([0, 0, 2], [-1, -1, 1]);
    const h = transRes.slice([0, 0, 3], [-1, -1, 1]);
    const x1 = tf.sub(transRes.slice([0, 0, 0], [-1, -1, 1]), tf.div(w, 2));
    const y1 = tf.sub(transRes.slice([0, 0, 1], [-1, -1, 1]), tf.div(h, 2));
    return tf.concat([y1, x1, tf.add(y1, h), tf.add(x1, w)], 2).squeeze();
  });

  console.log('📊 Processing scores...');
  const [scores, classes] = tf.tidy(() => {
    const rawScores = transRes.slice([0, 0, 4], [-1, -1, numClass]).squeeze(0);
    return [rawScores.max(1), rawScores.argMax(1)];
  });

  console.log('🎯 Running NMS...');
  const nms = await tf.image.nonMaxSuppressionAsync(boxes, scores, 500, 0.45, 0.2);

  const boxes_data = boxes.gather(nms, 0).dataSync();
  const scores_data = scores.gather(nms, 0).dataSync();
  const classes_data = classes.gather(nms, 0).dataSync();

  console.log('📊 Detection Results:', {
    detectionCount: scores_data.length,
    boxes: Array.from(boxes_data),
    scores: Array.from(scores_data),
    classes: Array.from(classes_data).map(idx => labels[idx])
  });

  const tensorsToDispose = [res, transRes, boxes, scores, classes, nms, input];

  renderBoxes(canvasRef, boxes_data, scores_data, classes_data, [xRatio, yRatio]);
  
  if (onDetection) {
    console.log('🎯 Calling detection callback with:', {
      boxesCount: boxes_data.length,
      ratios: [xRatio, yRatio],
      modelDimensions: [modelWidth, modelHeight]
    });
    onDetection(boxes_data, [xRatio, yRatio], modelWidth, modelHeight);
  }

  tf.dispose(tensorsToDispose);
  callback();
  tf.engine().endScope();
  console.groupEnd();
};

/**
 * Function to detect video from every source.
 * @param {HTMLVideoElement} vidSource video source
 * @param {tf.GraphModel} model loaded YOLOv11 tensorflow.js model
 * @param {HTMLCanvasElement} canvasRef canvas reference
 * @param {Function} onDetection callback function to handle detection results
 */
export const detectVideo = (vidSource, model, canvasRef, onDetection = null) => {
  /**
   * Function to detect every frame from video
   */
  const detectFrame = async () => {
    if (vidSource.videoWidth === 0 && vidSource.srcObject === null) {
      const ctx = canvasRef.getContext("2d");
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // clean canvas
      return; // handle if source is closed
    }

    detect(vidSource, model, canvasRef, onDetection, () => {
      requestAnimationFrame(detectFrame); // get another frame
    });
  };

  detectFrame(); // initialize to detect every frame
};
