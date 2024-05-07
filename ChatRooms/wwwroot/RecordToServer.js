class VideoRecord {
  constructor(stream, dotNet) {

    this.stream = stream;
    this.dotNet = dotNet;
    this.recorder = null;
    this.recorder = new MediaRecorder(stream, {
      //audioBitsPerSecond: 128000,
      //videoBitsPerSecond: 2500000,
      //mimeType: 'video/mp4; codecs="avc1.64001E"'
      mimeType: 'video/webm; codecs="vp9,opus"'
      //mimeType: 'video/webm;codecs=h264'
    });
    this.recorder.ondataavailable = (e) => {
      try {
        //console.log("send data", e);
        this.sendToserver(e.data, this.dotNet);
      }
      catch (e) {
        this.stop();
        console.log(e);
      }
    };
  }
  sendToserver(blobData, dotNet) {
    var fileReader = new FileReader();
    fileReader.onload = async function (event) {

      // await dotNet.invokeMethodAsync("StreamToFile", new Uint8Array(event.target.result));

      let array = [...new Uint8Array(event.target.result)];
      console.log("Second length", array.length);
      while (array.length > 0) {
        let chunk = array.splice(0, 32000);
        await dotNet.invokeMethodAsync("StreamToFile", new Uint8Array(chunk));
      }
    };
    fileReader.readAsArrayBuffer(blobData);
  }
  start() {
    console.log(this.recorder.mimeType);
    this.recorder.start(500);
  }
  stop() {
    this.recorder.stop();
    return new Promise(() => {
      this.recorder.onstop = async () => {
        await this.dotNet.invokeMethodAsync("StopStreamToFile");
      };
    });
  }
}