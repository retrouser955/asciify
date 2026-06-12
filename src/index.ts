import { startOauthServer } from "./spotify/oauth/index.ts";
import { TokenUtils } from "./spotify/token/persistantTokenUtils.ts";
import { SPOTIFY_STATE } from "./Constants.ts";
import { asciifyConfig } from "./config/index.ts";
import { createRespotInstance, controller } from "./spotify/librespot/index.ts";
import { saveApiToken } from "./spotify/token/apiToken.ts";
import { Jimp } from "jimp";
import { canvasDisplay, downloadCanvas, mainContent, play, playerBar, render } from "./renderer/index.ts";
import { bufferToAscii } from "./renderer/player/canvasEncoder.worker.ts";
// import { fetchCanvas } from "./spotify/metadata/canvas.ts";
// import { fetchLyrics } from "./lyrics/index.ts";
// import { makeSpotifyRequest } from "./utils/index.ts";
import { transferPlaybackSafe } from "./spotify/playback/index.ts";
import { bar } from "./renderer/progressBar/index.ts";
import { systemLoop } from "./renderer/systemLoop/index.ts";
import { makeSpotifyRequest } from "./utils/index.ts";
import { fetchCanvas } from "./spotify/metadata/canvas.ts";
import { Lyrics, lyrics } from "./renderer/lyrics/index.ts";
import { parseSyncedLyrics } from "./lyrics/index.ts";
import { logger } from "./log/index.ts";
import { lock } from "./locks.ts";
// import { Logger } from "./log/index.ts";

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

    const { device_id } = await controller.fetchCurrentStatus();

    if(!device_id) {
        throw new Error("Librespot responded differently");
    }

	controller.createSocketServer();

	let currentlyPlaying = "";
	let prevStop: Function | undefined = undefined;
	
	controller.on("seek", (seekEv) => {
		bar.setPosition(seekEv.position);
		lyrics.setPosition(seekEv.position);
	})

	controller.on("playing", async (ctx) => {
		logger.log("Got event playing", ctx);
		if(bar.isPaused && ctx.resume) {
			bar.unpause();
			lyrics.unpause();
			return;
		};

		bar.reset();

		const status = await controller.fetchCurrentStatus();
		
		if(!status.track) return;

		if(currentlyPlaying === status.track.uri) return;

		if(!bar.isRunning) bar.start(status.track.duration, status.track.position);

		currentlyPlaying = status.track.uri;

		playerBar.setContent(`{bold}${status.track.name}{/bold}\n${status.track.artist_names.join(", ")}`);
		;(async () => {
			const started = Date.now();
			await lock.acquire("LYRICS_RENDER", async () => {
				lyrics.reset();
				const lyricsRes = await Lyrics.fetchLyrics(status.track!.name, status.track!.artist_names[0], status.track!.album_name, Math.floor(status.track!.duration / 1000));

				if(!lyricsRes) return;
				if(!lyricsRes.syncedLyrics) {
					mainContent.setContent(lyricsRes.plainLyrics);
					render();
				} else {
					const parsed = parseSyncedLyrics(lyricsRes.syncedLyrics);
					lyrics.start(parsed, status.track!.position + (Date.now() - started));
				}
			})
		})();
		render();
	
		await lock.acquire("CANVAS_RENDERER", async () => {
			if(!status.track) return;
			if(prevStop) {
				prevStop();
				prevStop = undefined;
			};
			const image = status.track.album_cover_url;

			const buffer = await makeSpotifyRequest(image);
			const arrayBuffer = await buffer.arrayBuffer();

			let imageEditor: Awaited<ReturnType<typeof Jimp.read>> | null = await Jimp.read(Buffer.from(arrayBuffer));
			const w = Number(canvasDisplay.width);

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

			if(asciifyConfig?.application?.canvas === false) return;

			const canvas = await fetchCanvas(status.track.uri.split(":")[2]);

			try {
				if(canvas) {
					const downloaded = await downloadCanvas(canvas);
				
					const { stop } = play(downloaded);
					prevStop = stop;
				}
			}catch {
				// no-op
			}
		});
	});

	controller.on("paused", (ctx) => {
		bar.pause();
		logger.log("Got event paused", ctx);
		lyrics.pause();
	});

	controller.on("not_playing", (ctx) => {
		bar.reset();
		logger.log("Got event not playing", ctx);
		lyrics.reset();
	});	
	
	await transferPlaybackSafe(device_id);
	console.clear();	
	render();
	systemLoop.startLoop();
}
