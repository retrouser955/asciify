import blessed from "neo-blessed";

export const screen = blessed.screen({
    smartCSR: true
})

export const render = () => {
    screen.render();
}