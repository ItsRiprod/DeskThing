# The DeskThing ✔️
> Version 1.5 Beta

Add "Trello" to "modules" array in `/app_config.json` to enable app
> Not on windows? [Linux Modifications](#-linux-mods)
---

## ✨What It Does

The Trello App is a simple interface to see your TODO list on!

- Get Trello Organizations
- Get Trello Boards
- Get Trello Lists
- Get Trello Cards
- Get Trello tags on cards
- Set a list as favorite (shortcut to there)
- ~~Add "finished" tag to cards on click~~
> *This is under constant development, so features will come as soon as i can make them. Suggestions welcome!*

## ▶️How It Does It

## Trello App

Links:
- [Trello Admin](https://trello.com/power-ups/admin/)
- [Glitch App](https://glitch.com/~trello-power-up)

Support:
- Windows (Tested)
- Linux (Untested)
- Mac (Untested)

Process:
- Go to the Trello Admin page and click the blue 'New' (keep this page open)
- Go to Glitch App and click 'Remix your own' (you may have to make an account)
- Once you see your project, click 'share' and then copy 'live site'
![Trello Glitch Instructions](/readme_images/trello_glitch.png)
- Go back to the Trello Admin Page and paste this link into 'iFrame connector URL'
- Fill out the rest of the information and click 'create'
- Go to the app dashboard and click 'API key' to the left (You may have to generate something here)
- Add an Allowed Origin 'http://localhost:8888' (Ensure this matches your .env callback)
![Trello API Instructions](/readme_images/trello_api.png)
- Add TRELLO_KEY and TRELLO_SECRET into your `.env` file using the template in [additional resources](#-additional-resources)


---
## 📗 Additional Resources

## .env file reference
- **.env file reference for `/DeskThing/server/.env`**
```env
TRELLO_REDIRECT_URI=http://localhost:8888/trello/callback
TRELLO_KEY= // Trello bot key
TRELLO_SECRET= // Trello bot secret
```

- If you are running from a .bat file, this is what it should look like:
```sh
@echo off

cd /d "C:\*Path to car thing files*\carthing\DeskThing\"

set TRELLO_TOKEN= // Trello bot token
set TRELLO_KEY= // Trello bot key
set TRELLO_SECRET= // Trello bot secret

# Rest of file
```

## 🤖 Linux Mods

Change your launch file to include the following: 
```sh
#!/bin/bash

# Change directory to the car thing files location
cd "/path/to/carthing/DeskThing/"

export TRELLO_TOKEN= # Trello bot token
export TRELLO_KEY= # Trello bot key
export TRELLO_SECRET= # Trello bot secret
# Rest of file
```