export async function fetchLyrics(name: string, artist: string, album: string, duration: number) {
	const url = new URL("https://lrclib.net/api/get");
	url.searchParams.set("track_name", name.replaceAll(" ", "+"));
	url.searchParams.set("artist_name", artist.replaceAll(" ", "+"));
	url.searchParams.set("album_name", album.replaceAll(" ", "+"));
	url.searchParams.set("duration", duration.toString());

	const f = await fetch(url);

	if(!f.ok) return;

	return f.json() as Promise<{ plainLyrics: string, syncedLyrics?: string }>;
}

// Thank you discord-player
const lyricsMatchPattern = /\[(\d{2}):(\d{2})\.(\d{2})\]/;

export function parseSyncedLyrics(lyrics: string) {
	const mappedLyrics = new Map<number, string>();

	const lines = lyrics.split("\n");
	for(const line of lines) {
		const match = lyrics.match(lyricsMatchPattern);

		if(match) {
			const [, minutes, seconds, ms] = match;
			const timestamp = 
				parseInt(minutes) * 60 * 1000 +
				parseInt(seconds) * 1000 +
				parseInt(ms)

			mappedLyrics.set(timestamp, line.replace(lyricsMatchPattern, "").trim())
		}
	}

	return mappedLyrics;
}

export function findNearestLyrics(lyrics: Map<number, string>, timestamp: number) {
	if(lyrics.has(timestamp)) return { timestamp, line: lyrics.get(timestamp)! };

	const keys = Array.from(lyrics.keys());

	const closest = keys.reduce((a, b) =>
		Math.abs(b - timestamp) < Math.abs(a - timestamp) ? b : a
	)

	if (closest > timestamp) return null;

	if (Math.abs(closest - timestamp) > 2000) return null;

	const line = lyrics.get(closest);
	if(!line) return null;

	return {
		timestamp: closest,
		line
	}
}
