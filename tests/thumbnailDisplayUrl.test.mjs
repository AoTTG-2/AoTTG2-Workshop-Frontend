import assert from "node:assert/strict";
import { thumbnailDisplayUrl, thumbnailDisplayUrls } from "../src/lib/media.ts";

assert.equal(thumbnailDisplayUrl("https://i.imgur.com/abc123.png"), "https://i.imgur.com/abc123l.png");
assert.equal(thumbnailDisplayUrl("https://i.imgur.com/abc123m.png"), "https://i.imgur.com/abc123m.png");
assert.equal(thumbnailDisplayUrl("https://example.com/abc123.png"), "https://example.com/abc123.png");
assert.equal(thumbnailDisplayUrl("not a url"), "not a url");

assert.deepEqual(thumbnailDisplayUrls("https://example.com/abc123.png", { width: 360, height: 203, fit: "cover" }), [
  "https://thumb.gisketch.com/unsafe/rs:fill:360:203:0/plain/https://example.com/abc123.png@webp",
  "https://example.com/abc123.png",
]);
assert.deepEqual(thumbnailDisplayUrls("https://i.imgur.com/abc123.png", { width: 360, height: 203, fit: "cover" }), [
  "https://thumb.gisketch.com/unsafe/rs:fill:360:203:0/plain/https://i.imgur.com/abc123.png@webp",
  "https://i.imgur.com/abc123l.png",
  "https://i.imgur.com/abc123.png",
]);
assert.equal(thumbnailDisplayUrls("https://example.com/preview.png", { width: 960, height: 540, fit: "inside" })[0], "https://thumb.gisketch.com/unsafe/rs:fit:960:540:0/plain/https://example.com/preview.png@webp");
