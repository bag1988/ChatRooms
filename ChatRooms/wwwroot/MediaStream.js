let writerVideoTrack;
let writerAudioTrack;

let videoDecoder = null;
let audioDecoder = null;

let mediaStreamRemote = null;

const initVideoDecoder = {
  output: async (videoFrame) => {
    if (writerVideoTrack) {
      await writerVideoTrack.ready;
      writerVideoTrack.write(videoFrame);
      videoFrame.close();
    }
  },
  error: (e) => {
    console.log(e.message);
  },
};

const initAudioDecoder = {
  output: async (audioFrame) => {
    if (writerAudioTrack) {
      await writerAudioTrack.ready;
      writerAudioTrack.write(audioFrame);
      audioFrame.close();
    }
  },
  error: (e) => {
    console.log(e.message);
  },
};


async function initWriteChunk(remoteVideo) {
  if (remoteVideo) {
    mediaStreamRemote = new MediaStream();
    remoteVideo.poster = "/sound.svg";
    remoteVideo.srcObject = mediaStreamRemote;
  }
}

async function InitVideoConfig(configVideoJson) {
  console.debug("Инициализации видео декодирования", configVideoJson);
  try {
    if (configVideoJson) {
      let configVideo = JSON.parse(configVideoJson);

      let supportedVideo = await VideoDecoder.isConfigSupported(configVideo);
      if (supportedVideo.supported) {
        if (!videoDecoder || videoDecoder == null) {
          videoDecoder = new VideoDecoder(initVideoDecoder);
        }
        videoDecoder.configure(configVideo);

        if (!writerVideoTrack) {
          let trackGeneratorVideo = new MediaStreamTrackGenerator({ kind: 'video' });
          writerVideoTrack = trackGeneratorVideo.writable.getWriter();

          trackGeneratorVideo.onmute = (event) => {
            try {
              //if (event.currentTarget && mediaStreamRemote.getTrackById(event.currentTarget.id)) {
              //  event.currentTarget.stop();
              //  mediaStreamRemote.removeTrack(event.currentTarget);
              //}
              //if (mediaStreamRemote.getTracks().length == 0) {
              //  console.debug((new Date()).toLocaleString(), "Communication video onmute no other track, close stream");
              //  stopWriteChunk();
              //}
              console.debug((new Date()).toLocaleString(), "Communication video onmute", event);
            }
            catch (e) {
              console.error((new Date()).toLocaleString(), "Communication video error onmute", e);
            }
          };

          trackGeneratorVideo.onunmute = (event) => {
            try {
              console.debug((new Date()).toLocaleString(), "Communication video onunmute", event);
              // mediaStreamRemote.addTrack(event.currentTarget);
              console.debug((new Date()).toLocaleString(), "Communication video onunmute video track length", mediaStreamRemote.getTracks());
            }
            catch (e) {
              console.error((new Date()).toLocaleString(), "Communication video error onunmute", e);
            }
          };

          mediaStreamRemote.addTrack(trackGeneratorVideo);
        }
      }
      else {
        console.debug("Нет поддержки видеокодека!");
      }
    }
  }
  catch (e) {
    console.error("Ошибка инициализации видео декодара", e.message);
  }
}

async function InitAudioConfig(configAudioJson) {
  console.debug("Инициализации аудио декодирования", configAudioJson);
  try {
    if (configAudioJson) {
      let configAudio = JSON.parse(configAudioJson);

      let desc = byteToUint8Array(configAudio.description);

      let conf = {
        codec: configAudio.codec,
        description: desc.buffer,
        numberOfChannels: configAudio.numberOfChannels,
        sampleRate: configAudio.sampleRate
      }
      let supportedAudio = await AudioDecoder.isConfigSupported(conf);
      if (supportedAudio.supported) {
        if (!audioDecoder || audioDecoder == null) {
          audioDecoder = new AudioDecoder(initAudioDecoder);
        }

        audioDecoder.configure(conf);

        if (!writerAudioTrack) {
          let trackGeneratorAudio = new MediaStreamTrackGenerator({ kind: 'audio' });
          writerAudioTrack = trackGeneratorAudio.writable.getWriter();
                    
          mediaStreamRemote.addTrack(trackGeneratorAudio);
        }
      }
      else {
        console.debug("Нет поддержки аудиокодека!");
      }
    }
  }
  catch (e) {
    console.error("Ошибка инициализации аудио декодара", e.message);
  }
}

function byteToUint8Array(byteArray) {
  var uint8Array = new Uint8Array(19);
  for (var i = 0; i < uint8Array.length; i++) {
    uint8Array[i] = byteArray[i];
  }

  return uint8Array;
}

async function writeVideoChank(bytea, timestamp, chunk_type) {
  try {
    if (videoDecoder) {
      const chunk = new EncodedVideoChunk({
        timestamp: timestamp,
        type: chunk_type,
        data: bytea,
      });
      videoDecoder.decode(chunk);
    }
  }
  catch (e) {
    console.error(e.message);
  }
}

async function writeAudioChank(bytea, timestamp, chunk_type) {
  try {
    if (audioDecoder) {
      const chunk = new EncodedAudioChunk({
        timestamp: timestamp,
        type: chunk_type,
        data: bytea,
      });
      audioDecoder.decode(chunk);
    }
  }
  catch (e) {
    console.error(e.message);
  }
}

function stopWriteChunk() {
  try {
    if (writerVideoTrack) {
      console.log("stop writer video");
      writerVideoTrack.close();
      videoDecoder.close();
      videoDecoder = null;
      writerVideoTrack = null;
    }
    if (writerAudioTrack) {
      console.log("stop writer audio");
      writerAudioTrack.close();
      
      audioDecoder.close();
      audioDecoder = null;
      writerAudioTrack = null;
    }
  }
  catch (e) {
    console.error(e.message);
  }
}