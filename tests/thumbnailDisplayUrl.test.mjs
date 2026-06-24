import assert from "node:assert/strict";
import { thumbnailDisplayUrl, thumbnailDisplayUrls } from "../src/lib/media.ts";

assert.equal(thumbnailDisplayUrl("https://i.imgur.com/abc123.png"), "https://i.imgur.com/abc123m.png");
assert.equal(thumbnailDisplayUrl("https://i.imgur.com/abc123m.png"), "https://i.imgur.com/abc123m.png");
assert.equal(thumbnailDisplayUrl("https://example.com/abc123.png"), "https://example.com/abc123.png");
assert.equal(thumbnailDisplayUrl("not a url"), "not a url");

assert.deepEqual(thumbnailDisplayUrls("https://example.com/abc123.png", { width: 360, height: 203, fit: "cover" }), [
  "https://wsrv.nl/?url=https%3A%2F%2Fexample.com%2Fabc123.png&w=360&fit=cover&output=webp&q=80&h=203",
  "https://example.com/abc123.png",
]);
assert.deepEqual(thumbnailDisplayUrls("https://i.imgur.com/abc123.png", { width: 360, height: 203, fit: "cover" }), [
  "https://wsrv.nl/?url=https%3A%2F%2Fi.imgur.com%2Fabc123.png&w=360&fit=cover&output=webp&q=80&h=203",
  "https://i.imgur.com/abc123m.png",
  "https://i.imgur.com/abc123.png",
]);
