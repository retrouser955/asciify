import { screen, mainContent, playerBar, canvasDisplay, render } from "./renderer";

// create a general layout
screen.append(mainContent);
screen.append(playerBar);
screen.append(canvasDisplay);
render();