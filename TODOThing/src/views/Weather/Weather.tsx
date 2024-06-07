import './Weather.css';
import React, { useEffect, useState } from 'react';
import socket from '../../helpers/WebSocketService';
import { stringToTime, formatDate } from '../../helpers/TimeUtils';
import { iconToColorMap, iconToEmojiMap } from './WeatherMaps';
import { getContrastingTextColor } from '../../helpers/ColorExtractor';
const Weather: React.FC = () => {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [mainColor, setMainColor] = useState('#000000');
  const [fontColor, setFontColor] = useState('#000000');
  const [updateTime, setUpdateTime] = useState<string>();

  const handleWeatherData = (data: any) => {
    setWeatherData(data[0]);
    console.log('Weather', data);
  };
  const handleForecastData = (data: any) => {
    setForecastData(data);
    console.log('Forecast', data);
  };

  useEffect(() => {
    handleGetWeatherData();
    handleGetForecastData();
    const listener = (msg: any) => {
      if (msg.type === 'weather_data') {
        handleWeatherData(msg.data);
      }
      if (msg.type === 'forecast_data') {
        handleForecastData(msg.data);
      }
    };

    socket.addSocketEventListener(listener);

    return () => {
      socket.removeSocketEventListener(listener);
    };
  }, []);

  const getColor = (iconNumber: number): string => {
    const colorVarName = iconToColorMap[iconNumber];
    return `var(${colorVarName})`;
  };

  useEffect(() => {
    if (weatherData && forecastData) {
      const iconNumber = weatherData.WeatherIcon;
      const colorVarName = getColor(iconNumber);
      setMainColor(colorVarName);

      const contrastingColor = getContrastingTextColor(colorVarName);
      setFontColor(contrastingColor);

      const date = stringToTime(weatherData.LocalObservationDateTime);
      const time = formatDate(date);
      setUpdateTime(time);
    }
  }, [weatherData, forecastData]);

  const timeString = (dataString: string) => {
    const date = stringToTime(dataString);
    const time = formatDate(date);
    return time;
  };

  const handleGetWeatherData = (loc_key?: string) => {
    if (socket.is_ready()) {
      const data = { type: 'get', get: 'weather_info', data: { key: loc_key || null } };
      socket.post(data);
    }
  };
  const handleGetForecastData = (loc_key?: string) => {
    if (socket.is_ready()) {
      const data = { type: 'get', get: 'forecast_info', data: { key: loc_key || null } };
      socket.post(data);
    }
  };

  return (
    <div className="view_weather">
      {weatherData ? (
        <div className="weather_container" style={{ backgroundColor: mainColor, color: fontColor }}>
          <div className="weather_info">
            <div className="weather_card">
              {weatherData.PrecipitationType && (
                <div>
                  <p>{'Current Weather: ' + weatherData.PrecipitationType}</p>
                  <p>
                    Past Hour:{' '}
                    {weatherData.Precip1hr.Imperial.Value + weatherData.Precip1hr.Imperial.Unit}
                  </p>
                </div>
              )}
              <p>Humidity: {weatherData.RelativeHumidity}%</p>
              <p>{weatherData.WeatherText}</p>
            </div>
            <div className="weather_card">
              <p>Wind</p>
              <p>Direction: {weatherData.Wind.Direction.English}</p>
              <p>Speed: {weatherData.Wind.Speed.Imperial.Value} MPH</p>
              <p>Gust: {weatherData.WindGust.Speed.Imperial.Value} MPH</p>
            </div>
            <div className="weather_card">
              <p>
                Visibility:{' '}
                {weatherData.Visibility.Imperial.Value + weatherData.Visibility.Imperial.Unit}
              </p>
              <p>
                DewPoint:{' '}
                {weatherData.DewPoint.Imperial.Value + '°' + weatherData.DewPoint.Imperial.Unit}
              </p>
              <p>UVIndex: {weatherData.UVIndex + ' ' + weatherData.UVIndexText}</p>
            </div>
          </div>
          <div className="weather_main">
            <div className="temp_info">
              <h1>
                {weatherData.Temperature.Imperial.Value +
                  '°' +
                  weatherData.Temperature.Imperial.Unit}
              </h1>
              <div className="temp_details">
                <p>
                  ReelFeel{' '}
                  {weatherData.RealFeelTemperature.Imperial.Value +
                    '°' +
                    weatherData.RealFeelTemperature.Imperial.Unit}
                </p>
                <p>
                  Shade{' '}
                  {weatherData.RealFeelTemperatureShade.Imperial.Value +
                    '°' +
                    weatherData.RealFeelTemperatureShade.Imperial.Unit}
                </p>
                <p>
                  Wind{' '}
                  {weatherData.WindChillTemperature.Imperial.Value +
                    '°' +
                    weatherData.WindChillTemperature.Imperial.Unit}
                </p>
              </div>
            </div>
            <div className="forecast_container">
              {Array.isArray(forecastData) &&
                forecastData.map((data: any, index: number) => (
                  <div
                    key={index}
                    className="forecast_card"
                    style={{
                      backgroundColor: `${getColor(data.WeatherIcon)}`,
                      color: getContrastingTextColor(getColor(data.WeatherIcon)),
                    }}
                  >
                    <p>{timeString(data.DateTime)}</p>
                    <p>{data.IconPhrase + iconToEmojiMap[data.WeatherIcon]}</p>
                    <h1>{data.Temperature.Value + '°' + data.Temperature.Unit}</h1>
                    <p>{data.PrecipitationProbability}% Rain</p>
                  </div>
                ))}
            </div>
            <p>Last Updated: {updateTime}</p>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            handleGetWeatherData();
            handleGetForecastData();
          }}
        >
          Get Weather Data
        </button>
      )}
    </div>
  );
};

export default Weather;
