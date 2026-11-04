import type { WeatherData } from "../types/weather";

function showNumber(value: number | null) {
  return value === null ? "N/A" : Math.round(value);
}

export default function WeatherDashboard({ weather }: { weather: WeatherData }) {
  const temperatureUnit = weather.units === "us" ? "°F" : "°C";
  const windUnit = weather.units === "us" ? "mph" : "km/h";

  return (
    <section>
      <h2>{weather.location}</h2>
      <h3>Current Weather</h3>
      {weather.current ? (
        <div className="current-weather">
          <p>Temperature: {showNumber(weather.current.temp)} {temperatureUnit}</p>
          <p>Feels like: {showNumber(weather.current.feelslike)} {temperatureUnit}</p>
          <p>Conditions: {weather.current.conditions}</p>
          <p>Humidity: {showNumber(weather.current.humidity)}%</p>
          <p>Wind speed: {showNumber(weather.current.windspeed)} {windUnit}</p>
        </div>
      ) : (
        <p>Current weather is unavailable for this location.</p>
      )}

      <h3>Seven-Day Forecast</h3>
      <div className="forecast">
        {weather.days.slice(0, 7).map((day) => (
          <article className="forecast-day" key={day.datetime}>
            <h4>{day.datetime}</h4>
            <p>{day.conditions}</p>
            <p>High: {showNumber(day.tempmax)} {temperatureUnit}</p>
            <p>Low: {showNumber(day.tempmin)} {temperatureUnit}</p>
            <p>Precipitation: {showNumber(day.precipprob)}%</p>
          </article>
        ))}
      </div>
    </section>
  );
}
