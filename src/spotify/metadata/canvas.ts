import { getInternalToken } from "../token/getInternalToken.ts";
import { CANVAS_SHA, PATH_FINDER_URL } from "../../Constants.ts";

export type CanvasData = {
    data?: {
        trackUnion?: {
            canvas?: {
                url?: string
            }
        }
    }
}

export async function fetchCanvas(trackId: string) {
    const internalTokens = await getInternalToken();
    const spotifyTrackUri = `spotify:track:${trackId}`;

    const headers = {
        "authorization": `Bearer ${internalTokens.tokens.accessToken}`,
        "client-token": internalTokens.clientToken,
        "app-platform": "WebPlayer",
        "Accept": "application/json",
        "Accept-Language": "en",
        "Content-Type": "application/json;charset=UTF-8",
        "Origin": "https://open.spotify.com",
        "Referrer": "https://open.spotify.com/",
        "Priority": "u=4",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site",
        "spotify-app-version": internalTokens.clientVersion,
        "TE": "traliers",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0"
    }

    const request = await fetch(PATH_FINDER_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
            "operationName": "canvas",
            "variables": {
                "trackUri": spotifyTrackUri
            },
            "extensions": {
                "persistedQuery": {
                    "version": 1,
                    "sha256Hash": CANVAS_SHA
                }
            }
        })
    })

    if(!request.ok) return undefined;
    
    const json = await request.json() as CanvasData;

    return json.data?.trackUnion?.canvas?.url
}
