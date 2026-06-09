import { USER_AGENT } from "../Constants.ts";
import { getAPITokens } from "../spotify/token/apiToken.ts";

export function makeSpotifyRequest(...args: Parameters<typeof fetch>) {
	const headers = {
		"Referrer": "https://open.spotify.com/",
		"Origin": "https://open.spotify.com",
		"User-Agent": USER_AGENT
	}

    return fetch(args[0], {
		...args[1],
		headers: {
			...headers,
			...args[1]?.headers
		}
	});
}

export async function makeSpotifyAPIRequest(...args: Parameters<typeof fetch>) {
	const tokens = await getAPITokens();

	const headers = {
		"Authorization": `Bearer ${tokens.access_token}`
	}

	return fetch(args[0], {
		...args[1],
		headers: {
			...headers,
			...args[1]?.headers
		}
	})
}
