import blessed from "neo-blessed";

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