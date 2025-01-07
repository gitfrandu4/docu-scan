/**
 * Class to handle webcam
 */
export class Webcam {
  /**
   * Open webcam and stream it through video tag.
   * @param {HTMLVideoElement} videoRef video tag reference
   */
  open = (videoRef) => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            facingMode: "environment",
            width: { ideal: 9999 }, // Resolución ideal en píxeles (4K)
            height: { ideal: 9999 },
          },
        })
        .then((stream) => {
          videoRef.srcObject = stream;
        });
    } else alert("Can't open Webcam!");
  };

  /**
   * Close opened webcam.
   * @param {HTMLVideoElement} videoRef video tag reference
   */
  close = (videoRef) => {
    if (videoRef.srcObject) {
      videoRef.srcObject.getTracks().forEach((track) => {
        track.stop();
      });
      videoRef.srcObject = null;
    }
  };
}