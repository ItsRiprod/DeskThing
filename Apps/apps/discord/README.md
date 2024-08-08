# The DeskThing ✔️
> Version 0.5 Alpha

Add "Discord" to "modules" array in `/app_config.json` to enable app
## ✨What It Does

The Discord App will connect to your Discord Account and work as a mini HUD for your activity

- Show current call status (participants, who's talking, who's muted)
- Set discord rich presence to whatever you want (Second About Me?)
- ~~Allow you to mute/unmute/deafen/disconnect~~
- ~~Allow you to see a preview of DMs sent to you~~
- ~~Allow you to mix other user's volumes~~

> *This is under constant development, so features will come as soon as i can make them. Suggestions welcome!*

## ▶️How It Does It

### Discord app

Links:
- [Discord developer dashboard](https://discord.com/developers/applications)

Support:
- Windows (Tested)
- Linux (Tested)
- Mac (Untested)

Process:
- Go to the developer dashboard and click 'New Application' (Name it whatever you want)
- Go to OAuth2 and generate a new secret (You may have to click Reset Secret):
![Discord key, secret, and redirect url](/readme_images/discord_keys.png)
> ⚠️Ensure the redirect url `http://localhost:8888/discord/callback` matches the one in the `.env` file exactly⚠️
- Add DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET to `.env` file using the template in [additional resources](#-additional-resources)
- Click 'rich presence' and add two images that have the file name 'emoji_large' and 'emoji_small'
![Discord rich presence](/readme_images/discord_status.png)
*bread for reference*
> These names must match the names in `/DeskThing/server/discordHandler.js` under the function `setActivity` largeImageKey and smallImageKey. Update this activity to whatever you want using the Visualizer


## 📗 Additional Resources


## .env file reference
- **.env file reference for `/DeskThing/server/.env`**
```env
# Discord app information
DISCORD_CLIENT_ID= # Discord bot ID
DISCORD_CLIENT_SECRET= # Discord bot Secret
DISCORD_REDIR_URI=http://localhost:8888/discord/callback
DISCORD_USER_ID= # Discord user id (yours)
```

- If you are running from a .bat file, this is what it should look like:
```sh
@echo off

cd /d "C:\*Path to car thing files*\carthing\DeskThing\"

set DISCORD_CLIENT_ID= // Discord bot id
set DISCORD_CLIENT_SECRET= // Discord bot secret
set DISCORD_REDIR_URI=http://localhost:8888/discord/callback
set DISCORD_USER_ID= // Your user ID

# Rest of bat file
```

## 🤖 Linux Mods

Change your launch file to include the following:
```sh
#!/bin/bash

# Change directory to the car thing files location
cd "/path/to/carthing/DeskThing/"

export DISCORD_CLIENT_ID= # Discord bot id
export DISCORD_CLIENT_SECRET= # Discord bot secret
export DISCORD_REDIR_URI=http://localhost:8888/discord/callback
export DISCORD_USER_ID= # Your user ID

# Rest of file
```

### Discord Flatpak work around

If you are encountering an error `reject(new Error('Could not connect'));` then try the following found [here](https://github.com/flathub/com.discordapp.Discord/wiki/Rich-Precense-(discord-rpc))

Run the following:
```sh
mkdir -p ~/.config/user-tmpfiles.d
echo 'L %t/discord-ipc-0 - - - - app/com.discordapp.Discord/discord-ipc-0' > ~/.config/user-tmpfiles.d/discord-rpc.conf
systemctl --user enable --now systemd-tmpfiles-setup.service
```
