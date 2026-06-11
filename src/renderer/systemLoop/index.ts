export class SystemLoop {
	private interval: NodeJS.Timeout | null = null;
	private tasks: Map<string, Function> = new Map();

	startLoop() {
		this.interval = setInterval(() => {
			for(const task of this.tasks.values()) {
				task()
			}
		}, 200);
	}

	stopLoop() {
		if(this.interval) {
			clearInterval(this.interval);
			this.interval = null;
			return true;
		}

		return false;
	}

	pushTask(id: string, task: Function) {
		this.tasks.set(id, task);
	}

	popTask(id: string) {
		return this.tasks.delete(id);
	}
}

export const systemLoop = new SystemLoop();
