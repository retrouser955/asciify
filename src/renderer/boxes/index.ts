import blessed from "neo-blessed";

export const screen = blessed.screen({
    smartCSR: true
})

screen.key(['C-c'], () => {
	process.exit(0);
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
	}
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

screen.append(mainContent);
screen.append(canvasDisplay);
screen.append(playerBar);
screen.append(progressBarBox);

export const render = () => {
    screen.render();
}
