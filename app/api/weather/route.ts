import { normalizeWeather } from "../../../lib/weather.ts";

export const runtime = "nodejs";

function errorResponse(error: string, status: number): Response {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const city = params.get("city")?.trim() ?? "";
  const units = params.get("units") ?? "us";

  if (!city || city.length > 120 || /[\u0000-\u001f\u007f/\\]/.test(city)) {
    return errorResponse("Enter a city name using 1–120 characters, without slashes.", 400);
  }
  if (units !== "us" && units !== "metric") {
    return errorResponse("Choose Fahrenheit or Celsius and try again.", 400);
  }

  // Route handlers run on the server. This key is never sent to the browser.
  const apiKey = process.env.VISUAL_CROSSING_API_KEY?.trim();
  if (!apiKey) {
    return errorResponse("Weather is not connected yet. Add your Visual Crossing API key to .env.local, then restart the app.", 503);
  }

  const url = new URL(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(city)}/next7days`);
  url.search = new URLSearchParams({
    key: apiKey,
    unitGroup: units,
    contentType: "json",
    include: "current,days",
    elements: "datetime,temp,tempmax,tempmin,feelslike,humidity,windspeed,conditions,description,precipprob",
  }).toString();

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });

    // Upstream error bodies can include request details, so never forward them.
    if (response.status === 400 || response.status === 404) {
      return errorResponse("We couldn't find that city. Check the spelling or add a state or country.", 404);
    }
    if (response.status === 401 || response.status === 403) {
      return errorResponse("The weather service could not verify the API key. Check the key in your local settings.", 503);
    }
    if (response.status === 429) {
      return errorResponse("The weather service's request limit has been reached. Please try again later.", 429);
    }
    if (!response.ok) {
      return errorResponse("The weather service is temporarily unavailable. Please try again later.", 502);
    }

    const data: unknown = await response.json();
    return Response.json(normalizeWeather(data, units), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return errorResponse("The weather service took too long to respond. Please try again.", 504);
    }
    // Keep internal exception messages and credential-bearing URLs off the client.
    return errorResponse("We couldn't load the weather right now. Please try again in a moment.", 502);
  }
}
