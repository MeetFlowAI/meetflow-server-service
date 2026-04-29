/**
 * utils/audio.util.js
 *
 * Converts audio buffers to WAV format using ffmpeg.
 * Browser MediaRecorder produces audio/webm (Opus codec).
 * AI service (pyannote/SpeechBrain) requires WAV 16kHz mono PCM.
 *
 * ffmpeg is available on Render's Node.js runtime by default.
 */

import ffmpeg from "fluent-ffmpeg";
import { randomUUID } from "crypto";
import { tmpdir } from "os";
import { join } from "path";
import { writeFile, readFile, unlink } from "fs/promises";

// ─── Convert single buffer to WAV ─────────────────────────────────────────────
export const convertToWav = (inputBuffer, inputMime = "audio/webm") => {
  return new Promise(async (resolve, reject) => {
    const id = randomUUID();
    const ext = mimeToExt(inputMime);
    const inputPath = join(tmpdir(), `mf_in_${id}.${ext}`);
    const outputPath = join(tmpdir(), `mf_out_${id}.wav`);

    try {
      await writeFile(inputPath, inputBuffer);
    } catch (writeErr) {
      return reject(new Error(`Failed to write temp file: ${writeErr.message}`));
    }

    ffmpeg(inputPath)
      .audioFrequency(16000)    // 16kHz — standard for speech models
      .audioChannels(1)         // mono
      .audioCodec("pcm_s16le")  // 16-bit PCM — required by pyannote/SpeechBrain
      .format("wav")
      .output(outputPath)
      .on("end", async () => {
        try {
          const wavBuffer = await readFile(outputPath);
          resolve(wavBuffer);
        } catch (readErr) {
          reject(new Error(`Failed to read converted WAV: ${readErr.message}`));
        } finally {
          await Promise.all([
            unlink(inputPath).catch(() => {}),
            unlink(outputPath).catch(() => {}),
          ]);
        }
      })
      .on("error", async (ffmpegErr) => {
        await Promise.all([
          unlink(inputPath).catch(() => {}),
          unlink(outputPath).catch(() => {}),
        ]);
        reject(new Error(`FFmpeg conversion failed: ${ffmpegErr.message}`));
      })
      .run();
  });
};

// ─── Convert multiple files in parallel ───────────────────────────────────────
export const convertAllToWav = async (files) => {
  return Promise.all(
    files.map(async (file, i) => {
      const wavBuffer = await convertToWav(
        file.buffer,
        file.mimetype || "audio/webm"
      );
      return {
        buffer: wavBuffer,
        filename: `clip_${i + 1}.wav`,
        contentType: "audio/wav",
      };
    })
  );
};

// ─── MIME type → file extension ───────────────────────────────────────────────
const mimeToExt = (mime = "") => {
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("aac")) return "aac";
  return "webm"; // browser default (MediaRecorder)
};
