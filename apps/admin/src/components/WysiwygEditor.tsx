import { useEffect, useRef, useState } from "react";
import Tooltip from "./Tooltip";

type Popup = { type: "link"; url: string } | { type: "image"; url: string; linkUrl: string };

interface Props {
  value: string;
  onChange: (v: string) => void;
  vars?: { key: string; desc: string }[];
}

export default function WysiwygEditor({ value, onChange, vars }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInit = useRef(false);
  const savedRange = useRef<Range | null>(null);
  const [sourceMode, setSourceMode] = useState(false);
  const [popup, setPopup] = useState<Popup | null>(null);

  useEffect(() => {
    if (ref.current && !isInit.current) { ref.current.innerHTML = value; isInit.current = true; }
  }, [value]);
  useEffect(() => {
    if (!sourceMode && ref.current) { ref.current.innerHTML = value; }
  }, [sourceMode]);

  const exec = (cmd: string, val?: string) => { document.execCommand(cmd, false, val); ref.current?.focus(); if (ref.current) onChange(ref.current.innerHTML); };
  const insertVar = (v: string) => {
    if (sourceMode) { onChange(value + v); return; }
    ref.current?.focus(); document.execCommand("insertText", false, v); if (ref.current) onChange(ref.current.innerHTML);
  };
  const toggleSource = () => {
    if (!sourceMode && ref.current) onChange(ref.current.innerHTML);
    if (sourceMode) isInit.current = false;
    setSourceMode((v) => !v);
  };

  const saveRange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange();
  };
  const restoreRange = () => {
    const sel = window.getSelection();
    if (sel && savedRange.current) { sel.removeAllRanges(); sel.addRange(savedRange.current); }
  };

  const openPopup = (type: "link" | "image") => {
    saveRange();
    setPopup(type === "link" ? { type: "link", url: "" } : { type: "image", url: "", linkUrl: "" });
  };

  const insertLink = () => {
    if (!popup || popup.type !== "link" || !popup.url) return;
    restoreRange();
    document.execCommand("createLink", false, popup.url);
    const links = ref.current?.querySelectorAll(`a[href="${popup.url}"]`);
    links?.forEach((a) => { (a as HTMLAnchorElement).target = "_blank"; (a as HTMLAnchorElement).rel = "noopener noreferrer"; });
    if (ref.current) onChange(ref.current.innerHTML);
    setPopup(null);
  };

  const insertImage = () => {
    if (!popup || popup.type !== "image" || !popup.url) return;
    restoreRange();
    const img = `<img src="${popup.url}" alt="" style="max-width:100%" />`;
    const html = popup.linkUrl ? `<a href="${popup.linkUrl}" target="_blank" rel="noopener noreferrer">${img}</a>` : img;
    document.execCommand("insertHTML", false, html);
    if (ref.current) onChange(ref.current.innerHTML);
    setPopup(null);
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50">
        {!sourceMode && <>
          <Tooltip text="Tučně"><button type="button" onClick={() => exec("bold")} className="px-2 py-1 text-sm rounded hover:bg-gray-200 font-bold"><i className="fa-regular fa-bold" /></button></Tooltip>
          <Tooltip text="Kurzíva"><button type="button" onClick={() => exec("italic")} className="px-2 py-1 text-sm rounded hover:bg-gray-200 italic"><i className="fa-regular fa-italic" /></button></Tooltip>
          <Tooltip text="Podtržení"><button type="button" onClick={() => exec("underline")} className="px-2 py-1 text-sm rounded hover:bg-gray-200 underline"><i className="fa-regular fa-underline" /></button></Tooltip>
          <span className="w-px bg-gray-300 mx-1" />
          <Tooltip text="Nadpis H2"><button type="button" onClick={() => exec("formatBlock", "h2")} className="px-2 py-1 text-sm rounded hover:bg-gray-200">H2</button></Tooltip>
          <Tooltip text="Nadpis H3"><button type="button" onClick={() => exec("formatBlock", "h3")} className="px-2 py-1 text-sm rounded hover:bg-gray-200">H3</button></Tooltip>
          <Tooltip text="Odstavec"><button type="button" onClick={() => exec("formatBlock", "p")} className="px-2 py-1 text-sm rounded hover:bg-gray-200"><i className="fa-regular fa-paragraph" /></button></Tooltip>
          <span className="w-px bg-gray-300 mx-1" />
          <Tooltip text="Odrážkový seznam"><button type="button" onClick={() => exec("insertUnorderedList")} className="px-2 py-1 text-sm rounded hover:bg-gray-200"><i className="fa-regular fa-list-ul" /></button></Tooltip>
          <Tooltip text="Číslovaný seznam"><button type="button" onClick={() => exec("insertOrderedList")} className="px-2 py-1 text-sm rounded hover:bg-gray-200"><i className="fa-regular fa-list-ol" /></button></Tooltip>
          <span className="w-px bg-gray-300 mx-1" />
          <Tooltip text="Vložit odkaz"><button type="button" onClick={() => openPopup("link")} className="px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-600"><i className="fa-regular fa-link" /></button></Tooltip>
          <Tooltip text="Vložit obrázek"><button type="button" onClick={() => openPopup("image")} className="px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-600"><i className="fa-regular fa-image" /></button></Tooltip>
          <span className="w-px bg-gray-300 mx-1" />
          <Tooltip text="Odstranit formátování"><button type="button" onClick={() => exec("removeFormat")} className="px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-500"><i className="fa-regular fa-eraser" /></button></Tooltip>
          <span className="w-px bg-gray-300 mx-1" />
        </>}
        <button type="button" onClick={toggleSource} className={`px-2 py-1 text-sm rounded transition-colors ${sourceMode ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "hover:bg-gray-200 text-gray-500"}`}><i className="fa-regular fa-code" /> {sourceMode ? "WYSIWYG" : "HTML"}</button>
      </div>

      {popup?.type === "link" && (
        <div className="border-b border-blue-100 bg-blue-50 px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-blue-700 font-medium shrink-0">URL odkazu:</span>
          <input autoFocus className="input py-1 text-sm flex-1" placeholder="https://..." value={popup.url} onChange={(e) => setPopup({ ...popup, url: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertLink(); } if (e.key === "Escape") setPopup(null); }} />
          <button type="button" className="btn-primary py-1 text-xs shrink-0" onClick={insertLink}><i className="fa-regular fa-check mr-1" />Vložit</button>
          <button type="button" className="btn-secondary py-1 text-xs shrink-0" onClick={() => setPopup(null)}>Zrušit</button>
        </div>
      )}

      {popup?.type === "image" && (
        <div className="border-b border-blue-100 bg-blue-50 px-3 py-2 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-700 font-medium shrink-0 w-28">URL obrázku:</span>
            <input autoFocus className="input py-1 text-sm flex-1" placeholder="https://...obrazek.jpg" value={popup.url} onChange={(e) => setPopup({ ...popup, url: e.target.value })} onKeyDown={(e) => { if (e.key === "Escape") setPopup(null); }} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-700 font-medium shrink-0 w-28">Odkaz (volitelný):</span>
            <input className="input py-1 text-sm flex-1" placeholder="https://..." value={popup.linkUrl} onChange={(e) => setPopup({ ...popup, linkUrl: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertImage(); } if (e.key === "Escape") setPopup(null); }} />
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-primary py-1 text-xs" onClick={insertImage}><i className="fa-regular fa-check mr-1" />Vložit obrázek</button>
            <button type="button" className="btn-secondary py-1 text-xs" onClick={() => setPopup(null)}>Zrušit</button>
          </div>
        </div>
      )}

      {sourceMode
        ? <textarea className="w-full min-h-64 max-h-96 p-4 text-xs font-mono focus:outline-none resize-none" value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
        : <div ref={ref} contentEditable suppressContentEditableWarning onInput={() => { if (ref.current) onChange(ref.current.innerHTML); }} className="min-h-[16rem] max-h-[48rem] overflow-y-auto p-4 text-sm focus:outline-none prose prose-sm max-w-none" style={{ lineHeight: 1.6 }} />
      }

      {vars && vars.length > 0 && (
        <div className="border-t-2 border-gray-300 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Proměnné — kliknutím vložíte do textu</p>
          <div className="space-y-1">
            {vars.map((v) => (
              <button key={v.key} type="button" onClick={() => insertVar(v.key)} className="flex items-center gap-3 w-full text-left px-2 py-1 rounded hover:bg-gray-200 transition-colors">
                <code className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">{v.key}</code>
                <span className="text-xs text-gray-500">{v.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
