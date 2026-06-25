import path from "node:path";
import { TypedEmitter } from "tiny-typed-emitter";
import { spawn } from "node:child_process";
import { bar } from "../../renderer/progressBar/index.ts";
import { lyrics } from "../../renderer/lyrics/index.ts";

const RESPOT_URL = "http://127.0.0.1:3200";

export async function createRespotInstance() {
    const respotPath = path.join(import.meta.dirname, "..", "golibrespot", "go-librespot");
    const configPath = path.join(import.meta.dirname, "..", "golibrespot", "config");

    const respotProcess = spawn(respotPath, [
        "--config_dir", configPath
    ]);

	await new Promise<void>((resolve) => {
		respotProcess.stderr.on("data", (chunk) => {
			const str = chunk instanceof Buffer ? chunk.toString() : chunk as string;
			if(str.includes("authenticated Login5")) {
				resolve();
				respotProcess.stderr.removeAllListeners();
			}	
		})
	})

	process.on("exit", () => {
		respotProcess.kill("SIGKILL");
	})

    return respotProcess;
}

export interface Metadata {
    context_uri: string;
    uri: string;
    name: string;
    artist_names: string[];
    album_name: string;
    album_cover_url: string;
    position: number;

    duration: number;
}

export interface WillPlay {
    context_uri: string;
    uri: string;
    play_origin: string;
}

export interface Playing extends WillPlay {
    resume: boolean;
}

export type NotPlaying = WillPlay;

export type Paused = WillPlay;

export type Stopped = Omit<WillPlay, "context_uri" | "uri">;

export interface Seek extends WillPlay {
    position: number;
    duration: number;
}

export interface Volume {
    duration: number;
    position: number;
}

export interface ShuffleContext {
    value: boolean;
}

export type RepeatContext = ShuffleContext;

export type RepeatTrack = ShuffleContext;

export const RespotEvents = {
    Active: "active",
    Inactive: "inactive",
    Metadata: "metadata",
    WillPlay: "will_play",
    Playing: "playing",
    NotPlaying: "not_playing",
    Paused: "paused",
    Stopped: "stopped",
    Seek: "seek",
    Volume: "volume",
    ShuffleContext: "shuffle_context",
    RepeatContext: "repeat_context",
    RepeatTrack: "repeat_track"
} as const;
export type RespotEvents = (typeof RespotEvents)[keyof typeof RespotEvents];

export interface RespotEventsInternal {
    [RespotEvents.Active]: () => unknown;
    [RespotEvents.Inactive]: () => unknown;
    [RespotEvents.Metadata]: (metadata: Metadata) => unknown;
    [RespotEvents.NotPlaying]: (np: NotPlaying) => unknown;
    [RespotEvents.Paused]: (paused: Paused) => unknown;
    [RespotEvents.Playing]: (playing: Playing) => unknown;
    [RespotEvents.RepeatContext]: (context: RepeatContext) => unknown;
    [RespotEvents.Seek]: (seek: Seek) => unknown;
    [RespotEvents.ShuffleContext]: (shuffle: ShuffleContext) => unknown;
    [RespotEvents.Stopped]: (stopped: Stopped) => unknown;
    [RespotEvents.Volume]: (vol: Volume) => unknown;
}

export interface StatusReturn {
	device_id: string;
	paused: boolean;
	track: Metadata | null;
}

export class LibRespotController extends TypedEmitter<RespotEventsInternal> {
    constructor() {
        super();
    }

	createSocketServer() {
		const ws = new WebSocket("ws://127.0.0.1:3200/events");

        ws.addEventListener("message", (ev) => {
            const data = JSON.parse(ev.data) as { type: keyof RespotEventsInternal, data: unknown };
            this.emit(data.type, data.data as any);
        });
	}

    async fetchCurrentStatus(): Promise<StatusReturn> {
        const t = await fetch(`${RESPOT_URL}/status`);

        return t.json();
    }

	async play(trackId: string) {
		trackId = trackId.replace(/^(spotify:track:)?/, "spotify:track:");

		const req = await fetch(`${RESPOT_URL}/player/play`, {
			body: JSON.stringify({
				uri: trackId
			}),
			method: "POST"
		});

		if(!req.ok) throw new Error("Play request failed");
	}

	pause() {
		return fetch(`${RESPOT_URL}/player/pause`, {
			method: "POST"
		})
	}

	async togglePause() {
		await fetch(`${RESPOT_URL}/player/playpause`, {
			method: "POST"
		})

		const status = await this.fetchCurrentStatus();

		if(!status.paused) {
			bar.unpause();
			lyrics.unpause();
		}

		if(status.track) {
			bar.setPosition(status.track.position);
			lyrics.setPosition(status.track.position);
		}
	}
}

export const controller = new LibRespotController();
