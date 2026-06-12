import { SPOTIFY_API_ENDPOINTS } from "../Constants.ts";
import { makeSpotifyAPIRequest } from "../utils/index.ts";
// import { lock } from "../locks.ts";

export async function query(name: string) {
	const endpoint = new URL(SPOTIFY_API_ENDPOINTS.SEARCH);
	endpoint.searchParams.set("q", name);
	endpoint.searchParams.set("type", "track");
	endpoint.searchParams.set("limit", "10");

	const results = await makeSpotifyAPIRequest(endpoint);

	if(!results.ok) throw new Error("Unable to fetch");

	return await results.json() as {
		tracks: {
			items: {
				name: string;
				uri: string;
				artists: {
					name: string;
				}[]
			}[]
		}
	}
}
