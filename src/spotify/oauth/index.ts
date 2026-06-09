import express from "express";
import { CLIENT_BUFFER, SPOTIFY_STATE } from "../../Constants.ts";
import { asciifyConfig } from "../../config/index.ts";
import { TokenUtils } from "../token/persistantTokenUtils.ts";

const app = express();

app.get("/callback", async (req, res) => {
    const code = req.query.code;
    const state = req.query.state;

    if(!code || state !== SPOTIFY_STATE) return res.status(403).send("Not allowed"); // not a valid session

    const tokens = await fetch("https://accounts.spotify.com/api/token", {
        headers: {
            "Authorization": `Basic ${CLIENT_BUFFER}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        method: 'POST',
        body: new URLSearchParams({
            code: code.toString(),
            redirect_uri: "http://127.0.0.1:8200/callback",
            grant_type: "authorization_code"
        })
    })

    const jsonTokens = await tokens.json();

    if(!tokens.ok) return res.status(500).send("something went wrong");

    jsonTokens.expires_in = Date.now() + (jsonTokens.expires_in * 1000);

    await TokenUtils.save(jsonTokens);

    res.send("Go back to the terminal ;)");

    console.log("Authentication successful! Launch asciify again.");
    process.exit(0);
})

export const startOauthServer = () => {
    app.listen(8200, "127.0.0.1");
}