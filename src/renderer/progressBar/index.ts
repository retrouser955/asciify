import { progressBarBox, render } from "../boxes/index.ts";
import chalk from "chalk";
import { systemLoop } from "../systemLoop/index.ts";

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

	pause() {
		this.isRunning = false;
	}

	unpause() {
		this.isRunning = true;
	}

	reset() {
		this.isRunning = false;
		this.duration = 0;
		this.progress = 0;
	}
}

export const bar = new ProgressBar();
