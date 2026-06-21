import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { WORKSHOP_API_BASE_URL } from "../lib/config";

type Variants = {
  hairMale: string[]; hairFemale: string[]; eye: string[]; face: string[]; glass: string[];
  costumeMale: string[]; costumeFemale: string[]; bootsCount: number; capeModes: number; logoLabels: string[];
  hat: string[]; head: string[]; back: string[];
};
type UnityTransform = { position?: { x: number; y: number; z: number }; rotation?: { x: number; y: number; z: number; w: number }; scale?: { x: number; y: number; z: number } };
type Asset = { mesh?: string; model?: string; texture?: string; source?: string; type?: string; body?: string; arms?: string[]; textures?: Record<string, string>; gear?: string[]; weapons?: string[]; hands?: string[]; skin?: string; gearTexture?: string; transform?: UnityTransform };
type Catalog = {
  hair: Record<string, Asset>; costume: Record<string, Asset>; eye: Record<string, Asset>; face: Record<string, Asset>; glass: Record<string, Asset>;
  weapon: Record<string, Asset>; boots: Record<string, Asset>; logo: Record<string, string>; hat: Record<string, Asset>; head: Record<string, Asset>; back: Record<string, Asset>;
  baseParts: { head: string; chest: string }; animations: string[]; previewsBase: string;
};
type EditorState = {
  sex: "male" | "female"; weapon: "Blade" | "AHSS" | "Thunderspear" | "APG"; eye: string; face: string; glass: string; hair: string; costume: string;
  boots: number; cape: number; logo: number; animation: string;
  skinColor: string; hairColor: string;
};
type PartSpec = { id: string; path: string; kind: "skin" | "hair" | "costume" | "face" | "part" | "logo" | "plain"; texture?: string; textures?: Record<string, string>; transform?: UnityTransform; textureFlipY?: boolean; visibleMeshes?: string[] };

const FALLBACK_VARIANTS: Variants = {
  hairMale: Array.from({ length: 35 }, (_, i) => `HairM${i}`), hairFemale: Array.from({ length: 33 }, (_, i) => `HairF${i}`),
  eye: Array.from({ length: 68 }, (_, i) => `Eye${i}`), face: ["FaceNone", ...Array.from({ length: 14 }, (_, i) => `Face${i}`)], glass: ["GlassNone", ...Array.from({ length: 10 }, (_, i) => `Glass${i}`)],
  costumeMale: Array.from({ length: 12 }, (_, i) => `CostumeM${i}`), costumeFemale: Array.from({ length: 11 }, (_, i) => `CostumeF${i}`),
  bootsCount: 2, capeModes: 2, logoLabels: ["TS", "SC", "G", "MP"],
  hat: ["HatNone", ...Array.from({ length: 17 }, (_, i) => `Hat${i}`)], head: ["HeadNone", ...Array.from({ length: 8 }, (_, i) => `Head${i}`)], back: ["BackNone", ...Array.from({ length: 8 }, (_, i) => `Back${i}`)],
};
const SKIN_BASE_TEXTURE = "/optimized/textures/human/Costumes/Textures/Skin/skin_adjustable.webp";
const HAIR_SCALE_FIXES = new Set(["HairM11", "HairM12", "HairM13", "HairF11"]);
const HAIR_HEAD_TOP_FIXES = new Set(["HairM17", "HairF12"]);
const HAIR_TEXTURE_FLIP_Y = new Set(["HairF22", "HairF23", "HairF24"]);
const HAIR_VISIBLE_MESHES: Record<string, string[]> = { HairF14: ["HairF14"] };
const HAIR_POSITION_FIXES: Record<string, [number, number, number]> = { HairM17: [0, 0.08, -0.04], HairF12: [0, 0.0, -0.04] };
const HAIR_HEAD_TOP_Y = 1.68;
const HAIR_LOW_TOP_Y = 1.18;

const DEFAULT_STATE: EditorState = {
  sex: "male", weapon: "Blade", eye: "Eye0", face: "FaceNone", glass: "GlassNone", hair: "HairM0", costume: "CostumeM0",
  boots: 0, cape: 0, logo: 0, animation: "IdleM",
  skinColor: "#ffdcc4", hairColor: "#808080",
};

function hexToColor(hex: string) { return new THREE.Color(hex); }
function hexToRgb(hex: string) {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function isEmptyAsset(a?: Asset) { return !a || !(a.mesh || a.model || a.body); }
async function isLfsPointer(path: string) {
  const head = await fetch(path, { method: "HEAD" });
  const bytes = Number(head.headers.get("content-length") ?? "0");
  if (bytes <= 0 || bytes > 512) return false;
  return (await fetch(path).then((r) => r.text())).startsWith("version https://git-lfs.github.com/spec/v1");
}
function makeSkinTexture(base: THREE.Texture | null, overlay: THREE.Texture | null, colorHex: string) {
  if (!base?.image) return null;
  const baseImg = base.image as HTMLImageElement | HTMLCanvasElement | ImageBitmap;
  const overlayImg = overlay?.image as HTMLImageElement | HTMLCanvasElement | ImageBitmap | undefined;
  const canvas = document.createElement("canvas");
  canvas.width = baseImg.width;
  canvas.height = baseImg.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(baseImg, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const skin = hexToRgb(colorHex);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = (data.data[i] + data.data[i + 1] + data.data[i + 2]) / (3 * 255);
    const shade = 0.55 + v * 0.55;
    data.data[i] = Math.min(255, skin[0] * shade);
    data.data[i + 1] = Math.min(255, skin[1] * shade);
    data.data[i + 2] = Math.min(255, skin[2] * shade);
    data.data[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  if (overlayImg) {
    const overlayCanvas = document.createElement("canvas");
    overlayCanvas.width = canvas.width;
    overlayCanvas.height = canvas.height;
    const overlayCtx = overlayCanvas.getContext("2d");
    if (overlayCtx) {
      overlayCtx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height);
      const over = overlayCtx.getImageData(0, 0, canvas.width, canvas.height);
      const outData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < over.data.length; i += 4) {
        if (over.data[i + 3] > 0 && over.data[i] + over.data[i + 1] + over.data[i + 2] > 24) {
          outData.data[i] = over.data[i]; outData.data[i + 1] = over.data[i + 1]; outData.data[i + 2] = over.data[i + 2]; outData.data[i + 3] = 255;
        }
      }
      ctx.putImageData(outData, 0, 0);
    }
  }
  const out = new THREE.CanvasTexture(canvas);
  out.colorSpace = THREE.SRGBColorSpace;
  out.flipY = false;
  return out;
}

function canvasTexture(canvas: HTMLCanvasElement) {
  const out = new THREE.CanvasTexture(canvas);
  out.colorSpace = THREE.SRGBColorSpace;
  out.flipY = false;
  return out;
}

function makeAlphaTexture(texture: THREE.Texture | null) {
  return texture;
}

function makeLayerTexture(base: THREE.Texture | null, overlay: THREE.Texture | null) {
  if (!base?.image) return null;
  if (!overlay?.image) return base;
  const img = base.image as HTMLImageElement | HTMLCanvasElement | ImageBitmap;
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return base;
  ctx.drawImage(img, 0, 0);
  ctx.drawImage(overlay.image as HTMLImageElement | HTMLCanvasElement | ImageBitmap, 0, 0, canvas.width, canvas.height);
  return canvasTexture(canvas);
}

function makeBootTexture(texture: THREE.Texture | null) {
  if (!texture?.image) return null;
  const img = texture.image as HTMLImageElement | HTMLCanvasElement | ImageBitmap;
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const boot = [0x37, 0x2a, 0x25];
  for (let i = 0; i < data.data.length; i += 4) {
    if (data.data[i] + data.data[i + 1] + data.data[i + 2] < 24) {
      data.data[i] = boot[0]; data.data[i + 1] = boot[1]; data.data[i + 2] = boot[2]; data.data[i + 3] = 255;
    }
  }
  ctx.putImageData(data, 0, 0);
  return canvasTexture(canvas);
}


function fallbackBody() {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xffdcc4, roughness: 0.7 });
  const cloth = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.7 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), skin); head.position.y = 1.58;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.25), cloth); torso.position.y = 1.05;
  g.add(head, torso); return g;
}
function fallbackWeapon(id: string) {
  const g = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.08), new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.45 }));
  mesh.position.set(id.endsWith("0") ? -0.55 : 0.55, 1.05, 0);
  mesh.rotation.z = id.endsWith("0") ? 0.25 : -0.25;
  g.add(mesh);
  return g;
}
function alignHairTop(group: THREE.Group, topY: number) {
  const box = new THREE.Box3().setFromObject(group);
  if (!box.isEmpty()) group.position.y += topY - box.max.y;
}

export default function Viewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef(new THREE.Group());
  const loaderRef = useRef(new GLTFLoader());
  const fbxLoaderRef = useRef(new FBXLoader());
  const mixersRef = useRef<THREE.AnimationMixer[]>([]);
  const clockRef = useRef(new THREE.Clock());
  const seqRef = useRef(0);
  const animRef = useRef(0);
  const stateRef = useRef(DEFAULT_STATE);
  const texCache = useRef(new Map<string, Promise<THREE.Texture>>());
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState("Starting viewer…");
  const [errors, setErrors] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variants>(FALLBACK_VARIANTS);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [state, setState] = useState<EditorState>(DEFAULT_STATE);
  const [textureUrl, setTextureUrl] = useState("");
  const [textureMsg, setTextureMsg] = useState("");

  useEffect(() => { stateRef.current = state; }, [state]);

  const hairOptions = state.sex === "male" ? variants.hairMale : variants.hairFemale;
  const costumeOptions = state.sex === "male" ? variants.costumeMale : variants.costumeFemale;
  const setField = <K extends keyof EditorState>(key: K, value: EditorState[K]) => setState((s) => ({ ...s, [key]: value }));

  const loadTexture = useCallback((url?: string) => {
    if (!url) return Promise.resolve(null);
    const cached = texCache.current.get(url);
    if (cached) return cached;
    const p = new Promise<THREE.Texture>((resolve, reject) => new THREE.TextureLoader().load(url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.flipY = false; // glTF/GLB UV convention; TextureLoader defaults break optimized model UVs.
      tex.needsUpdate = true;
      resolve(tex);
    }, undefined, reject));
    texCache.current.set(url, p);
    return p;
  }, []);

  const applyMaterial = useCallback(async (group: THREE.Group, spec: PartSpec) => {
    const [loadedTexture, skinBase, shirtTexture] = await Promise.all([
      loadTexture(spec.texture).catch(() => null),
      spec.kind === "skin" ? loadTexture(SKIN_BASE_TEXTURE).catch(() => null) : Promise.resolve(null),
      spec.kind === "costume" && spec.id !== "leg" ? loadTexture(spec.textures?.color).catch(() => null) : Promise.resolve(null),
    ]);
    const texture = spec.textureFlipY && loadedTexture ? loadedTexture.clone() : loadedTexture;
    if (texture && spec.textureFlipY) { texture.flipY = true; texture.needsUpdate = true; }
    group.traverse((obj) => {
      if (/text|scale|rotation|import|true player|left leg|right leg|block y/i.test(obj.name)) obj.visible = false;
      if (obj instanceof THREE.Mesh && spec.visibleMeshes && !spec.visibleMeshes.includes(obj.name)) obj.visible = false;
      if (!(obj instanceof THREE.Mesh)) return;
      obj.frustumCulled = false;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      const next = mats.map((mat) => {
        const old = mat as THREE.Material & { map?: THREE.Texture | null; color?: THREE.Color };
        let map = texture ?? old.map ?? null;
        const color = old.color?.clone() ?? new THREE.Color(0xffffff);
        let transparent = false;
        let alphaTest = 0;
        let depthWrite = true;
        let depthTest = true;
        if (spec.kind === "skin") { map = makeSkinTexture(skinBase, texture, state.skinColor); color.set(0xffffff); }
        else if (spec.kind === "hair") { color.copy(hexToColor(state.hairColor)); transparent = true; alphaTest = 0.05; }
        else if (spec.kind === "costume") { map = spec.id === "leg" ? makeBootTexture(texture) : makeLayerTexture(texture, shirtTexture); color.set(0xffffff); transparent = true; alphaTest = 0.05; depthWrite = false; }
        else if (spec.kind === "face") { map = makeAlphaTexture(texture); color.set(0xffffff); transparent = true; alphaTest = 0.05; depthWrite = false; depthTest = true; }
        else if (spec.kind === "part" && !texture && color.getHex() < 0x333333) color.set(0x999999);
        return new THREE.MeshBasicMaterial({ map, color, side: THREE.DoubleSide, transparent, alphaTest, depthWrite, depthTest });
      });
      obj.material = Array.isArray(obj.material) ? next : next[0];
      if (spec.kind === "face") {
        const uv = obj.geometry.attributes.uv;
        if (uv) {
          let minU = Infinity, minV = Infinity, maxU = -Infinity, maxV = -Infinity;
          for (let i = 0; i < uv.count; i++) {
            minU = Math.min(minU, uv.getX(i)); minV = Math.min(minV, uv.getY(i));
            maxU = Math.max(maxU, uv.getX(i)); maxV = Math.max(maxV, uv.getY(i));
          }
          const du = maxU - minU || 1, dv = maxV - minV || 1;
          for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - minU) / du, (uv.getY(i) - minV) / dv);
          uv.needsUpdate = true;
        }
        obj.renderOrder = 10;
      }
    });
  }, [loadTexture, state.hairColor, state.skinColor]);

  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x141420);
    const camera = new THREE.PerspectiveCamera(50, el.clientWidth / el.clientHeight, 0.1, 100); camera.position.set(0, 1.1, 3);
    const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(el.clientWidth, el.clientHeight); el.appendChild(renderer.domElement);
    scene.add(new THREE.GridHelper(3, 20, 0x555577, 0x29293a), avatarRef.current);
    const controls = new OrbitControls(camera, renderer.domElement); controls.target.set(0, 1.1, 0); controls.minDistance = 1; controls.maxDistance = 4; controls.enableDamping = true;
    const resize = () => { camera.aspect = el.clientWidth / el.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(el.clientWidth, el.clientHeight); };
    addEventListener("resize", resize);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onPointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(avatarRef.current.children, true)[0];
      if (hit) console.log("viewer mesh", { name: hit.object.name, parent: hit.object.parent?.name, point: hit.point.toArray(), uv: hit.uv?.toArray() });
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    const render = () => {
      animRef.current = requestAnimationFrame(render);
      const dt = clockRef.current.getDelta();
      mixersRef.current.forEach((m) => m.update(dt));
      if (stateRef.current.animation.startsWith("Idle")) {
        const t = performance.now() / 1000;
        avatarRef.current.rotation.y = Math.sin(t * 1.1) * 0.035;
        avatarRef.current.position.y = (avatarRef.current.userData.baseY ?? 0) + Math.sin(t * 2.2) * 0.01;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    render(); setReady(true); (window as unknown as { __viewer?: unknown }).__viewer = { scene, avatar: avatarRef.current, THREE };
    return () => { cancelAnimationFrame(animRef.current); removeEventListener("resize", resize); renderer.domElement.removeEventListener("pointerdown", onPointerDown); controls.dispose(); renderer.dispose(); el.innerHTML = ""; };
  }, []);

  useEffect(() => {
    setLoading(true); setLoadingMsg("Loading variant catalog…");
    void Promise.all([
      fetch(`${WORKSHOP_API_BASE_URL}/workshop/variants`).then((r) => r.ok ? r.json() : FALLBACK_VARIANTS).catch(() => FALLBACK_VARIANTS),
      fetch("/viewer-catalog.json").then((r) => r.json()),
    ]).then(([v, c]) => { setVariants(v); setCatalog(c); setLoading(false); });
  }, []);

  const fitAvatar = useCallback(() => {
    const avatar = avatarRef.current; avatar.scale.set(1, 1, 1); avatar.position.set(0, 0, 0); avatar.updateMatrixWorld(true);
    const box = new THREE.Box3();
    avatar.traverse((obj) => { if (obj instanceof THREE.Mesh && obj.visible) box.expandByObject(obj); });
    if (box.isEmpty()) return;
    const size = new THREE.Vector3(); const center = new THREE.Vector3(); box.getSize(size); box.getCenter(center);
    const max = Math.max(size.x, size.y, size.z); if (!Number.isFinite(max) || max <= 0) return;
    const scale = 1.8 / max; avatar.scale.setScalar(scale); avatar.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale); avatar.userData.baseY = avatar.position.y;
  }, []);

  const specs = useMemo(() => {
    if (!catalog) return [] as PartSpec[];
    const costume = catalog.costume[state.costume]; const weapon = catalog.weapon[state.weapon];
    const out: PartSpec[] = [
      { id: "head", path: catalog.baseParts.head, kind: "skin", texture: weapon?.skin },
      { id: "chest", path: catalog.baseParts.chest, kind: "skin", texture: weapon?.skin },
      { id: "leg", path: catalog.boots[String(state.boots)]?.mesh ?? `/models/human/costumes/char_leg_${state.boots}Model.fbx`, kind: "costume", texture: costume?.textures?.pants },
      { id: "body", path: costume?.body ?? "", kind: "costume", texture: costume?.textures?.main, textures: costume?.textures },
      ...((state.weapon === "AHSS" || state.weapon === "APG") ? ["/optimized/models/human/costumes/casual_arm_AH_LModel.glb", "/optimized/models/human/costumes/casual_arm_AH_RModel.glb"] : (costume?.arms ?? [])).map((path, i) => ({ id: `arm${i}`, path, kind: "costume" as const, texture: costume?.textures?.main, textures: costume?.textures })),
      ...(weapon?.hands ?? []).map((path, i) => ({ id: `hand${i}`, path, kind: "skin" as const, texture: weapon?.skin })),
      ...(weapon?.gear ?? []).map((path, i) => ({ id: `gear${i}`, path, kind: "part" as const, texture: weapon?.gearTexture })),
      ...(weapon?.weapons ?? []).map((path, i) => ({ id: `weapon${i}`, path, kind: "part" as const, texture: weapon?.gearTexture })),
      { id: state.hair, path: catalog.hair[state.hair]?.model ?? "", kind: "hair", texture: catalog.hair[state.hair]?.texture, textureFlipY: HAIR_TEXTURE_FLIP_Y.has(state.hair), visibleMeshes: HAIR_VISIBLE_MESHES[state.hair] },
      { id: "eye", path: catalog.eye[state.eye]?.mesh ?? "", kind: "face", texture: catalog.eye[state.eye]?.texture },
      ...(isEmptyAsset(catalog.face[state.face]) ? [] : [{ id: "face", path: catalog.face[state.face]?.mesh ?? "", kind: "face" as const, texture: catalog.face[state.face]?.texture }]),
      ...(isEmptyAsset(catalog.glass[state.glass]) ? [] : [{ id: "glass", path: catalog.glass[state.glass]?.mesh ?? "", kind: "face" as const, texture: catalog.glass[state.glass]?.texture }]),
      ...(state.cape ? [{ id: "cape", path: "/optimized/models/human/costumes/cape_0Model.glb", kind: "logo" as const, texture: catalog.logo[String(state.logo)] }] : []),
    ];
    return out.filter((s) => s.path);
  }, [catalog, state]);

  const loadGroup = useCallback(async (spec: PartSpec) => {
    const url = encodeURI(spec.path);
    if (await isLfsPointer(url)) throw new Error(`${spec.path} is still a Git LFS pointer`);
    const group = await new Promise<THREE.Group>((resolve, reject) => {
      if (url.toLowerCase().endsWith(".fbx")) fbxLoaderRef.current.load(url, resolve, undefined, reject);
      else loaderRef.current.load(url, (gltf) => resolve(gltf.scene), undefined, reject);
    });
    await applyMaterial(group, spec);
    if (spec.kind === "hair" && url.toLowerCase().endsWith(".fbx")) group.scale.setScalar(0.01);
    if (spec.kind === "hair") {
      if (HAIR_SCALE_FIXES.has(spec.id)) group.scale.multiplyScalar(2.5);
      if (HAIR_HEAD_TOP_FIXES.has(spec.id)) alignHairTop(group, HAIR_HEAD_TOP_Y);
      else {
        const box = new THREE.Box3().setFromObject(group);
        if (!box.isEmpty() && box.max.y < 0.9) group.position.y += HAIR_LOW_TOP_Y - box.max.y;
      }
      const positionFix = HAIR_POSITION_FIXES[spec.id];
      if (positionFix) group.position.add(new THREE.Vector3(...positionFix));
    }
    let hasMesh = false;
    group.traverse((obj) => { if (obj instanceof THREE.Mesh && obj.visible) hasMesh = true; });
    if (!hasMesh && spec.id.startsWith("weapon")) return fallbackWeapon(spec.id);
    if (spec.transform) {
      const { position, rotation, scale } = spec.transform;
      if (position) group.position.set(position.x, position.y, position.z);
      if (rotation) group.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
      if (scale) group.scale.set(scale.x, scale.y, scale.z);
    }
    return group;
  }, [applyMaterial]);

  useEffect(() => {
    if (!ready || !catalog || specs.length === 0) return;
    const seq = ++seqRef.current; const avatar = avatarRef.current;
    setLoading(true); setLoadingMsg(`Loading ${specs.length} meshes/textures…`); setErrors([]);
    void Promise.allSettled(specs.map(loadGroup)).then((results) => {
      if (seq !== seqRef.current) return;
      avatar.clear(); mixersRef.current = [];
      const nextErrors: string[] = [];
      results.forEach((r, i) => {
        if (r.status === "fulfilled") {
          avatar.add(r.value);
          if (r.value.animations?.length) {
            const mixer = new THREE.AnimationMixer(r.value); const clip = r.value.animations.find((a) => a.name.includes(state.animation)) ?? r.value.animations[0]; mixer.clipAction(clip).play(); mixersRef.current.push(mixer);
          }
        } else nextErrors.push(`${specs[i].id}: ${String(r.reason)}`);
      });
      if (!avatar.children.length) avatar.add(fallbackBody());
      fitAvatar(); setErrors(nextErrors); setLoading(false);
    });
  }, [catalog, fitAvatar, loadGroup, ready, specs, state.animation]);

  const applyTextureUrl = useCallback(() => {
    if (!textureUrl.trim()) return;
    setLoading(true); setLoadingMsg("Loading texture URL…");
    void loadTexture(textureUrl.trim()).then((tex) => {
      avatarRef.current.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((mat) => { if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhongMaterial || mat instanceof THREE.MeshBasicMaterial) { mat.map = tex; mat.color.set(0xffffff); mat.needsUpdate = true; } });
        }
      });
      setTextureMsg("Texture applied"); setLoading(false);
    }).catch(() => { setTextureMsg("Texture failed"); setLoading(false); });
  }, [loadTexture, textureUrl]);

  const preview = (id: string) => `/previews/human/${id}.png`;
  const select = (label: string, value: string | number, onChange: (v: string) => void, options: (string | number)[]) => (
    <label className="grid gap-1 text-sm"><span className="text-xs font-medium text-muted-foreground">{label}</span><select className="rounded border border-border bg-background px-2 py-1" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={String(o)} value={String(o)}>{String(o)}</option>)}</select>{typeof value === "string" && value && <img src={preview(value)} className="h-10 w-10 rounded border border-border object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />}</label>
  );

  return <div className="flex h-[calc(100vh-3rem)]">
    <div className="relative flex-1">{loading && <div className="absolute inset-0 z-10 grid place-items-center bg-black/70"><div className="grid gap-2 text-center"><span className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" /><span className="text-sm text-muted-foreground">{loadingMsg}</span></div></div>}<div ref={containerRef} className="h-full w-full" /></div>
    <aside className="flex w-96 flex-col gap-4 overflow-y-auto border-l border-border bg-card p-4">
      <h2 className="border-b border-border pb-2 text-lg font-semibold">Unity Character Editor</h2>
      {errors.length > 0 && <div className="rounded border border-yellow-500/40 bg-yellow-500/10 p-2 text-xs text-yellow-200">{errors.slice(0, 5).map((e) => <div key={e}>{e}</div>)}</div>}
      <div className="grid grid-cols-2 gap-3">
        {select("Sex", state.sex, (v) => setState((s) => ({ ...s, sex: v as "male" | "female", hair: v === "male" ? variants.hairMale[0] : variants.hairFemale[0], costume: v === "male" ? variants.costumeMale[0] : variants.costumeFemale[0], animation: v === "male" ? "IdleM" : "IdleF" })), ["male", "female"])}
        {select("Weapon", state.weapon, (v) => setField("weapon", v as EditorState["weapon"]), ["Blade", "AHSS", "Thunderspear", "APG"])}
        {select("Costume", state.costume, (v) => setField("costume", v), costumeOptions)}
        {select("Hair", state.hair, (v) => setField("hair", v), hairOptions)}
        {select("Eye", state.eye, (v) => setField("eye", v), variants.eye)}
        {select("Face", state.face, (v) => setField("face", v), variants.face)}
        {select("Glass", state.glass, (v) => setField("glass", v), variants.glass)}
        {select("Boots", state.boots, (v) => setField("boots", Number(v)), Array.from({ length: variants.bootsCount }, (_, i) => i))}
        {select("Cape", state.cape, (v) => setField("cape", Number(v)), Array.from({ length: variants.capeModes }, (_, i) => i))}
        {select("Logo", state.logo, (v) => setField("logo", Number(v)), variants.logoLabels.map((_, i) => i))}
        {select("Animation", state.animation, (v) => setField("animation", v), catalog?.animations ?? ["IdleM", "IdleF"])}
      </div>
      <div className="grid grid-cols-2 gap-2">{(["skinColor", "hairColor"] as const).map((key) => <label key={key} className="grid gap-1 text-xs text-muted-foreground">{key}<input type="color" value={state[key]} onChange={(e) => setField(key, e.target.value)} /></label>)}</div>
      <label className="grid gap-2 text-sm"><span className="text-xs font-medium text-muted-foreground">Texture URL</span><input className="rounded border border-border bg-background px-2 py-1" value={textureUrl} onChange={(e) => setTextureUrl(e.target.value)} placeholder="https://i.imgur.com/..." /><button className="rounded bg-primary px-3 py-1 font-medium text-primary-foreground" onClick={applyTextureUrl}>Load Texture</button>{textureMsg && <span className="text-xs text-muted-foreground">{textureMsg}</span>}</label>
      <p className="border-t border-border pt-2 text-xs text-muted-foreground">Unity camera: anchor 0,1.1,0 · distance 1-4</p>
    </aside>
  </div>;
}
