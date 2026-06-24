import assert from "node:assert/strict";
import { paginationItems } from "../src/lib/pagination.ts";

assert.deepEqual(paginationItems(1, 3), [1, 2, 3]);
assert.deepEqual(paginationItems(1, 10), [1, 2, 3, "ellipsis", 9, 10]);
assert.deepEqual(paginationItems(5, 10), [1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
assert.deepEqual(paginationItems(10, 10), [1, 2, "ellipsis", 8, 9, 10]);
