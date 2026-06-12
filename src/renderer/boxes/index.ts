import blessed from "neo-blessed";
import { controller } from "../../spotify/librespot/index.ts";
import { query } from "../../search/index.ts";

export const screen = blessed.screen({
    smartCSR: true
})

screen.key(['C-c'], () => {
	process.exit(0);
})

screen.key("space", async () => {
	await controller.togglePause();
})

export const progressBarBox = blessed.text({
	width: "40%",
	height: 1,
	top: "95%",
	left: "center"
});

export const mainContent = blessed.box({
    top: "0%",
    left: "0%",
    width: "75%",
    height: "90%",
    border: {
        type: "line",
        fg: 5
    },
	align: "center",
	scrollable: true,
	mouse: true,
	keys: true,
	alwaysScroll: true,
	scrollbar: {
		ch: ' '
	},
	tags: true
});

export const playerBar = blessed.box({
    border: {
        type: "line",
        fg: 5
    },
    top: "90%",
    left: "0%",
    width: "100%",
    height: "10%",
    tags: true,
    valign: "middle"
})

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

export const searchBox = blessed.box({
	width: "60%",
	height: "60%",
	top: "center",
	left: "center",
	label: "Search for a track",
	border: {
		type: "line",
		fg: 5
	}
});

export const list = blessed.list({
	width: "98%",
	height: "100%-5",
	border: {
		type: "line",
		fg: 5
	},
	top: 3,
	scrollable: true,
	alwaysScroll: true,
	tags: true,
	keys: true,
	mouse: true,
	style: {
		selected: {
			bg: "green"
		}
	}
})

export const input = blessed.textbox({
	width: "98%",
	height: 3,
	border: {
		type: "line",
		fg: 5
	},
	inputOnFocus: true,
	keys: true,
	mouse: true
})

searchBox.append(input);
searchBox.append(list);

const listMetaCache = new Map<number, Awaited<ReturnType<typeof query>>['tracks']['items'][0]>();

input.on("submit", async (value: string) => {
	const results = await query(value);
	list.setItems([]);
	let i = 0;
	for(const res of results.tracks.items) {
		const itemInput = `{bold}${res.artists[0].name}{/bold} - ${res.name}`;
		listMetaCache.set(i, res);
		list.addItem(itemInput);
		i++;
	}
	render();
	list.focus();
})

list.on("select", async (_, index) => {
	const item = listMetaCache.get(index);
	if(item) {
		await controller.play(item.uri);
		searchBox.hide();
	} 
})

screen.append(mainContent);
screen.append(canvasDisplay);
screen.append(playerBar);
screen.append(progressBarBox);
screen.append(searchBox);
searchBox.hide();

screen.key("/", () => {
	if(searchBox.hidden) {
		searchBox.show();
		input.clearValue();
		input.focus();
	} else {
		searchBox.hide();
	}
	render();
})

export function render() {
    screen.render();
}
