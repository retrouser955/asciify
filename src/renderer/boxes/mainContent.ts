import blessed from "neo-blessed";

export const mainContent = blessed.box({
    top: "0%",
    left: "0%",
    width: "75%",
    height: "90%",
    border: {
        type: "line",
        fg: 5
    }
});