export async function fetchLyrics(name: string, artist: string, album: string, duration: number) {
	const url = new URL("https://lrclib.net/api/get");
	url.searchParams.set("track_name", name.replaceAll(" ", "+"));
	url.searchParams.set("artist_name", artist.replaceAll(" ", "+"));
	url.searchParams.set("album_name", album.replaceAll(" ", "+"));
	url.searchParams.set("duration", duration.toString());

	const f = await fetch(url);

	if(!f.ok) return;

	return f.json() as Promise<{ plainLyrics: string }>;

}
