# Superbird Custom Webapp

The spotify car thing runs it's software as a react web app in a QtWebView.
This repo contains some small scripts to temporarily replace the webapp on a spotify car thing with a custom one.
All actions not marked otherwise **should** be temporary, i.e. have no action and leave no trace after a reboot.

> :warning: Warning: **Use at your own risk**

![a spotify car thing showing the text "Congratulations, you are running a custom webapp on your car thing. The current time is 2015-01-01"](example_webapp.jpg)

## Usage

### Preparing your device

Before you can start using this repo, you need to prepare your device using [superbird-bulkcmd](https://github.com/frederic/superbird-bulkcmd).
Perform all steps up to and including [Boot kernel from USB to enable ADB access](https://github.com/frederic/superbird-bulkcmd#boot-kernel-from-usb-to-enable-adb-access).

You need a working `adb` connection to your device.

### Loading a custom build WebApp

Using `scripts/load_webapp.sh`, you can upload a custom webapp to your car thing.

```bash
./scripts/load_webapp.sh PATH_TO_YOUR_WEBAPP [DEVICE_ID]
```

This repo contains an minimal example, which you can start by running

```bash
./scripts/load_webapp.sh example_webapp/
```

If you have multiple adb devices, you can specify the device id of you car thing after the path to the webapp:

```bash
./scripts/load_webapp.sh example_webapp/ 123456
```

### Loading a react based webapp

The `react_webapp` directory contains a small react-based demo app with some helper for properly
using the car thing (buttons, "hey spotify", ...). To build and start it, run

```bash
./scripts/load_react_webapp.sh react_webapp
```

### Restoring the old webapp

You can either just reboot your car thing or run `scripts/restore.sh`:

```bash
./scripts/restore.sh
```

### Dumping the currently active webapp

For dumping the currently active webapp, you can simply use `adb`, no need for a custom script:

```bash
adb pull /usr/share/qt-superbird-app/webapp/ OUTPUT_PATH
```

### Forwarding the websocket from the device

If you want to develop a part of your webapp which needs the control websocket, you can forward it to your computer:

```bash
adb forward tcp:8890 tcp:8890
```

This way you can develop the app on your computer without having to reupload it to your device all the time.

## Internals

The script uploads the webapp to `/tmp/webapp` and bind-mounts it into the place the superbird binary expects it to be (`/usr/share/qt-superbird-app/webapp/`).
It then restarts the superbird serivce using `supervisorctl`
