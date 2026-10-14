// Chạy: node --test tests/sitemap.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { refreshSitemap } from "../src/utils/sitemap.ts";

const URL = "https://trungcapnhanlucquocte.vn/sitemap/refresh?key=TEST";

test("should send a no-cors GET to the refresh url", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => new Response());

  await refreshSitemap(URL);

  assert.equal(fetchMock.mock.callCount(), 1);
  const [calledUrl, init] = fetchMock.mock.calls[0].arguments;
  assert.equal(calledUrl, URL);
  assert.equal(init.mode, "no-cors");
});

test("should do nothing when the refresh url is not configured", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => new Response());

  await refreshSitemap("");

  assert.equal(fetchMock.mock.callCount(), 0);
});

test("should not throw when the network request fails", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("Failed to fetch");
  });
  t.mock.method(console, "warn", () => {});

  await assert.doesNotReject(refreshSitemap(URL));
});
