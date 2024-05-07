class CreateReadableStream {
  constructor(stream, dotNet) {
    this.stream = stream;
    this.config = {
      codec: "vp09.00.10.08",
      width: 1280,
      height: 720,
      bitrate: 2000000,
      //framerate:20
    };
    this.init = {
      output: async (chunk, metadata) => {
        console.log("byteLength", chunk.byteLength);
        const chunkData = new Uint8Array(chunk.byteLength);
        chunk.copyTo(chunkData);
        //console.log(chunk);
        //console.log(metadata);
        //console.log("metadata", JSON.stringify(metadata));
        await this.dotNet.invokeMethodAsync("StreamToFile", chunkData, chunk.timestamp, chunk.type);
      },
      error: (e) => {
        console.log(e.message);
        stopRecording();
      }
    };
    this.videoEncoder = new VideoEncoder(this.init);
    //this.compressSize = 0;
    this.dotNet = dotNet;
    this.videoFrameToBytes = new TransformStream({
      async transform(videoFrame, controller) {
        this.videoEncoder.encode(videoFrame, { keyFrame: true });
        videoFrame.close();
        controller.enqueue(videoFrame);
      }
    });
    this.done = false;
    this.audioTrack = stream.getAudioTracks()[0];
    //this.audioTrackSettings = this.audioTrack.getSettings();
    //this.videoTrackSettings = this.stream.getVideoTracks()[0].getSettings();
    this.trackVideoProcessor = new MediaStreamTrackProcessor({ track: stream.getVideoTracks()[0] });
  }

  //async start2() {
  //  let stream = new CompressionStream("gzip");
  //  this.trackVideoProcessor.readable.pipeThrough(this.videoFrameToBytes).pipeThrough(stream);

  //  for await (const chunks of stream.readable) {
  //    console.log(chunk.length);

  //    while (chunks.length > 0) {
  //      let chunk = chunks.splice(0, 32000);
  //      await dotNet.invokeMethodAsync("StreamToFile", new Uint8Array(chunk));
  //    }
  //  }
  //}


  async start() {
    const { supported } = await VideoEncoder.isConfigSupported(this.config);
    if (supported) {
      this.videoEncoder.configure(this.config);
      var reader = this.trackVideoProcessor.readable.getReader();
      while (!this.done) {
        const { value, done: doneReading } = await reader.read();
        this.done = doneReading;
        if (value) {
          this.videoEncoder.encode(value, { keyFrame: true });
          value.close();
        }
      }
      this.trackVideoProcessor = null;
    }
  }


  async start3() {
    var reader = this.trackVideoProcessor.readable.getReader();//.pipeThrough(this.transformStream);

    while (!this.done) {
      const { value, done: doneReading } = await reader.read();
      this.done = doneReading;

      if (value) {
        const rect = { x: 0, y: 0, width: value.codedWidth, height: value.codedHeight };

        let buffer = new Uint8Array(value.allocationSize({ rect }));
        console.log(value);
        await value.copyTo(buffer, { rect });
        console.log(`timestamp=${value.timestamp} type=${value.format} codedHeight=${value.codedHeight} codedWidth=${value.codedWidth}`);
        console.log(`colorSpace=${JSON.stringify(value.colorSpace)} visibleRect = ${JSON.stringify(value.visibleRect)}`);
        console.log(buffer.length);
        let array = [...buffer];
        while (array.length > 0) {
          let chunk = array.splice(0, 32000);
          await this.dotNet.invokeMethodAsync("StreamToFile", new Uint8Array(chunk));
        }

        //await this.dotNet.invokeMethodAsync("StreamToFile", buffer);
        value.close();
      }
    }
    //this.trackVideoProcessor.readable.cancel();
    this.trackVideoProcessor = null;
  }
  stop() {
    if (this.trackVideoProcessor) {
      this.done = true;
    }
    this.dotNet.invokeMethodAsync("StopStreamToFile");
  }
}