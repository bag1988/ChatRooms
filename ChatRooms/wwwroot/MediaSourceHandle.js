let worker;
function initWriteChunk(remoteVideo) {
  if (remoteVideo) {   
    worker = new Worker('WorkerMediaSource.js?v=13');
    worker.postMessage({ msg: "init" });
    worker.onmessage = msg => {
      if (msg.data?.topic == 'handle') {
        remoteVideo.srcObject = msg.data.arg;
      }
    };
  }
}

function writeChank(bytea) {
  try {

    if (worker) {
      worker.postMessage({ msg: "chunk", chunk: bytea });
    }
  }
  catch (e) {
    console.error(e.message);
  }
}

function stopWriteChank() {
  try {

    if (worker) {
      console.log("worker terminate");
      worker.terminate();
      worker = null;
    }
  }
  catch (e) {
    console.error(e.message);
  }
}