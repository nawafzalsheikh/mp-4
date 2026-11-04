"use client";

import { useState } from "react";
import WeatherDashboard from "../components/WeatherDashboard";
import type { Units, WeatherData, WeatherErrorResponse } from "../types/weather";

export default function HomePage() {
  const [city, setCity] = useState("");
  const [units, setUnits] = useState<Units>("us");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function getWeather(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!city.trim()) {
      setError("Please enter a city.");
      return;
    }

    setLoading(true);
    setError("");
    setWeather(null);

    try {
      const query = new URLSearchParams({ city: city.trim(), units });
      const response = await fetch(`/api/weather?${query}`, {
        signal: AbortSignal.timeout(20000),
      });
      const data: WeatherData | WeatherErrorResponse = await response.json();

      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Could not get weather.");
      }

      setWeather(data);
    } catch (error) {
      if (error instanceof DOMException) {
        setError("The request took too long. Please try again.");
      } else {
        setError(error instanceof Error ? error.message : "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1>Weather App</h1>
      <p>Enter a city to see the current weather and a seven-day forecast.</p>

      <form onSubmit={getWeather}>
        <label htmlFor="city">City</label>
        <input
          id="city"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="Boston, MA"
          maxLength={120}
          disabled={loading}
        />

        <label htmlFor="units">Units</label>
        <select
          id="units"
          value={units}
          onChange={(event) => setUnits(event.target.value as Units)}
          disabled={loading}
        >
          <option value="us">Fahrenheit</option>
          <option value="metric">Celsius</option>
        </select>

        <button type="submit" disabled={loading}>Get Weather</button>
      </form>

      {loading && <p role="status">Loading weather...</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {weather && <WeatherDashboard weather={weather} />}
    </>
  );
}
