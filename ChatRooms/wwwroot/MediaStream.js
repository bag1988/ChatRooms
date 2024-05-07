let writerTrack;
let writableStream;



const init = {
  output: async (videoFrame) => {
    if (writerTrack) {
      await writerTrack.ready;
      writerTrack.write(videoFrame);
      videoFrame.close();
    }
  },
  error: (e) => {
    console.log(e.message);
  },
};

const config = {
  codec: "vp09.00.10.08",
  codedWidth: 1280,
  codedHeight: 720,
};



const decoder = new VideoDecoder(init);

let videoFrameToBytes = new TransformStream({
  async transform(chunk, controller) {
    let frame = new VideoFrame(chunk.buffer, {
      format: "NV12",
      codedWidth: 640,
      codedHeight: 360,
      timestamp: 0
    });
    controller.enqueue(frame);
    //frame.close();
  }
});

async function initWriteChunk(remoteVideo) {
  if (remoteVideo) {

    const { supported } = await VideoDecoder.isConfigSupported(config);
    if (supported) {      
      decoder.configure(config);
    } else {
      // Try another config.
    }

    let trackGenerator = new MediaStreamTrackGenerator({ kind: 'video' });
    writerTrack = trackGenerator.writable.getWriter();

    // const ds = new DecompressionStream("gzip");
    //writer = videoFrameToBytes.writable.getWriter();
    //videoFrameToBytes.readable.pipeThrough(ds).pipeTo(writerTrack);

    const streamAfter = new MediaStream([trackGenerator]);
    remoteVideo.srcObject = streamAfter;
    remoteVideo.play();
  }
}

async function writeChank(bytea, timestamp, chunk_type) {
  try {

    //var info = JSON.parse(metadata);

    const chunk = new EncodedVideoChunk({
      timestamp: timestamp,
      type: chunk_type,
      data: bytea,
    });

    decoder.decode(chunk);

    //if (writer) {

    //  await writer.ready;
    //  writer.write(bytea);


    //}

    //if (writerTrack) {
    //  await writerTrack.ready;
    //  let frame = new VideoFrame(bytea, {
    //    format: "NV12",
    //    codedWidth: 640,
    //    codedHeight: 360,
    //    timestamp: 0
    //  });
    //  writerTrack.write(frame);
    //  frame.close();
    //}

  }
  catch (e) {
    console.error(e.message);
    writerTrack.close();
  }
}

function stopWriteChank() {
  try {
    if (writerTrack) {
      console.log("writer close");
      writerTrack.close();
      writerTrack = null;
    }
  }
  catch (e) {
    console.error(e.message);
  }
}