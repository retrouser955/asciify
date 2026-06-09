import { Transform, type TransformCallback } from "node:stream";

export class PCMVolumeTransformer extends Transform {
    volume = 1;
    constructor(initialVolume = 100) {
        super();
        this.volume = initialVolume / 100;
    }

    setVolume(volumePercentage: number) {
        if(volumePercentage > 100 || volumePercentage < 0) throw new Error("Volume can't be more than 100 or less than 0");
        
        this.volume = volumePercentage / 100;
    }

    toString() {
        return `${this.volume * 100}%`
    }

    _transform(chunk: Buffer, _: BufferEncoding, callback: TransformCallback): void {
        if(this.volume === 1) {
            this.push(chunk);
            callback();
        }

        for(let i = 0; i < chunk.length; i += 2) {
            const sample = chunk.readInt16LE(i);

            let modifiedSample = sample * this.volume;
            
            if(modifiedSample > 32767) modifiedSample = 32767;
            else if (modifiedSample < -32767) modifiedSample = -32767;

            chunk.writeInt16LE(Math.round(modifiedSample), i);
        }

        this.push(chunk);
        callback();
    }
}