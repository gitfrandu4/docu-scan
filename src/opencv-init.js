window.Module = {
  onRuntimeInitialized: function () {
    console.log('OpenCV.js runtime ready')
    window.dispatchEvent(new Event('opencv-ready'))
  },
  setStatus: function (status) {
    console.log('OpenCV.js status:', status)
  },
  print: function (text) {
    console.log('OpenCV.js:', text)
  },
  printErr: function (text) {
    console.error('OpenCV.js error:', text)
    window.dispatchEvent(new Event('opencv-error'))
  }
}
