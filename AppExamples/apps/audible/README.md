# Audible APP Install:
> Version 0.1 Alpha

Add "Audible" to "modules" array in `/app_config.json` to enable app
## ✨What It Does

The Audible App will connect to the Audible API to retrieve information regarding your account

- Get your audible audiobooks right from the CT!
- ~~Media Controls~~
- ~~Live progress~~

> *This is under constant development, so features will come as soon as i can make them. Suggestions welcome!*

## ▶️How It Does It

### Audible App

Links:
- 

Support:
- Windows (Tested)
- Linux (Untested)
- Mac (Untested)

Process:
- Ensure python is installed along with pip
- run `pip install -r /server/apps/audible/requirements.txt`

## 📗 Additional Resources


## .env file reference
- **.env file reference for `/DeskThing/server/.env`**
```env
# Audible login information (Just like your normal audible login)
AUDIBLE_EMAIL= # Make this your Amazon or Audible email
AUDIBLE_PASSWORD= # make this your password you use
AUDIBLE_COUNTRY_CODE=us # Set this to your country code (in lower case)
AUDIBLE_PORT=8892 # This is the port that the py helper service runs on (dont change unless you know what you're doing)
```

- If you are running from a .bat file, don't forget to include the following lines:
```sh
@echo off

cd /d "C:\*Path to car thing files*\carthing\DeskThing\"

set AUDIBLE_EMAIL= # Make this your Amazon or Audible email
set AUDIBLE_PASSWORD= # make this your password you use
set AUDIBLE_COUNTRY_CODE=us 
set AUDIBLE_PORT=8892 

# Rest of bat file
```

## 🤖 Linux-Specific changes:

Change your launch file to include the following: 
```sh
#!/bin/bash

# Change directory to the car thing files location
cd "/path/to/carthing/DeskThing/"

export AUDIBLE_EMAIL= # Make this your Amazon or Audible email
export AUDIBLE_PASSWORD= # make this your password you use
export AUDIBLE_COUNTRY_CODE=us 
export AUDIBLE_PORT=8892 

# Rest of file
```