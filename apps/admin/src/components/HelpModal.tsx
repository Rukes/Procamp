import { useEffect, useRef, useState } from "react";
import { marked } from "marked";

import zacíname from "../help/zacínáme.md?raw";
import organizace from "../help/organizace.md?raw";
import objekty from "../help/objekty.md?raw";
import rezervace from "../help/rezervace.md?raw";
import uzivatele from "../help/uzivatele.md?raw";
import jazyky from "../help/jazyky.md?raw";
import emaily from "../help/emaily.md?raw";
import formular from "../help/formulár.md?raw";
import blokace from "../help/blokace.md?raw";
import novaRezervace from "../help/nova-rezervace.md?raw";
import integrace from "../help/integrace.md?raw";
import kalendar from "../help/kalendar.md?raw";

const TOPICS: Record<string, string> = {
  "zacínáme": zacíname,
  "organizace": organizace,
  "objekty": objekty,
  "rezervace": rezervace,
  "nova-rezervace": novaRezervace,
  "blokace": blokace,
  "uzivatele": uzivatele,
  "jazyky": jazyky,
  "emaily": emaily,
  "formular": formular,
  "integrace": integrace,
  "kalendar": kalendar,
};

interface Props {
  topic: keyof typeof TOPICS;
  onClose: () => void;
}

export default function HelpModal({ topic, onClose }: Props) {
  const content = TOPICS[topic] ?? "";
  const html = marked(content) as string;
  const articleRef = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { lightbox ? setLightbox(null) : onClose(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, lightbox]);

  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;
    const imgs = el.querySelectorAll("img");
    imgs.forEach((img) => {
      img.style.cursor = "zoom-in";
      img.onclick = () => setLightbox(img.src);
    });
  }, [html]);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 pt-6" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90dvh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-gray-700">
              <i className="fa-regular fa-circle-question" />
              <span className="font-semibold">Nápověda</span>
            </div>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
              <i className="fa-regular fa-xmark text-lg" />
            </button>
          </div>
          <div
            ref={articleRef}
            className="overflow-y-auto px-6 py-5 prose prose-sm max-w-none prose-headings:font-semibold prose-h1:text-xl prose-h2:text-base prose-h2:mt-6 prose-p:text-gray-700 prose-li:text-gray-700 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-table:text-sm prose-img:rounded-xl prose-img:border prose-img:border-gray-200 prose-img:shadow-sm prose-img:w-full"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} className="max-w-full max-h-full rounded-xl shadow-2xl" style={{ cursor: "zoom-out" }} />
        </div>
      )}
    </>
  );
}
