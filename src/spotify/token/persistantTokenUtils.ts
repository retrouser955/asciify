import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const PATH = path.join(import.meta.dirname, "..", "..", ".cache", "spotify-cache.json");
const DIR = path.join(import.meta.dirname, "..", "..", ".cache");

export interface SpotifyToken {
    access_token: string;
    token_type: "Bearer";
    scaope: string;
    expires_in: number;
    refresh_token: string;
}

async function save(token: SpotifyToken) {
    if(!existsSync(DIR)) await fs.mkdir(DIR, { recursive: true });

    await fs.writeFile(PATH, JSON.stringify(token));
}

async function load() {
    if(!existsSync(DIR)) {
        await fs.mkdir(DIR, { recursive: true });
        return;
    }

    if(!existsSync(PATH)) return;

    try {
        const tokens = await fs.readFile(PATH, "utf8");
        const tokensParsed = JSON.parse(tokens);

        if(tokensParsed && tokensParsed.access_token && tokensParsed.refresh_token) return tokensParsed as SpotifyToken;
        return;
    } catch {
        return undefined;
    }
}

export const TokenUtils = { save, load } as const;
export type TokenUtils = (typeof TokenUtils)[keyof typeof TokenUtils];