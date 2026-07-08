import { useState } from "react";
import { Button, Checkbox, Input } from "@aottg2/ui";
import type { AddonFileForm, AddonForm, CustomLogicFileForm, CustomLogicForm, MapForm } from "../types";
import { Field } from "./Field";
import { WorkshopFileUploadControl } from "./WorkshopFileUploadControl";

const maxBundleFiles = 5;

export function MapDataFields({ map, onUploadBusyChange, setMap }: { map: MapForm; onUploadBusyChange: (busy: boolean) => void; setMap: (map: MapForm) => void }) {
  return (
    <section className="grid gap-5 border-t border-border pt-6">
      <h2 className="text-sm font-semibold uppercase text-muted-foreground">Map Data</h2>
      <WorkshopFileUploadControl accept=".map,.txt,text/plain" assetType="map" label="Map File" onBusyChange={onUploadBusyChange} onReferenceChange={(file) => setMap({ ...map, file })} reference={map.file} required={!map.file} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Object Count"><Input className="h-10 text-sm" inputMode="numeric" value={map.objectCount} onChange={(event) => setMap({ ...map, objectCount: event.target.value })} /></Field>
        <Field label="Environment"><Input className="h-10 text-sm" placeholder="forest, city, arena" value={map.environment} onChange={(event) => setMap({ ...map, environment: event.target.value })} /></Field>
        <Field label="Recommended Players"><Input className="h-10 text-sm" placeholder="2-8" value={map.recommendedPlayers} onChange={(event) => setMap({ ...map, recommendedPlayers: event.target.value })} /></Field>
        <Field label="Object Types"><Input className="h-10 text-sm" placeholder="spawn, wall, supply" value={map.objectTypes} onChange={(event) => setMap({ ...map, objectTypes: event.target.value })} /></Field>
        <Field label="Custom Assets"><Input className="h-10 text-sm" placeholder="asset-a, asset-b" value={map.customAssets} onChange={(event) => setMap({ ...map, customAssets: event.target.value })} /></Field>
        <Field label="Logic Lines"><Input className="h-10 text-sm" inputMode="numeric" value={map.logicLines} onChange={(event) => setMap({ ...map, logicLines: event.target.value })} /></Field>
      </div>
      <label className="flex items-center gap-3 text-sm text-foreground">
        <Checkbox checked={map.hasLogic} onCheckedChange={(checked) => setMap({ ...map, hasLogic: checked === true })} />
        Has embedded logic
      </label>
    </section>
  );
}

export function CustomLogicDataFields({ customLogic, onUploadBusyChange, setCustomLogic }: { customLogic: CustomLogicForm; onUploadBusyChange: (key: number, busy: boolean) => void; setCustomLogic: (customLogic: CustomLogicForm) => void }) {
  return (
    <section className="grid gap-5 border-t border-border pt-6">
      <h2 className="text-sm font-semibold uppercase text-muted-foreground">Custom Logic Files</h2>
      <div className="grid gap-4">
        {customLogic.files.map((file, index) => (
          <LogicFileCard key={index} file={file} index={index} onChange={(nextFile) => updateLogicFile(customLogic, setCustomLogic, index, nextFile)} onUploadBusyChange={(busy) => onUploadBusyChange(index, busy)} onRemove={customLogic.files.length > 1 ? () => setCustomLogic({ ...customLogic, files: customLogic.files.filter((_, fileIndex) => fileIndex !== index) }) : undefined} />
        ))}
      </div>
      <div><Button type="button" variant="secondary" disabled={customLogic.files.length >= maxBundleFiles} onClick={() => setCustomLogic({ ...customLogic, files: [...customLogic.files, { namespace: "Main", file: null }] })}>Add logic file</Button></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Uses Builtins"><Input className="h-10 text-sm" placeholder="Game, Hooks, UI" value={customLogic.usesBuiltins} onChange={(event) => setCustomLogic({ ...customLogic, usesBuiltins: event.target.value })} /></Field>
        <Field label="Minimum Game Version"><Input className="h-10 text-sm" placeholder="0.0.0" value={customLogic.minGameVersion} onChange={(event) => setCustomLogic({ ...customLogic, minGameVersion: event.target.value })} /></Field>
      </div>
    </section>
  );
}

export function AddonDataFields({ addon, onUploadBusyChange, setAddon }: { addon: AddonForm; onUploadBusyChange: (key: number, busy: boolean) => void; setAddon: (addon: AddonForm) => void }) {
  return (
    <section className="grid gap-5 border-t border-border pt-6">
      <h2 className="text-sm font-semibold uppercase text-muted-foreground">Addon Files</h2>
      <div className="grid gap-4">
        {addon.files.map((file, index) => (
          <AddonFileCard key={index} file={file} index={index} onChange={(nextFile) => updateAddonFile(addon, setAddon, index, nextFile)} onUploadBusyChange={(busy) => onUploadBusyChange(index, busy)} onRemove={addon.files.length > 1 ? () => setAddon({ ...addon, files: addon.files.filter((_, fileIndex) => fileIndex !== index) }) : undefined} />
        ))}
      </div>
      <div><Button type="button" variant="secondary" disabled={addon.files.length >= maxBundleFiles} onClick={() => setAddon({ ...addon, files: [...addon.files, { file: null }] })}>Add addon file</Button></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Provides"><Input className="h-10 text-sm" placeholder="hook, command" value={addon.provides} onChange={(event) => setAddon({ ...addon, provides: event.target.value })} /></Field>
        <Field label="Uses Builtins"><Input className="h-10 text-sm" placeholder="Game, Hooks" value={addon.usesBuiltins} onChange={(event) => setAddon({ ...addon, usesBuiltins: event.target.value })} /></Field>
        <Field label="Minimum Game Version"><Input className="h-10 text-sm" placeholder="0.0.0" value={addon.minGameVersion} onChange={(event) => setAddon({ ...addon, minGameVersion: event.target.value })} /></Field>
      </div>
    </section>
  );
}

function LogicFileCard({ file, index, onChange, onRemove, onUploadBusyChange }: { file: CustomLogicFileForm; index: number; onChange: (file: CustomLogicFileForm) => void; onRemove?: () => void; onUploadBusyChange: (busy: boolean) => void }) {
  const [uploadBusy, setUploadBusy] = useState(false);
  function updateUploadBusy(busy: boolean) {
    setUploadBusy(busy);
    onUploadBusyChange(busy);
  }

  return (
    <div className="grid gap-4 border border-border bg-card/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-primary text-sm uppercase text-foreground">Logic File {index + 1}</h3>
        {onRemove ? <Button type="button" variant="ghost" disabled={uploadBusy} onClick={onRemove}>Remove</Button> : null}
      </div>
      <WorkshopFileUploadControl accept=".cs,.cl,.txt,text/plain" assetType="custom_logic" label="Logic File Upload" onBusyChange={updateUploadBusy} onReferenceChange={(reference) => onChange({ ...file, file: reference })} reference={file.file} required={!file.file} />
      <Field label="Namespace"><Input className="h-10 text-sm" placeholder="Main" value={file.namespace} onChange={(event) => onChange({ ...file, namespace: event.target.value })} /></Field>
    </div>
  );
}

function AddonFileCard({ file, index, onChange, onRemove, onUploadBusyChange }: { file: AddonFileForm; index: number; onChange: (file: AddonFileForm) => void; onRemove?: () => void; onUploadBusyChange: (busy: boolean) => void }) {
  const [uploadBusy, setUploadBusy] = useState(false);
  function updateUploadBusy(busy: boolean) {
    setUploadBusy(busy);
    onUploadBusyChange(busy);
  }

  return (
    <div className="grid gap-4 border border-border bg-card/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-primary text-sm uppercase text-foreground">Addon File {index + 1}</h3>
        {onRemove ? <Button type="button" variant="ghost" disabled={uploadBusy} onClick={onRemove}>Remove</Button> : null}
      </div>
      <WorkshopFileUploadControl accept=".cs,.cl,.json,.txt,text/plain,application/json" assetType="addon" label="Addon File Upload" onBusyChange={updateUploadBusy} onReferenceChange={(reference) => onChange({ ...file, file: reference })} reference={file.file} required={!file.file} />
    </div>
  );
}

function updateLogicFile(form: CustomLogicForm, setForm: (form: CustomLogicForm) => void, index: number, file: CustomLogicFileForm) {
  setForm({ ...form, files: form.files.map((item, itemIndex) => (itemIndex === index ? file : item)) });
}

function updateAddonFile(form: AddonForm, setForm: (form: AddonForm) => void, index: number, file: AddonFileForm) {
  setForm({ ...form, files: form.files.map((item, itemIndex) => (itemIndex === index ? file : item)) });
}
