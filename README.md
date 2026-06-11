# AsciiFy

AsciiFy is a Spotify player TUI written in NodeJS using librespot as a backend. It allows you to play spotify audio right in the terminal while keeping the ASCII look for image.

# Features

- Full Spotify player in the terminal
- Support album art in ASCII format
- Play ASCII based Spotify Canvas videos

# Requirements

1. You must download a binary from https://github.com/devgianlu/go-librespot/ and put it in `src/spotify/go/librespot`. Be sure to name it `go-librespot`.
2. You must install [`ffmpeg`](https://ffmpeg.org/download.html)
3. You must have an sp_dc cookie. You can get this by visiting the [Spotify](https://open.spotify.com) site, logging in and checking the cookies tab on inspect element.
4. You must have a Spotify application. You can get this through going to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and creating one.

# Setting up

1. Clone this repository by using `git clone https://github.com/retrouser955/asciify`
2. cd into the created folder and run `./src/spotify/golibrespot/go-librespot --config_dir ./src/spotify/golibrespot/config`. This will allow you to login. You can press `Ctrl + \` in your terminal after logging in. Do not worry about the error message.
3. You can then fill out all the details in `./asciify.example.json` and rename it `./asciify.json`
4. Run `node .`. You can alias this in your `.bashrc` if you want to install it globally
5. Follow the instructions on the console
6. Run `node .` again after following the instructions
