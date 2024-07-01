import './Weather.css';
import React, { useEffect, useState } from 'react';
import socket, { socketData } from '../../helpers/WebSocketService';
import { stringToTime, formatDate } from '../../helpers/TimeUtils';
import { iconToColorMap, iconToEmojiMap } from './WeatherMaps.ts';
import { getContrastingTextColor } from '../../helpers/ColorExtractor';

interface WeatherData {
  [key: string]: string | number | object | undefined;
  WeatherIcon?: number;
  LocalObservationDateTime?: string;
  PrecipitationType?: string;
  Precip1hr?: { Imperial: { Value: number; Unit: string } };
  RelativeHumidity?: number;
  WeatherText?: string;
  Wind?: { Direction: { English: string }; Speed: { Imperial: { Value: number } } };
  WindGust?: { Speed: { Imperial: { Value: number } } };
  Visibility?: { Imperial: { Value: number; Unit: string } };
  DewPoint?: { Imperial: { Value: number; Unit: string } };
  UVIndex?: number;
  UVIndexText?: string;
  Temperature?: { Imperial: { Value: number; Unit: string } };
  RealFeelTemperature?: { Imperial: { Value: number; Unit: string } };
  RealFeelTemperatureShade?: { Imperial: { Value: number; Unit: string } };
  WindChillTemperature?: { Imperial: { Value: number; Unit: string } };
}

interface ForecastData {
  DateTime: string;
  WeatherIcon: number;
  IconPhrase: string;
  Temperature: { Value: number; Unit: string };
  PrecipitationProbability: number;
}

const Weather: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [mainColor, setMainColor] = useState('#000000');
  const [fontColor, setFontColor] = useState('#000000');
  const [updateTime, setUpdateTime] = useState<string>();

  const handleWeatherData = (data: object) => {
    if (Array.isArray(data) && data.length > 0) {
      setWeatherData(data[0]);
    } else {
      console.error('Invalid weather data format:', data);
    }
    //console.log('Weather', data);
  };
  const handleForecastData = (data: object) => {
    if (Array.isArray(data)) {
      setForecastData(data);
    } else {
      console.error('Invalid forecast data format:', data);
    }
    //console.log('Forecast', data);
  };

  useEffect(() => {
    handleGetWeatherData();
    handleGetForecastData();
    const listener = (msg: socketData) => {
      if (msg.type === 'weather_data' && typeof msg.data === 'object') {
        handleWeatherData(msg.data as WeatherData[]);
      }
      if (msg.type === 'forecast_data' && Array.isArray(msg.data)) {
        handleForecastData(msg.data as ForecastData[]);
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
      let colorVarName
      if (typeof iconNumber === 'number') {
        colorVarName = getColor(iconNumber);
        setMainColor(colorVarName);
      }

      const contrastingColor = getContrastingTextColor(colorVarName);
      setFontColor(contrastingColor);
      const timeString = weatherData.LocalObservationDateTime
      const date = stringToTime(typeof timeString === 'string' && timeString);
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
      console.log('Sending Get Forecast Data');
      const data = { app: 'weather', type: 'get', request: 'weather_info', data: { key: loc_key || null } };
      socket.post(data);
    }
  };
  const handleGetForecastData = (loc_key?: string) => {
    if (socket.is_ready()) {
      console.log('Sending Get Forecast Data');
      const data = { app: 'weather', type: 'get', request: 'forecast_info', data: { key: loc_key || null } };
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
                forecastData.map((data: ForecastData, index: number) => (
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
            <p>Last Weather Update: {updateTime}</p>
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
