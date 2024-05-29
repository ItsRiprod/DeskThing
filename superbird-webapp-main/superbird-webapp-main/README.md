# `superbird-webapp`

This repo contains the reconstructed source code for the Spotify Car Thing (Superbird)'s frontend webapp. It has been put together using the sourcemaps found on the device's storage. The webapp itself was written with React, TypeScript, MobX, and Sass. 

The reconstruction is not perfect, but it should be pretty close, to the point where you can swap out the original source on the device for the compiled version of this repo and everything acts identically. Notable differences include

- Error reporting with backtrace has been disabled (although that isn't really needed anyway)
- Some of the file structure might not be identical - feel free to improve it with a PR!
- Vite/Rollup is used instead of Webpack due to its easier setup
- The files under `@spotify-internal` have had to be converted to ES modules so they can be imported while not in `node_modules`. The source for most of these modules isn't available unfortunately, so most of the code is in JS instead of TS and seems to have been run through something like Babel

## Usage

To start, you'll need to have a Spotify Car Thing running the latest firmware with ADB enabled. The easiest way to do this is by flashing a new firmware image using the instructions at https://github.com/err4o4/spotify-car-thing-reverse-engineering/issues/22#issue-1432896381. Old versions of the firmware [use a Qt webview](https://github.com/err4o4/spotify-car-thing-reverse-engineering/issues/24) which won't be compatible.

You'll also need to install Node.js and Yarn if you don't already have them, clone the repo, and run `yarn` in the root.

### Development

For quickly testing changes and debugging it's convenient to run the app in a browser on your computer. Running `yarn dev` will start up a dev server which will hot reload when you make changes (no need to refresh the entire page).

In order to run, the webapp needs to be able to communicate with the superbird backend executable over a websocket; forward that port from the device by running `adb forward tcp:8890 tcp:8890`.

### Building

To build the app into the `dist` directory, run `yarn build`. To replace the webapp on your device, run `./push.sh`.