
let ConfigEncoder = null;
let DotNetCall = null;
let media_source;

onmessage = (e) => {
  if (e.data.msg == "init") {

    ConfigEncoder = e.data.config;
    DotNetCall = e.data.dotnet;

    media_source = new MediaSource();
    console.log("canConstructInDedicatedWorker", MediaSource.canConstructInDedicatedWorker);
    let handle = media_source.handle;
    postMessage({ topic: 'handle', arg: handle }, [handle]);
    media_source.addEventListener('sourceopen', () => {
      console.log("sourceOpen");
      let sourceBuffer = media_source.addSourceBuffer('video/webm; codecs="vp9,opus"');
      sourceBuffer.addEventListener('updateend', (e) => {
        if (media_source.readyState == "open") {
          media_source.endOfStream();
        }
        else {
          console.log("Error end stream", media_source.readyState)
        }
      });
    }, { once: true });

  }
  else if (e.data.msg == "chunk" && e.data.chunk) {
    try {
      if (media_source.sourceBuffers.length > 0) {
        let sourceBuffer = media_source.sourceBuffers[0];
        if (!sourceBuffer.updating) {
          sourceBuffer.appendBuffer(e.data.chunk);
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
  return;
};

