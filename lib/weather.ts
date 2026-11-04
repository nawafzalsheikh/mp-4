import type { Units, WeatherData, WeatherDay } from "../types/weather.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function number(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

// Send only fields the interface uses, never the entire upstream response.
export function normalizeWeather(value: unknown, units: Units): WeatherData {
  if (!isRecord(value) || !text(value.resolvedAddress) || !Array.isArray(value.days) || value.days.length === 0) {
    throw new Error("Invalid weather response");
  }

  const days: WeatherDay[] = value.days.slice(0, 7).map((day: unknown) => {
    if (!isRecord(day) || !/^\d{4}-\d{2}-\d{2}$/.test(text(day.datetime))) {
      throw new Error("Invalid forecast day");
    }
    return {
      datetime: text(day.datetime),
      tempmax: number(day.tempmax),
      tempmin: number(day.tempmin),
      conditions: text(day.conditions, "Conditions unavailable"),
      precipprob: number(day.precipprob),
    };
  });

  const current = isRecord(value.currentConditions) ? value.currentConditions : null;

  return {
    location: text(value.resolvedAddress),
    description: text(value.description),
    current: current ? {
      temp: number(current.temp),
      feelslike: number(current.feelslike),
      humidity: number(current.humidity),
      windspeed: number(current.windspeed),
      conditions: text(current.conditions, "Conditions unavailable"),
    } : null,
    days,
    units,
  };
}
