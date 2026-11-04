export type Units = "us" | "metric";

export interface CurrentWeather {
  temp: number | null;
  feelslike: number | null;
  humidity: number | null;
  windspeed: number | null;
  conditions: string;
}

export interface WeatherDay {
  datetime: string;
  tempmax: number | null;
  tempmin: number | null;
  conditions: string;
  precipprob: number | null;
}

export interface WeatherData {
  location: string;
  description: string;
  current: CurrentWeather | null;
  days: WeatherDay[];
  units: Units;
}

export interface WeatherErrorResponse {
  error: string;
}
