import { useEffect, useRef, useState } from "react";
import type { ElementRef } from "react";
import type { SkyboxSkinSetForm } from "../types";
import { TexturePreviewButton } from "./TexturePreview";
import { TextureUrlDialog } from "./TextureUrlDialog";

export function SkyboxFaceGrid({ value, onChange }: { value: SkyboxSkinSetForm; onChange: (value: SkyboxSkinSetForm) => void }) {
  return (
    <div className="grid grid-cols-4 items-stretch gap-3">
      <div className="col-start-2 row-start-1">
        <SkyboxFaceButton face="up" label="Top" value={value.up} onChange={(url) => onChange({ ...value, up: url })} />
      </div>
      <div className="col-start-1 row-start-2">
        <SkyboxFaceButton face="left" label="Left" value={value.left} onChange={(url) => onChange({ ...value, left: url })} />
      </div>
      <div className="col-start-2 row-start-2">
        <SkyboxFaceButton face="front" label="Front" value={value.front} onChange={(url) => onChange({ ...value, front: url })} />
      </div>
      <div className="col-start-3 row-start-2">
        <SkyboxFaceButton face="right" label="Right" value={value.right} onChange={(url) => onChange({ ...value, right: url })} />
      </div>
      <div className="col-start-4 row-start-2">
        <SkyboxFaceButton face="back" label="Back" value={value.back} onChange={(url) => onChange({ ...value, back: url })} />
      </div>
      <div className="col-start-2 row-start-3">
        <SkyboxFaceButton face="down" label="Bottom" value={value.down} onChange={(url) => onChange({ ...value, down: url })} />
      </div>
    </div>
  );
}

function SkyboxFaceButton({ face, label, value, onChange }: { face: keyof SkyboxSkinSetForm; label: string; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="aspect-square min-w-0">
      <TexturePreviewButton url={value} label={`${label} skybox texture`} emptyLabel={`Set ${label} texture`} onClick={() => setOpen(true)} className="aspect-square !h-auto !min-h-0" />
      <TextureUrlDialog open={open} onOpenChange={setOpen} value={value} label={`Skybox ${label}`} placeholder={`https://i.imgur.com/skybox-${face}.png`} onSave={onChange} />
    </div>
  );
}

export function SkyboxViewer({ value }: { value: SkyboxSkinSetForm }) {
  const containerRef = useRef<ElementRef<"div"> | null>(null);
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const urlsKey = [value.right, value.left, value.up, value.down, value.front, value.back].join("\n");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let cleanup = () => undefined;
    void import("three").then((THREE) => {
      if (disposed) return;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 20);
      camera.position.set(0, 0, 0.1);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.domElement.style.cursor = "grab";
      renderer.domElement.style.touchAction = "none";
      container.replaceChildren(renderer.domElement);

      const loader = new THREE.TextureLoader();
      const faceUrls = [value.right, value.left, value.up, value.down, value.front, value.back];
      const materials = faceUrls.map((url) => {
        const cleanUrl = url.trim();
        if (!cleanUrl) return new THREE.MeshBasicMaterial({ color: 0x1f1f1f, side: THREE.BackSide });
        const texture = loader.load(cleanUrl);
        texture.colorSpace = THREE.SRGBColorSpace;
        return new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
      });
      const cube = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), materials);
      scene.add(cube);

      const resize = () => {
        const rect = container.getBoundingClientRect();
        const width = Math.max(1, Math.floor(rect.width));
        const height = Math.max(1, Math.floor(rect.height));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      const observer = new window.ResizeObserver(resize);
      observer.observe(container);
      resize();

      const clampPitch = (value: number) => Math.max(-1.2, Math.min(1.2, value));
      const onPointerDown = (event: { clientX: number; clientY: number; pointerId: number }) => {
        dragRef.current = { active: true, x: event.clientX, y: event.clientY };
        renderer.domElement.style.cursor = "grabbing";
        renderer.domElement.setPointerCapture(event.pointerId);
      };
      const onPointerMove = (event: { clientX: number; clientY: number }) => {
        if (!dragRef.current.active) return;
        const dx = event.clientX - dragRef.current.x;
        const dy = event.clientY - dragRef.current.y;
        dragRef.current = { active: true, x: event.clientX, y: event.clientY };
        yawRef.current += dx * 0.006;
        pitchRef.current = clampPitch(pitchRef.current + dy * 0.006);
      };
      const onPointerUp = (event: { pointerId: number }) => {
        dragRef.current.active = false;
        renderer.domElement.style.cursor = "grab";
        if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
      };
      renderer.domElement.addEventListener("pointerdown", onPointerDown);
      renderer.domElement.addEventListener("pointermove", onPointerMove);
      renderer.domElement.addEventListener("pointerup", onPointerUp);
      renderer.domElement.addEventListener("pointercancel", onPointerUp);

      let frame = 0;
      const render = () => {
        if (disposed) return;
        if (!dragRef.current.active) yawRef.current += 0.0025;
        cube.rotation.y = yawRef.current;
        cube.rotation.x = pitchRef.current;
        renderer.render(scene, camera);
        frame = window.requestAnimationFrame(render);
      };
      render();

      cleanup = () => {
        window.cancelAnimationFrame(frame);
        observer.disconnect();
        renderer.domElement.removeEventListener("pointerdown", onPointerDown);
        renderer.domElement.removeEventListener("pointermove", onPointerMove);
        renderer.domElement.removeEventListener("pointerup", onPointerUp);
        renderer.domElement.removeEventListener("pointercancel", onPointerUp);
        materials.forEach((material) => {
          if ("map" in material && material.map) material.map.dispose();
          material.dispose();
        });
        cube.geometry.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [urlsKey, value.back, value.down, value.front, value.left, value.right, value.up]);

  return (
    <aside className="grid content-start gap-3">
      <h2 className="text-sm font-semibold uppercase text-muted-foreground">Skybox Preview</h2>
      <div ref={containerRef} className="aspect-square min-h-[320px] overflow-hidden border border-border bg-card/60" />
    </aside>
  );
}
