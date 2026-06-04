import { USER_AGENT } from "../Constants";

export function makeSpotifyRequest(...args: Parameters<typeof fetch>) {
    if(!args[1]) args[1] = {};
    if(!args[1].headers) args[1].headers = {};

    (args[1].headers as Record<string, unknown>)['User-Agent'] = USER_AGENT;

    return fetch(...args);
}