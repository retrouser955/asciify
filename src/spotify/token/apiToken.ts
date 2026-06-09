import { CLIENT_BUFFER } from "../../Constants.ts";
import { TokenUtils, type SpotifyToken } from "./persistantTokenUtils.ts";

let apiTokens: SpotifyToken | undefined = undefined;

export function saveApiToken(token: SpotifyToken) {
    apiTokens = token;
}

export async function getAPITokens() {
    if(!apiTokens) throw new Error("Save it first.");

    if(apiTokens.expires_in > Date.now()) return apiTokens;
    
    const refresh = await fetch("https://accounts.spotify.com/api/token", {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${CLIENT_BUFFER}`
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: apiTokens.refresh_token
        }),
        method: "POST"
    });

    if(!refresh.ok) throw new Error("Unable to refresh tokens");

    const tkn = await refresh.json();
    tkn.expires_in = Date.now() + (tkn.expires_in * 1000);

    apiTokens = tkn as SpotifyToken;

    await TokenUtils.save(apiTokens);

    return apiTokens!;
}