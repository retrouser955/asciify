// import blessed from "neo-blessed";
import { Worker } from "node:worker_threads";
import AsyncLock from "async-lock";
import path from "node:path";
// import { makeSpotifyRequest } from "../../utils/index.ts";
import { CANVAS_DISPLAY_FPS, USER_AGENT } from "../../Constants.ts";
import { spawn } from "node:child_process";
// import { Readable } from "node:stream";
import { render } from "../boxes/index.ts";
import { canvasDisplay } from "../boxes/index.ts";
// import { createWriteStream } from "node:fs";

const worker = new Worker(path.join(process.cwd(), "src", "renderer", "player", "canvasEncoder.worker.ts"));
const lock = new AsyncLock();

export interface AsciiArrayOptions {
    width: number;
    height: number;
    videoFrame: Buffer<any>;
}

export function play(video: string[]) {
    let isRunning = true;
    const frameInterval = 1000 / CANVAS_DISPLAY_FPS;

    let lastTime = Date.now();
    let currentFrame = 0;

    function processFrame() {
        const now = Date.now();
        const delta = now - lastTime;

        if(delta >= frameInterval) {
            lastTime = now - (delta % frameInterval); // prevent drift

            canvasDisplay.setContent(video[currentFrame]);
            render();

            currentFrame++;

            if(currentFrame >= (video.length - 1)) currentFrame = 0;
        }

        setImmediate(() => {
            if(isRunning) processFrame();
        });
    }

    processFrame();

    return {
        stop() {
            isRunning = false;
        }
    }
}

export async function downloadCanvas(url: string) {
    return new Promise<string[]>((resolve, reject) => {
        const width = Number(canvasDisplay.width);
        const height = Number(canvasDisplay.height);
		const headers = {
			"Origin": "https://open.spotify.com",
			"Referrer": "https://open.spotify.com/",
			"User-Agent": USER_AGENT
		}
		const headersFFmpegFormat = Object.entries(headers)
			.map(([k, v]) => `${k}: ${v}`)
			.join("\r\n") + "\r\n";

        const ffmpegArgs = [
			"-headers", headersFFmpegFormat,
            "-i", url,
            "-vf", `scale=${width}:${height},fps=${CANVAS_DISPLAY_FPS}`,
            "-f", "rawvideo",
            "-pix_fmt", "rgba",
            "pipe:1"
        ]

        const ffmpegProcess = spawn("ffmpeg", ffmpegArgs);
        const frames: Promise<string>[] = [];

        ffmpegProcess.stdout.on("data", (chunk) => {
            frames.push(createAsciiArray({
                width,
                height,
                videoFrame: Buffer.from(chunk)
            }));
        });

		// ffmpegProcess.stderr.pipe(createWriteStream("logs.txt"));

        ffmpegProcess.on("close", async (code) => {
            if (code !== 0) reject("FFmpeg did not exit cleanly");

            const realFrames = await Promise.all(frames);

            ffmpegProcess.stdout.removeAllListeners();
            ffmpegProcess.removeAllListeners();

            resolve(realFrames);
        })
    })
}

export async function createAsciiArray(options: AsciiArrayOptions) {
    return await lock.acquire("ASCII-TRANSCODER", async () => {
        worker.postMessage(options, [options.videoFrame.buffer]);

        return await new Promise<string>((resolve) => {
            worker.once("message", (v) => resolve(v));
        })
    })
}
