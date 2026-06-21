import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

// ponytail: tiny hand list. Generate a manifest only when this gets annoying.
const HAIRS = [
  { label: "None", path: "" },
  { label: "Eren", path: "/models/human/hairs/hair_erenModel.fbx" },
  { label: "Mikasa", path: "/models/human/hairs/hair_mikasaModel.fbx" },
  { label: "Levi", path: "/models/human/hairs/hair_leviModel.fbx" },
  { label: "Armin", path: "/models/human/hairs/hair_arminModel.fbx" },
  { label: "Annie", path: "/models/human/hairs/hair_annieModel.fbx" },
  { label: "Sasha", path: "/models/human/hairs/hair_sashaModel.fbx" },
  { label: "Jean", path: "/models/human/hairs/hair_jeanModel.fbx" },
  { label: "Historia", path: "/models/human/hairs/hair_historia.fbx" },
  { label: "Erwin", path: "/models/human/hairs/hair_erwin.fbx" },
  { label: "Zeke", path: "/models/human/hairs/hair_zeke.fbx" },
  { label: "2B", path: "/models/human/hairs/hair_2b.fbx" },
  { label: "Afro", path: "/models/human/hairs/hair_afro.fbx" },
  { label: "Long Anime", path: "/models/human/hairs/hair_longanime.fbx" },
  { label: "Bob Cut 2", path: "/models/human/hairs/hair_BobCut2.fbx" },
];

const BODIES = [
  { label: "Casual Male A", path: "/models/human/costumes/casual_MAModel.fbx" },
  { label: "Casual Male B", path: "/models/human/costumes/casual_MBModel.fbx" },
  { label: "Uniform Male A", path: "/models/human/costumes/uniform_MAModel.fbx" },
  { label: "Uniform Male B", path: "/models/human/costumes/uniform_MBModel.fbx" },
  { label: "Casual Female A", path: "/models/human/costumes/casual_FAModel.fbx" },
  { label: "Casual Female B", path: "/models/human/costumes/casual_FBModel.fbx" },
  { label: "Uniform Female A", path: "/models/human/costumes/uniform_FAModel.fbx" },
  { label: "Uniform Female B", path: "/models/human/costumes/uniform_FBModel.fbx" },
];

function material(color: number) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
}

function makeFallback(kind: "body" | "hair") {
  const group = new THREE.Group();
  if (kind === "hair") {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), material(0x222222));
    hair.position.set(0, 1.72, 0);
    hair.scale.set(1, 0.55, 0.9);
    group.add(hair);
    return group;
  }

  const skin = material(0xffdcc4);
  const cloth = material(0x6f4e37);
  const dark = material(0x2f2520);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.25), cloth);
  torso.position.y = 1.05;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), skin);
  head.position.y = 1.58;
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.7, 0.18), dark);
  legL.position.set(-0.16, 0.36, 0);
  const legR = legL.clone();
  legR.position.x = 0.16;
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.65, 0.14), skin);
  armL.position.set(-0.42, 0.98, 0);
  const armR = armL.clone();
  armR.position.x = 0.42;
  group.add(torso, head, legL, legR, armL, armR);
  return group;
}

async function isLfsPointer(path: string) {
  const head = await fetch(path, { method: "HEAD" });
  const bytes = Number(head.headers.get("content-length") ?? "0");
  if (bytes <= 0 || bytes > 512) return false;
  const text = await fetch(path).then((r) => r.text());
  return text.startsWith("version https://git-lfs.github.com/spec/v1");
}

function prepareModel(group: THREE.Group) {
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.material ||= material(0xffffff);
    }
  });
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  if (box.isEmpty()) return false;
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const max = Math.max(size.x, size.y, size.z);
  if (!Number.isFinite(max) || max <= 0) return false;
  group.position.sub(center);
  group.scale.multiplyScalar(1.8 / max);
  group.position.y += 1;
  return true;
}

export default function Viewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const loaderRef = useRef(new FBXLoader());
  const bodyRef = useRef<THREE.Group | null>(null);
  const hairRef = useRef<THREE.Group | null>(null);
  const animationRef = useRef(0);

  const [sceneReady, setSceneReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState("Starting viewer…");
  const [assetMsg, setAssetMsg] = useState("");
  const [hairPath, setHairPath] = useState("");
  const [bodyPath, setBodyPath] = useState(BODIES[0].path);
  const [textureUrl, setTextureUrl] = useState("");
  const [textureMsg, setTextureMsg] = useState("");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x141420);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, el.clientWidth / el.clientHeight, 0.1, 100);
    camera.position.set(0, 1.1, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(2, 3, 2);
    scene.add(light, new THREE.GridHelper(3, 20, 0x555577, 0x29293a));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.minDistance = 1;
    controls.maxDistance = 4;
    controls.enableDamping = true;

    const resize = () => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener("resize", resize);

    const render = () => {
      animationRef.current = requestAnimationFrame(render);
      controls.update();
      renderer.render(scene, camera);
    };
    render();
    setSceneReady(true);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
      controls.dispose();
      renderer.dispose();
      el.innerHTML = "";
    };
  }, []);

  const loadModel = useCallback(async (path: string, kind: "body" | "hair") => {
    if (!sceneRef.current || !path) return makeFallback(kind);

    if (await isLfsPointer(path)) {
      setAssetMsg("Model files are Git LFS pointers, not real FBX. Showing fallback mesh. Run git lfs pull, then recopy to public/models.");
      return makeFallback(kind);
    }

    return new Promise<THREE.Group>((resolve) => {
      loaderRef.current.load(
        path,
        (group) => resolve(prepareModel(group) ? group : makeFallback(kind)),
        undefined,
        () => {
          setAssetMsg(`Could not load ${path}. Showing fallback mesh.`);
          resolve(makeFallback(kind));
        }
      );
    });
  }, []);

  useEffect(() => {
    if (!sceneReady || !sceneRef.current) return;
    let ignore = false;
    setLoading(true);
    setLoadingMsg("Loading body…");
    void loadModel(bodyPath, "body").then((group) => {
      if (ignore || !sceneRef.current) return;
      if (bodyRef.current) sceneRef.current.remove(bodyRef.current);
      bodyRef.current = group;
      sceneRef.current.add(group);
      setLoading(false);
    });
    return () => { ignore = true; };
  }, [bodyPath, loadModel, sceneReady]);

  useEffect(() => {
    if (!sceneReady || !sceneRef.current) return;
    if (hairRef.current) {
      sceneRef.current.remove(hairRef.current);
      hairRef.current = null;
    }
    if (!hairPath) return;
    let ignore = false;
    setLoading(true);
    setLoadingMsg("Loading hair…");
    void loadModel(hairPath, "hair").then((group) => {
      if (ignore || !sceneRef.current) return;
      hairRef.current = group;
      sceneRef.current.add(group);
      setLoading(false);
    });
    return () => { ignore = true; };
  }, [hairPath, loadModel, sceneReady]);

  const applyTexture = useCallback(() => {
    setTextureMsg("");
    if (!textureUrl.trim() || !sceneRef.current) return;
    setLoading(true);
    setLoadingMsg("Loading texture…");
    new THREE.TextureLoader().load(
      textureUrl.trim(),
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        sceneRef.current?.traverse((obj) => {
          if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
            obj.material.map = tex;
            obj.material.color.set(0xffffff);
            obj.material.needsUpdate = true;
          }
        });
        setTextureMsg("Texture applied");
        setLoading(false);
      },
      undefined,
      () => {
        setTextureMsg("Texture failed");
        setLoading(false);
      }
    );
  }, [textureUrl]);

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-black/60">
            <div className="grid gap-2 text-center">
              <span className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
              <span className="text-sm text-muted-foreground">{loadingMsg}</span>
            </div>
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>

      <aside className="flex w-80 flex-col gap-4 overflow-y-auto border-l border-border bg-card p-4">
        <h2 className="border-b border-border pb-2 text-lg font-semibold">3D Viewer</h2>
        {assetMsg && <p className="rounded border border-yellow-500/40 bg-yellow-500/10 p-2 text-xs text-yellow-200">{assetMsg}</p>}

        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Body</span>
          <select className="rounded border border-border bg-background px-2 py-1" value={bodyPath} onChange={(e) => setBodyPath(e.target.value)}>
            {BODIES.map((b) => <option key={b.path} value={b.path}>{b.label}</option>)}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Hair</span>
          <select className="rounded border border-border bg-background px-2 py-1" value={hairPath} onChange={(e) => setHairPath(e.target.value)}>
            {HAIRS.map((h) => <option key={h.label} value={h.path}>{h.label}</option>)}
          </select>
        </label>

        <label className="grid gap-2 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Texture URL</span>
          <input className="rounded border border-border bg-background px-2 py-1" value={textureUrl} onChange={(e) => setTextureUrl(e.target.value)} placeholder="https://i.imgur.com/..." />
          <button className="rounded bg-primary px-3 py-1 font-medium text-primary-foreground" onClick={applyTexture}>Load Texture</button>
          {textureMsg && <span className="text-xs text-muted-foreground">{textureMsg}</span>}
        </label>

        <p className="mt-auto border-t border-border pt-2 text-xs text-muted-foreground">Drag to rotate · scroll to zoom</p>
      </aside>
    </div>
  );
}
