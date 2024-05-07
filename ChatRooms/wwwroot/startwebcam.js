
var videoRecord;
async function startStream(dotNet, idWebCam) {
  var mediaStream = null;
  if (idWebCam == true) {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        width: { exact: 640 },
        height: { exact: 360 },
        frameRate: 20
      }
    });
  }
  else {
    mediaStream = await navigator.mediaDevices.getDisplayMedia({
      audio: true,
      video: {
        displaySurface: "window"
      }
    });
  }

  if (mediaStream) {
    var localVideo = document.querySelector("#localVideo");

    if (localVideo) {
      localVideo.srcObject = mediaStream;
      localVideo.classList.remove("d-none");

      if (videoRecord) {
        videoRecord.stop();
        videoRecord = null;
      }
      //videoRecord = new VideoRecord(localVideo.captureStream(25), dotNet);
      videoRecord = new CreateReadableStream(localVideo.captureStream(), dotNet);
      videoRecord.start();
      return true;
    }
  }
  return false;
}

function stopStream() {
  var localVideo = document.querySelector("#localVideo");

  if (localVideo && localVideo.srcObject) {
    localVideo.srcObject.getTracks().forEach(track => {
      track.stop();
      localVideo.srcObject.removeTrack(track);
    });
    localVideo.srcObject = null;
    if (videoRecord) {
      videoRecord.stop();
      videoRecord = null;
    }
    localVideo.classList.add("d-none");
  }
}

function initRemotePlayer() {
  var remoteVideo = document.querySelector("#remoteVideo");
  if (remoteVideo) {
    remoteVideo.onemptied = (event) => {
      //console.log("onemptied");
    };
    remoteVideo.oncanplay = (event) => {
      //console.log("oncanplay");
    };
    remoteVideo.ondurationchange = (event) => {
      //console.log("ondurationchange");
      if (remoteVideo.buffered.length > 0) {
        remoteVideo.play();
      }
      else {
        console.log("No have buffered for play");
      }
    };
    remoteVideo.onwaiting = (event) => {
      //console.log("onwaiting");
    };
    remoteVideo.ontimeupdate = (event) => {
      //console.log("ontimeupdate");
    };
    remoteVideo.onprogress = (event) => {
      //console.log("onprogress");
    };
    remoteVideo.setAttribute('crossorigin', 'anonymous');

    initWriteChunk(remoteVideo);
  }
}

window.setStream = (bytes, timestamp, chunk_type) => {
  try {
    writeChank(bytes, timestamp, chunk_type);
  }
  catch (e) {
    console.error(e.message);
  }
}

window.removeWorker = () => {
  try {
    stopWriteChank();
  }
  catch (e) {
    console.error(e.message);
  }
}


//window.setStream = async (imageStream) => {
//  const myMediaSource = new MediaSource();
//  const url = URL.createObjectURL(myMediaSource);
//  const image = document.querySelector("#remoteVideo");
//  image.src = url;
//  const arrayBuffer = await imageStream.arrayBuffer();
//  const videoSourceBuffer = myMediaSource.addSourceBuffer('video/webm; codecs="vorbis,vp8"');
//  videoSourceBuffer.appendBuffer(arrayBuffer);
//}