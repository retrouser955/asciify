import { progressBarBox, render } from "../boxes/index.ts";
import chalk from "chalk";
import { systemLoop } from "../systemLoop/index.ts";
import { lock } from "../../locks.ts";

class ProgressBar {
	duration = 0;
	progress = 0;
	isRunning = false;

	constructor() {
		systemLoop.pushTask(ProgressBar.name, () => {
			if(this.duration === 0 || !this.isRunning) return;
			if(this.duration <= this.progress) return this.isRunning = false;

			const width = Number(progressBarBox.width);
			const filledAmt = Math.floor((this.progress / this.duration) * width);
			const unfilledAmt = width - filledAmt;
			
			const filledChar = chalk.green("━".repeat(filledAmt)) + chalk.bold("•");
			const unfilledChar = chalk.gray("─".repeat(unfilledAmt));
			
			progressBarBox.setContent(`${filledChar}${unfilledChar}`);
			render();

			this.progress += 200;
		})
	}

	start(duration: number, progress?: number) {
		if(this.isRunning) throw new Error("It is already running");
		this.isRunning = true;
		this.progress = progress || 0;
		this.duration = duration;
	}

	setPosition(position: number) {
		this.progress = position;
	}

	get isPaused() {
		return !this.isRunning && this.duration !== 0;
	}

	async pause() {
		const started = Date.now();
		await lock.acquire("BAR_PAUSE", () => {
			this.isRunning = false;
			const drift = Date.now() - started;
			if(drift > 0) this.setPosition(this.progress + drift)
		})
	}

	async unpause() {
		const started = Date.now();
		await lock.acquire("BAR_PAUSE", () => {
			this.isRunning = true;
			const drift = Date.now() - started;
			if(drift > 0) this.setPosition(this.progress + drift)
		})
	}

	reset() {
		this.isRunning = false;
		this.duration = 0;
		this.progress = 0;
	}
}

export const bar = new ProgressBar();
