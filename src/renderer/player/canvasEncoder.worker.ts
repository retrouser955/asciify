import { parentPort } from "node:worker_threads";
import chalk from "chalk";

parentPort?.on("message", (data) => {
    const { width, height, videoFrame } = data;
    const buf = Buffer.from(videoFrame);

    const asciiArray = bufferToAscii(width, height, buf);

    parentPort?.postMessage(asciiArray);
})

export function bufferToAscii(width: number, height: number, buffer: Buffer) {
    let asciiFrame = "";
    const asciiScale = " .:-=+*#%@";
    let lastR = -1, lastG = -1, lastB = -1;
    let currentGroupString = "";

    for (let i = 0; i < buffer.length; i += 4) {
        const r = buffer[i];
        const g = buffer[i + 1];
        const b = buffer[i + 2];

        const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;

        let normalized = brightness / 255;

        const charIndex = Math.floor(normalized * (asciiScale.length - 1));
        const rawChar = asciiScale[charIndex];

        if (lastR === r && lastG === g && lastB === b) {
            currentGroupString += rawChar;
        } else {
            if (currentGroupString.length > 0) {
                const colored = chalk.rgb(lastR, lastG, lastB)(currentGroupString);
                asciiFrame += colored;
            }

            currentGroupString = rawChar;

            lastR = r;
            lastG = g;
            lastB = b;
        }

        let rowCount = 0;

        if (((i / 4) + 1) % width === 0) {
            rowCount++;

            if (rowCount < height) {
                asciiFrame += "\n";
            }
        }
    }

    return asciiFrame;
}
