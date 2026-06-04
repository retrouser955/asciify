import blessed from "neo-blessed";
import { Worker } from "node:worker_threads";
import AsyncLock from "async-lock";
import path from "node:path";
import { makeSpotifyRequest } from "../../utils";
import { CANVAS_DISPLAY_FPS } from "../../Constants";
import { spawn } from "node:child_process";
import { Readable } from "node:stream";
import { render } from "../screen";

const worker = new Worker(path.join(process.cwd(), "src", "renderer", "player", "canvasEncoder.worker.ts"));
const lock = new AsyncLock();

export const canvasDisplay = blessed.text({
    width: "25%",
    height: "90%",
    top: "0%",
    left: "75%",
    border: {
        type: "line",
        fg: 5
    },
    wrap: false,
    scrollable: false,
    padding: 0,
    align: 'center',
    valign: 'middle',
    tags: false
});

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
    const videoDownload = await makeSpotifyRequest(url);

    if(!videoDownload.ok || !videoDownload.body) throw new Error("No request body found or the request failed.");

    return new Promise((resolve, reject) => {
        const width = Number(canvasDisplay.width);
        const height = Number(canvasDisplay.height);

        const ffmpegArgs = [
            "-i", "pipe:0",
            "-vf", `scale=${width}:${height},fps=${CANVAS_DISPLAY_FPS}`,
            "-f", "rawvideo",
            "-pix_fmpt", "rgba",
            "pipe:1"
        ]

        const ffmpegProcess = spawn("ffmpeg", ffmpegArgs);
        const frames: Promise<string>[] = [];

        // @ts-expect-error The data is the correct format
        const readable = Readable.fromWeb(videoDownload.body);

        ffmpegProcess.stdout.on("data", (chunk) => {
            frames.push(createAsciiArray({
                width,
                height,
                videoFrame: Buffer.from(chunk)
            }));
        });

        ffmpegProcess.on("exit", async (code) => {
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