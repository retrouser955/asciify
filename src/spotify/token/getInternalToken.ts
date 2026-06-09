import { asciifyConfig } from "../../config/index.ts";
import { type AnonTokenData, grabSpotifyToken } from "./grabSpotifyToken.ts";

let internalTokens: AnonTokenData | undefined = undefined;

export async function getInternalToken() {
    if(internalTokens && internalTokens.tokens.accessTokenExpirationTimestampMs < Date.now()) return internalTokens;
    const spDc = asciifyConfig.spDcCookie;

    internalTokens = await grabSpotifyToken(spDc, internalTokens?.secrets);

    return internalTokens;
}
