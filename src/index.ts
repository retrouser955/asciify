import { startOauthServer } from "./spotify/oauth/index.ts";
import { TokenUtils } from "./spotify/token/persistantTokenUtils.ts";
import { SPOTIFY_STATE } from "./Constants.ts";
import { asciifyConfig } from "./config/index.ts";
import { createRespotInstance, LibRespotController } from "./spotify/librespot/index.ts";
import { saveApiToken } from "./spotify/token/apiToken.ts";
import { Jimp } from "jimp";
import { canvasDisplay, downloadCanvas, mainContent, play, playerBar, render } from "./renderer/index.ts";
import { bufferToAscii } from "./renderer/player/canvasEncoder.worker.ts";
import { fetchCanvas } from "./spotify/metadata/canvas.ts";
import { fetchLyrics } from "./lyrics/index.ts";
import { makeSpotifyRequest } from "./utils/index.ts";
import { transferPlaybackSafe } from "./spotify/playback/index.ts";
import { writeFileSync } from "node:fs";

const tokens = await TokenUtils.load();

if (!tokens) {
    startOauthServer();
    const url = new URL("https://accounts.spotify.com/authorize");
    const search = url.searchParams;

    search.set("response_type", "code");
    search.set("client_id", asciifyConfig.clientId);
    search.set("scope", "user-read-private streaming user-modify-playback-state user-read-playback-state user-read-currently-playing user-read-recently-played");
    search.set("redirect_uri", "http://127.0.0.1:8200/callback");
    search.set("state", SPOTIFY_STATE);

    console.log(`Please go to ${url.toString()} to login and come back. Also, be sure to set the spDcCookie key in asciify.json`);
} else {
    saveApiToken(tokens);

	console.log("🎵 Connecting to Spotify");
    await createRespotInstance();
    const controller = new LibRespotController();

    const { device_id } = await controller.fetchCurrentStatus();

    if(!device_id) {
        throw new Error("Librespot responded differently");
    }
	
	let prevStop: Function | undefined = undefined;

    controller.on("metadata", async (metadata) => {
		if(prevStop) prevStop();
		
		playerBar.setContent(`{bold}${metadata.name}{/bold}\n${metadata.artist_names.join(", ")}`)

        const image = metadata.album_cover_url;
	
		const buffer = await makeSpotifyRequest(image);
		const arrayBuffer = await buffer.arrayBuffer();

        let imageEditor: Awaited<ReturnType<typeof Jimp.read>> | null = await Jimp.read(Buffer.from(arrayBuffer));
        const w = Number(canvasDisplay.width);
		setTimeout(async () => {
			render();

			imageEditor!.resize({
				w,
				h: Math.floor(w / 2)
			});

			const ascii = bufferToAscii(
				w,
				Math.floor(w / 2),
				Buffer.from(imageEditor!.bitmap.data)
			)

			canvasDisplay.setContent(ascii);
		
			render();
			imageEditor = null;

			const canvas = await fetchCanvas(metadata.uri.split(":")[2]);

			if(canvas) {
				const downloadedCanvas = await downloadCanvas(canvas);

				const { stop } = play(downloadedCanvas);
				prevStop = stop;
			}
		}, 0);

		const lyrics = await fetchLyrics(metadata.name, metadata.artist_names[0], metadata.album_name, Math.floor(metadata.duration / 1000));
		
		if(lyrics) {
			mainContent.setContent("");
			lyrics.plainLyrics.split("\n").forEach(v => mainContent.pushLine(v));
			render();
		}
    })
	
	await transferPlaybackSafe(device_id);
	console.clear();	
	render();

    //if(!playbackTransferred.ok) throw new Error("Unable to transfer playback");
}
