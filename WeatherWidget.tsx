import { useEffect, useState } from 'react';
import { Wind, Droplets, Thermometer } from 'lucide-react';

const WMO: Record<number, [string, string]> = {
  0:  ['Clear sky',       '☀️'],
  1:  ['Mostly clear',    '🌤️'],
  2:  ['Partly cloudy',   '⛅'],
  3:  ['Overcast',        '☁️'],
  45: ['Foggy',           '🌫️'],
  48: ['Foggy',           '🌫️'],
  51: ['Light drizzle',   '🌦️'],
  53: ['Drizzle',         '🌦️'],
  55: ['Heavy drizzle',   '🌧️'],
  61: ['Light rain',      '🌧️'],
  63: ['Rain',            '🌧️'],
  65: ['Heavy rain',      '🌧️'],
  71: ['Light snow',      '❄️'],
  73: ['Snow',            '❄️'],
  75: ['Heavy snow',      '❄️'],
  80: ['Rain showers',    '🌦️'],
  81: ['Rain showers',    '🌦️'],
  82: ['Heavy showers',   '⛈️'],
  95: ['Thunderstorm',    '⛈️'],
  96: ['Thunderstorm',    '⛈️'],
  99: ['Thunderstorm',    '⛈️'],
};

function wmo(code: number): [string, string] {
  return WMO[code] ?? ['—', '🌡️'];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeatherWidget() {
  const [data, setData] = useState<{
    temp: number; code: number; humidity: number; wind: number;
    daily: { date: string; code: number; hi: number; lo: number }[];
  } | null>(null);

  useEffect(() => {
    fetch(
      'https://api.open-meteo.com/v1/forecast' +
      '?latitude=30.2944&longitude=-87.6065' +
      '&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min' +
      '&forecast_days=4&temperature_unit=fahrenheit&wind_speed_unit=mph' +
      '&timezone=America%2FChicago'
    )
      .then(r => r.json())
      .then(j => setData({
        temp: Math.round(j.current.temperature_2m),
        code: j.current.weather_code,
        humidity: Math.round(j.current.relative_humidity_2m),
        wind: Math.round(j.current.wind_speed_10m),
        daily: j.daily.time.slice(1, 4).map((d: string, i: number) => ({
          date: d,
          code: j.daily.weather_code[i + 1],
          hi: Math.round(j.daily.temperature_2m_max[i + 1]),
          lo: Math.round(j.daily.temperature_2m_min[i + 1]),
        })),
      }))
      .catch(() => null);
  }, []);

  if (!data) return null;

  const [cond, icon] = wmo(data.code);

  return (
    <div className="weather-strip">
      <div className="weather-current">
        <span className="weather-icon">{icon}</span>
        <div className="weather-main">
          <span className="weather-temp">{data.temp}°F</span>
          <span className="weather-cond">{cond}</span>
        </div>
        <div className="weather-meta">
          <span><Droplets size={13}/> {data.humidity}%</span>
          <span><Wind size={13}/> {data.wind} mph</span>
        </div>
        <div className="weather-place"><Thermometer size={13}/> Orange Beach, AL</div>
      </div>
      <div className="weather-forecast">
        {data.daily.map(d => {
          const day = DAYS[new Date(d.date + 'T12:00:00').getDay()];
          const [, ico] = wmo(d.code);
          return (
            <div key={d.date} className="weather-day">
              <span className="weather-day-name">{day}</span>
              <span className="weather-day-icon">{ico}</span>
              <span className="weather-day-hi">{d.hi}°</span>
              <span className="weather-day-lo">{d.lo}°</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
