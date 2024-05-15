
var videoRecord;
async function StartLocalStream(dotNet, idWebCam) {
  var mediaStream = null;
  if (idWebCam == true) {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16_000,
        sampleSize: 16,
        channelCount: 1
      },
      video: true
    });
  }
  else {
    mediaStream = await navigator.mediaDevices.getDisplayMedia({
      audio: {
        suppressLocalAudioPlayback: false,
      },
      systemAudio: "include",
      video: {
        displaySurface: "window"
      }
    });

    //if (mediaStream.getAudioTracks().length == 0) {

    //  let audioTrack = await navigator.mediaDevices.getUserMedia({
    //    audio: true,
    //    video: false
    //  });
    //  mediaStream.addTrack(audioTrack.getAudioTracks()[0]);
    //}
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
      videoRecord = new CreateReadableStream(mediaStream, dotNet);
      videoRecord.start();
      return true;
    }
  }
  return false;
}

function StopLocalStream() {
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

//for remote video
function initRemotePlayer() {
  var remoteVideo = document.querySelector("#remoteVideo");
  if (remoteVideo) {
    remoteVideo.setAttribute('crossorigin', 'anonymous');
    initWriteChunk(remoteVideo);
  }
}


window.setRemoteVideoChunk = (bytes, timestamp, chunk_type) => {
  try {
    writeVideoChank(bytes, timestamp, chunk_type);
  }
  catch (e) {
    console.error(e.message);
  }
}
window.setRemoteAudioChunk = (bytes, timestamp, chunk_type) => {
  try {
    writeAudioChank(bytes, timestamp, chunk_type);
  }
  catch (e) {
    console.error(e.message);
  }
}


window.setVideoConfig = (configJson) => {
  try {
    InitVideoConfig(configJson);
  }
  catch (e) {
    console.error(e.message);
  }
}

window.setAudioConfig = (configJson) => {
  try {
    InitAudioConfig(configJson);
  }
  catch (e) {
    console.error(e.message);
  }
}

//window.setStream = (bytes, timestamp, chunk_type) => {
//  try {
//    writeChank(bytes, timestamp, chunk_type);
//  }
//  catch (e) {
//    console.error(e.message);
//  }
//}

window.removeRemoteStream = () => {
  try {
    stopWriteChunk();
    document.querySelector("#remoteVideo")?.pause();
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