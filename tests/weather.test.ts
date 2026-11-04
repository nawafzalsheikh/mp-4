import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { GET } from "../app/api/weather/route.ts";

const testKey = "test-key-not-for-real-weather";
const originalFetch = globalThis.fetch;
const originalKey = process.env.VISUAL_CROSSING_API_KEY;

beforeEach(() => {
  process.env.VISUAL_CROSSING_API_KEY = testKey;
  globalThis.fetch = async () => {
    throw new Error("The provider should not be called in this test.");
  };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) {
    delete process.env.VISUAL_CROSSING_API_KEY;
  } else {
    process.env.VISUAL_CROSSING_API_KEY = originalKey;
  }
});

function weatherRequest(city = "Boston") {
  return new Request(`http://localhost:3000/api/weather?city=${encodeURIComponent(city)}`);
}

async function checkError(response: Response, status: number) {
  assert.equal(response.status, status);
  const body = await response.json();
  assert.equal(typeof body.error, "string");
  assert.ok(!JSON.stringify(body).includes(testKey));
}

test("successful weather requests keep the API key on the server", async () => {
  globalThis.fetch = async (input) => {
    assert.ok(input instanceof URL);
    assert.equal(input.hostname, "weather.visualcrossing.com");
    assert.equal(input.searchParams.get("key"), testKey);
    assert.equal(input.searchParams.get("unitGroup"), "us");
    return Response.json({
      resolvedAddress: "Boston, MA",
      timezone: "America/New_York",
      currentConditions: { temp: 65, conditions: "Clear" },
      days: [{ datetime: "2026-11-04", tempmax: 70, tempmin: 50 }],
      unusedPrivateField: testKey,
    });
  };

  const response = await GET(weatherRequest());
  assert.equal(response.status, 200);
  const weather = await response.json();
  assert.equal(weather.location, "Boston, MA");
  assert.equal(weather.current.temp, 65);
  assert.equal(weather.days[0].tempmax, 70);
  assert.equal(weather.days[0].tempmin, 50);
  assert.ok(!JSON.stringify(weather).includes(testKey));
});

test("a missing city returns 400 without fetching", async () => {
  await checkError(await GET(weatherRequest("")), 400);
});

test("a missing API key returns 503 without fetching", async () => {
  delete process.env.VISUAL_CROSSING_API_KEY;
  await checkError(await GET(weatherRequest()), 503);
});

test("a city the provider cannot find returns 404", async () => {
  globalThis.fetch = async () => new Response(`City not found: ${testKey}`, { status: 404 });
  await checkError(await GET(weatherRequest()), 404);
});

test("an invalid API key returns 503", async () => {
  globalThis.fetch = async () => new Response(`Invalid key: ${testKey}`, { status: 401 });
  await checkError(await GET(weatherRequest()), 503);
});

test("a provider request limit returns 429", async () => {
  globalThis.fetch = async () => new Response(`Quota exceeded: ${testKey}`, { status: 429 });
  await checkError(await GET(weatherRequest()), 429);
});

test("a provider server error returns 502", async () => {
  globalThis.fetch = async () => new Response(`Service failure: ${testKey}`, { status: 500 });
  await checkError(await GET(weatherRequest()), 502);
});

test("a provider timeout returns 504", async () => {
  globalThis.fetch = async (_input, options) => {
    assert.ok(options?.signal instanceof AbortSignal);
    throw new DOMException(`Timed out: ${testKey}`, "TimeoutError");
  };
  await checkError(await GET(weatherRequest()), 504);
});

test("a network failure returns 502", async () => {
  globalThis.fetch = async () => {
    throw new TypeError(`Network failure: ${testKey}`);
  };
  await checkError(await GET(weatherRequest()), 502);
});

test("a malformed provider response returns 502", async () => {
  globalThis.fetch = async () => Response.json({ unexpectedData: testKey });
  await checkError(await GET(weatherRequest()), 502);
});
