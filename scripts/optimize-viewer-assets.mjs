import convert from "fbx2gltf";
import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outRoot = path.join(root, "public/optimized");
const modelRoots = ["public/models"];
const imageRoots = ["public/textures", "public/previews"];

async function walk(dir, exts) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(p, exts));
    else if (exts.includes(path.extname(entry.name).toLowerCase())) out.push(p);
  }
  return out;
}

async function newer(src, dest) {
  if (!existsSync(dest)) return false;
  const [s, d] = await Promise.all([stat(src), stat(dest)]);
  return d.mtimeMs >= s.mtimeMs && d.size > 0;
}

function destFor(src, fromPrefix, toPrefix, ext) {
  const rel = path.relative(path.join(root, fromPrefix), src);
  return path.join(outRoot, toPrefix, rel).replace(path.extname(rel), ext);
}

async function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "pipe" });
    let err = "";
    child.stderr.on("data", (d) => { err += d; });
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} failed (${code})\n${err}`)));
  });
}

async function convertModels() {
  const all = (await Promise.all(modelRoots.map((r) => walk(path.join(root, r), [".fbx"])))).flat();
  const maxBytes = process.env.CONVERT_HUGE === "1" ? Infinity : 25 * 1024 * 1024;
  const sizes = await Promise.all(all.map(async (src) => ({ src, size: (await stat(src)).size })));
  const hugeFiles = sizes.filter((f) => f.size > maxBytes).map((f) => path.relative(root, f.src));
  const files = sizes.filter((f) => f.size <= maxBytes).sort((a, b) => a.size - b.size).map((f) => f.src);
  const failedFiles = [];
  let ok = 0, skipped = 0, failed = 0;
  for (const src of files) {
    const dest = destFor(src, "public/models", "models", ".glb");
    await mkdir(path.dirname(dest), { recursive: true });
    if (await newer(src, dest)) { skipped++; continue; }
    try {
      await convert(src, dest, ["--binary"]);
      ok++;
    } catch (e) {
      failed++;
      failedFiles.push(path.relative(root, src));
      console.warn(`[model failed] ${path.relative(root, src)}\n${String(e).split("\n")[0]}`);
    }
  }
  return { ok, skipped, failed, total: files.length, hugeSkipped: sizes.length - files.length, failedFiles, hugeFiles };
}

async function convertImages() {
  const files = (await Promise.all(imageRoots.map((r) => walk(path.join(root, r), [".png", ".jpg", ".jpeg"])))).flat();
  let ok = 0, skipped = 0, failed = 0;
  for (const src of files) {
    const sourceRoot = src.includes(`${path.sep}previews${path.sep}`) ? "public/previews" : "public/textures";
    const outDir = sourceRoot.endsWith("previews") ? "previews" : "textures";
    const q = sourceRoot.endsWith("previews") ? "80" : "90";
    const dest = destFor(src, sourceRoot, outDir, ".webp");
    await mkdir(path.dirname(dest), { recursive: true });
    if (await newer(src, dest)) { skipped++; continue; }
    try {
      await run("cwebp", ["-quiet", "-q", q, src, "-o", dest]);
      ok++;
    } catch (e) {
      failed++;
      console.warn(`[image failed] ${path.relative(root, src)}\n${String(e).split("\n")[0]}`);
    }
  }
  return { ok, skipped, failed, total: files.length };
}

function rewriteAssetPath(value) {
  if (typeof value !== "string") return value;
  if (value.startsWith("/models/") && value.toLowerCase().endsWith(".fbx")) return value.replace("/models/", "/optimized/models/").replace(/\.fbx$/i, ".glb");
  if (value.startsWith("/textures/") && /\.(png|jpg|jpeg)$/i.test(value)) return value.replace("/textures/", "/optimized/textures/").replace(/\.(png|jpg|jpeg)$/i, ".webp");
  if (value.startsWith("/previews/") && /\.(png|jpg|jpeg)$/i.test(value)) return value.replace("/previews/", "/optimized/previews/").replace(/\.(png|jpg|jpeg)$/i, ".webp");
  return value;
}
function rewriteDeep(v) {
  if (Array.isArray(v)) return v.map(rewriteDeep);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, rewriteDeep(val)]));
  return rewriteAssetPath(v);
}

async function rewriteCatalog() {
  const catalogPath = path.join(root, "public/viewer-catalog.json");
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  await writeFile(catalogPath, JSON.stringify(rewriteDeep(catalog), null, 2));
}

console.log("optimizing models…");
const models = await convertModels();
const modelLog = { ...models, failedFiles: `${models.failedFiles.length} files`, hugeFiles: `${models.hugeFiles.length} files` };
console.log("models", modelLog);
console.log("optimizing images…");
const images = await convertImages();
console.log("images", images);
await rewriteCatalog();
await mkdir(path.join(outRoot, "reports"), { recursive: true });
await writeFile(path.join(outRoot, "reports/viewer-asset-optimization.json"), JSON.stringify({ models, images, generatedAt: new Date().toISOString() }, null, 2));
console.log("catalog rewritten to optimized paths");
console.log("report public/optimized/reports/viewer-asset-optimization.json");
