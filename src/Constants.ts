import crypto from "node:crypto";
import { asciifyConfig } from "./config/index.ts";

export const SPOTIFY_STATE = crypto.randomBytes(16).toString("hex");
export const USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0";
export const CANVAS_DISPLAY_FPS = 10;
export const PATH_FINDER_URL = "https://api-partner.spotify.com/pathfinder/v2/query";
export const CANVAS_SHA = "575138ab27cd5c1b3e54da54d0a7cc8d85485402de26340c2145f0f6bb5e7a9f";
export const CLIENT_BUFFER = Buffer.from(`${asciifyConfig.clientId}:${asciifyConfig.clientSecret}`).toString("base64");

// Spotify Endpoint
export const SPOTIFY_API_ENDPOINTS = {
	GET_PLAYBACK_DEVICES: "https://api.spotify.com/v1/me/player/devices",
	TRANSFER_PLAYBACK: "https://api.spotify.com/v1/me/player",
	SEARCH: "https://api.spotify.com/v1/search"
}
