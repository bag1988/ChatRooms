let mediaSource;

function initWriteChunk(remoteVideo) {
  if (remoteVideo) {
    if (mediaSource) {
      if (mediaSource.readyState == "open") {
        console.log("endOfStream");
        mediaSource.endOfStream();
      }
      mediaSource = null;
    }
    createMediaSource();
  }
}

function createMediaSource() {
  console.log("createMediaSource");
  var remoteVideo = document.querySelector("#remoteVideo");
  mediaSource = new MediaSource();
  remoteVideo.src = URL.createObjectURL(mediaSource);

  mediaSource.addEventListener('sourceopen', sourceOpen, { once: true });
}

function sourceOpen() {
  URL.revokeObjectURL(document.querySelector("#remoteVideo").src);
  console.log("sourceOpen");
  //let sourceBuffer = mediaSource.addSourceBuffer('video/webm;codecs=h264');
  let sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp9,opus"');
  sourceBuffer.addEventListener('updateend', function (e) { updateEnd(); });

}
function updateEnd() {  
  if (mediaSource.readyState == "open") {
    mediaSource.endOfStream();
  }
  else {
    console.log("Error end stream", mediaSource.readyState)
  }
}
function writeChank(bytea) {
  try {   
    if (mediaSource.sourceBuffers.length > 0) {
      let sourceBuffer = mediaSource.sourceBuffers[0];
      if (!sourceBuffer.updating) {
        sourceBuffer.appendBuffer(bytea);
      }
    }
    else {
      console.log("No have buffer for write");
    }
  }
  catch (e) {
    console.error(e.message);
  }
}

function stopWriteChank() {
  try {
    if (mediaSource) {
      if (mediaSource.readyState == "open") {
        console.log("endOfStream");
        mediaSource.endOfStream();
      }
      mediaSource = null;
    }
  }
  catch (e) {
    console.error(e.message);
  }
}
