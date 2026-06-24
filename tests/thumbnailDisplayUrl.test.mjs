import assert from "node:assert/strict";
import { thumbnailDisplayUrl } from "../src/lib/media.ts";

assert.equal(thumbnailDisplayUrl("https://i.imgur.com/abc123.png"), "https://i.imgur.com/abc123m.png");
assert.equal(thumbnailDisplayUrl("https://i.imgur.com/abc123m.png"), "https://i.imgur.com/abc123m.png");
assert.equal(thumbnailDisplayUrl("https://example.com/abc123.png"), "https://example.com/abc123.png");
assert.equal(thumbnailDisplayUrl("not a url"), "not a url");
