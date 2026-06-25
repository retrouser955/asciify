import { fetchLyrics, findNearestLyrics } from "../../lyrics/index.ts";
import { systemLoop } from "../systemLoop/index.ts";
import { mainContent, render } from "../boxes/index.ts";
import { lock } from "../../locks.ts";

export class Lyrics {
	progress = 0;
	isRunning = false;
	lyrics?: Map<number, string>;

	constructor() {
		systemLoop.pushTask(Lyrics.name, () => {
			if(!this.isRunning || !this.lyrics || this.lyrics.size === 0) return;
			this.progress += 200;
			const currentLyrics = findNearestLyrics(this.lyrics, this.progress);
			if(!currentLyrics) return;
			const allLyrics = this.lyrics.entries().toArray();
			const lyricsIndex = allLyrics.findIndex(([k, v]) => k === currentLyrics.timestamp && v === currentLyrics.line);
			if(lyricsIndex === -1) return;
			const finalLyrics: string[] = [];
			
			allLyrics.forEach((_, i) => {
				if(i === lyricsIndex) {
					finalLyrics.push(`{bold}{green-fg}${allLyrics[i][1]}{/green-fg}{/bold}`);
				} else {
					finalLyrics.push(`{gray-fg}${allLyrics[i][1]}{/gray-fg}`);
				}
			});

			const allLyricsJoined = finalLyrics.join("\n");
			mainContent.setContent(allLyricsJoined);
			render();
		})
	}

	get isPaused() {
		return this.lyrics && !this.isRunning;
	}

	static async fetchLyrics(name: string, artist: string, album: string, duration: number) {
		return fetchLyrics(name, artist, album, duration);
	}

	start(lyrics: Map<number, string>, pos?: number) {
		if(this.isRunning) return;
		const l = lyrics.values()
			.map(v => `{gray-fg}${v}{/gray-fg}`)
			.toArray()
			.join("\n")

		mainContent.setContent(l);
		render();
		this.progress = pos || 0;
		this.isRunning = true;
		this.lyrics = lyrics;
	}

	setPosition(pos: number) {
		this.progress = pos;
	}

	async pause() {
		const started = Date.now();
		await lock.acquire("LYRICS_PAUSE", () => {
			this.isRunning = false;
			const drift = Date.now() - started;
			if(drift > 0) this.setPosition(this.progress + drift)
		})
	}

	async unpause() {
		const started = Date.now();
		await lock.acquire("LYRICS_PAUSE", () => {
			this.isRunning = true;
			const drift = Date.now() - started;
			if(drift > 0) this.setPosition(this.progress + drift)
		})
	}

	reset() {
		this.isRunning = false;
		this.lyrics = undefined;
		this.progress = 0;
	}
}

export const lyrics = new Lyrics();
