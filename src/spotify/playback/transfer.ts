import { writeFileSync } from "node:fs";
import { SPOTIFY_API_ENDPOINTS } from "../../Constants.ts";
import { makeSpotifyAPIRequest } from "../../utils/index.ts";
import { setTimeout } from "node:timers/promises";

async function pollSpotifyDevices(): Promise<{ id: string }[]> {
	const req = await makeSpotifyAPIRequest(SPOTIFY_API_ENDPOINTS.GET_PLAYBACK_DEVICES);

	if(!req.ok) throw new Error("Could not fetch devices");

	return (await req.json()).devices;
}

export async function transferPlaybackSafe(deviceId: string) {
	console.log("🔃 Authenticated Login5 with Spotify. Attempting to transfer Playback ...");
	const maxAttempts = 5;
	let attempt = 1;
	for(attempt = 1; attempt <= maxAttempts; attempt++) {
		const devices = await pollSpotifyDevices();
		
		const isDeviceFound = devices.find(v => v.id === deviceId);

		if(isDeviceFound) break;
		console.log(`🔍 Device not found. Retrying in ${attempt * 500}ms`);
		await setTimeout(attempt * 500);
	}

	if(attempt === maxAttempts) {
		throw new Error("Max attempts reached");
	}

	const transferred = await makeSpotifyAPIRequest(SPOTIFY_API_ENDPOINTS.TRANSFER_PLAYBACK, {
		body: JSON.stringify({
			"device_ids": [deviceId],
			"play": false
		}),
		headers: {
			"Content-Type": "application/json"
		},
		method: "PUT"
	});
	
	if(transferred.status === 500) return;

	if(!transferred.ok) throw new Error("Could not transfer Playback");
}
