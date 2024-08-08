# The DeskThing ✔️
> Version 1.5 Beta

Add "Weather" to "modules" array in `/app_config.json` to enable app
---

## ✨What It Does

The Weather App will show the 12 hour forecast and current weather of where you are!

- Current Weather Temperature
- Current Real Feel, Shade, and Wind temperature
- Current wind speed + direction + gust speed
- Current UV index + DewPoint + AQI
- Humidity
- 12 hour forecast
- Current weather conditions
> *This is under constant development, so features will come as soon as i can make them. Suggestions welcome!*

## ▶️How It Does It

## Accuweather App

Links:
- [Accuweather Developer Dashboard](https://developer.accuweather.com/)
- [Accuweather Location API](https://developer.accuweather.com/accuweather-locations-api/apis/get/locations/v1/cities/search)

Process:
- Go to Accuweather Developer Dashboard and login
- Click 'my apps' and click '+ Add a new app'
- Fill out the information
![Accuweather Instructions](/readme_images/accuweather.png)
> Specifics here do not matter. You just need the app
- Get the API Key
![Accuweather API Instructions](/readme_images/accuweather_api.png)
- Go to accuweather location api and add your key there
![Accuweather Location Instructions](/readme_images/accuweather_location1.png)
- Get your city id

![Accuweather Location Instructions](/readme_images/accuweather_location2.png)
- Add your ACCUWEATHER_API_KEY and ACCUWEATHER_CITY (Location id) to your `.env` file using the template in [additional resources](#-additional-resources)


---
## 📗 Additional Resources

## .env file reference
- **.env file reference for `/DeskThing/server/.env`**
```env
ACCUWEATHER_API_KEY= // Key obtained from AccuWeather app
ACCUWEATHER_CITY= // City key obtained from AccuWeather api
```

- If you are running from a .bat file, this is what it should look like:
```sh
@echo off

cd /d "C:\*Path to car thing files*\carthing\DeskThing\"

set ACCUWEATHER_API_KEY= // Key obtained from AccuWeather app
set ACCUWEATHER_CITY= // City key obtained from AccuWeather app

# Rest of file
```

## 🤖 Linux Mods

Change your launch file to include the following: 
```sh
#!/bin/bash

# Change directory to the car thing files location
cd "/path/to/carthing/DeskThing/"


export ACCUWEATHER_API_KEY= # Key obtained from AccuWeather app
export ACCUWEATHER_CITY= # City key obtained from AccuWeather app

# Rest of file
```
