﻿class CreateReadableStream {
  constructor(stream, dotNet) {
    this.dotNet = dotNet;
    this.audioTracks = stream.getAudioTracks()[0];
    this.videoTracks = stream.getVideoTracks()[0];
    this.settingVideo = this.videoTracks?.getSettings();
    this.settingAudio = this.audioTracks?.getSettings();
    this.configAudio = {
      codec: "opus",
      sampleRate: this.settingAudio?.sampleRate ?? 16_000,
      numberOfChannels: this.settingAudio?.channelCount ?? 1,
      bitrate: this.settingAudio ? ((this.settingAudio.sampleRate * (this.settingAudio.sampleSize / 8) * this.settingAudio.channelCount)) : 32_000
    };
    this.initAudioEncoder = {
      output: async (chunk, metadata) => {
        if (metadata?.decoderConfig) {
          let confAudio = {
            codec: metadata.decoderConfig.codec,
            description: new Uint8Array(metadata.decoderConfig.description),
            numberOfChannels: metadata.decoderConfig.numberOfChannels,
            sampleRate: metadata.decoderConfig.sampleRate
          }
          console.debug("Конфигурация аудио кодера", confAudio);
          await this.dotNet.invokeMethodAsync("SendAudioConfig", JSON.stringify(confAudio));
        }
        const chunkData = new Uint8Array(chunk.byteLength);
        chunk.copyTo(chunkData);
        await this.dotNet.invokeMethodAsync("StreamAudioForChat", chunkData, chunk.timestamp, chunk.type);
      },
      error: (e) => {
        console.error("Ошибка инициализации аудио кодирования", e);
        this.stop();
      }
    };
    this.configVideo = {
      codec: "vp09.00.10.08",
      width: this.settingVideo?.width ?? 640,
      height: this.settingVideo?.height ?? 480,
      bitrate: 2_000_000,
    };
    this.initVideoEncoder = {
      output: async (chunk, metadata) => {
        if (metadata?.decoderConfig) {
          console.debug("Конфигурация видео кодера", metadata.decoderConfig);
          await this.dotNet.invokeMethodAsync("SendVideoConfig", JSON.stringify(metadata.decoderConfig));
        }
        const chunkData = new Uint8Array(chunk.byteLength);
        chunk.copyTo(chunkData);
        await this.dotNet.invokeMethodAsync("StreamVideoForChat", chunkData, chunk.timestamp, chunk.type);
      },
      error: (e) => {
        console.error("Ошибка инициализации видео кодирования", e);
        this.stop();
      }
    };
    this.audioEncoder = new AudioEncoder(this.initAudioEncoder);
    this.videoEncoder = new VideoEncoder(this.initVideoEncoder);
    this.trackAudioProcessor = this.audioTracks ? new MediaStreamTrackProcessor({ track: this.audioTracks }) : null;
    this.trackVideoProcessor = this.videoTracks ? new MediaStreamTrackProcessor({ track: this.videoTracks }) : null;
  }

  start() {
    this.readVideoFrame();
    this.readAudioFrame();
  }

  readVideoFrame() {
    try {
      VideoEncoder.isConfigSupported(this.configVideo).then(async ({ supported }) => {
        if (supported && this.trackVideoProcessor) {
          this.videoEncoder.configure(this.configVideo);
          for await (const chunk of this.trackVideoProcessor.readable) {
            if (chunk) {
              this.videoEncoder.encode(chunk, { keyFrame: true });
              chunk.close();
            }
          }
        }
      });
    }
    catch (e) {
      console.error("Ошибка чтения видео данных", e.message);
    }
  }

  readAudioFrame() {
    try {
      AudioEncoder.isConfigSupported(this.configAudio).then(async ({ supported }) => {
        if (supported && this.trackAudioProcessor) {
          await this.audioEncoder.configure(this.configAudio);
          for await (const chunk of this.trackAudioProcessor.readable) {
            if (chunk) {
              this.audioEncoder.encode(chunk, { keyFrame: true });
              chunk.close();
            }
          }
        }
      });
    }
    catch (e) {
      console.error("Ошибка чтения видео данных", e.message);
    }
  }


  stop() {
    try {
      this.videoTracks?.stop();
      this.trackVideoProcessor?.readable.cancel();
      this.trackVideoProcessor = null;
      if (this.videoEncoder?.state != "closed") {
        this.videoEncoder?.close();
      }


      this.audioTracks?.stop();
      this.trackAudioProcessor?.readable.cancel();
      this.trackAudioProcessor = null;
      if (this.audioEncoder?.state != "closed") {
        this.audioEncoder?.close();
      }



      this.dotNet.invokeMethodAsync("SendStopLocalStream");
    }
    catch (e) {
      console.error("Ошибка остановки трансляции локальных данных", e.message);
    }

  }
}