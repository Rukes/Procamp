import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark-dimmed.css";
import "../hljs-override.css";

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
const TOPICS = [
  { id: "zacínáme",        label: "Začínáme",              icon: "fa-rocket",         content: zacíname },
  { id: "organizace",      label: "Organizace",             icon: "fa-building",       content: organizace },
  { id: "objekty",         label: "Objekty",                icon: "fa-tent",           content: objekty },
  { id: "rezervace",       label: "Rezervace",              icon: "fa-calendar",       content: rezervace },
  { id: "nova-rezervace",  label: "Nová rezervace",         icon: "fa-calendar-plus",  content: novaRezervace },
  { id: "kalendar",        label: "Kalendář",               icon: "fa-calendar-days",  content: kalendar },
  { id: "blokace",         label: "Blokace termínů",        icon: "fa-calendar-xmark", content: blokace },
  { id: "uzivatele",  label: "Uživatelé & oprávnění",  icon: "fa-user",          content: uzivatele },
  { id: "jazyky",     label: "Jazyky & měny",          icon: "fa-globe",         content: jazyky },
  { id: "emaily",     label: "E-mailové šablony",      icon: "fa-envelope",      content: emaily },
  { id: "formular",   label: "Formulář na web",        icon: "fa-code",          content: formular },
  { id: "integrace",  label: "Integrace",              icon: "fa-plug",          content: integrace },
];

export default function HelpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const hashId = location.hash.replace("#", "") || TOPICS[0].id;
  const [activeId, setActiveId] = useState(hashId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const id = location.hash.replace("#", "");
    if (id && TOPICS.find((t) => t.id === id)) setActiveId(id);
  }, [location.hash]);

  const select = (id: string) => {
    setActiveId(id);
    setDrawerOpen(false);
    navigate(`/help#${id}`, { replace: true });
    window.scrollTo(0, 0);
  };

  const topic = TOPICS.find((t) => t.id === activeId) ?? TOPICS[0];
  const html = marked(topic.content) as string;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const article = articleRef.current;
    if (!article) return;

    // Lightbox na obrázky
    article.querySelectorAll("img").forEach((img) => {
      img.style.cursor = "zoom-in";
      img.onclick = () => setLightbox(img.src);
    });

    // Syntax highlight + reset prose overrides
    article.querySelectorAll("pre code").forEach((block) => {
      const el = block as HTMLElement;
      hljs.highlightElement(el);
      el.style.background = "";
      el.style.color = "";
      el.style.padding = "";
    });

    // Copy buttons
    article.querySelectorAll("pre").forEach((pre) => {
      if (pre.querySelector("[data-copy-btn]")) return;
      pre.style.position = "relative";
      pre.style.overflowX = "auto";
      pre.style.maxWidth = (article.clientWidth) + "px";
      const btn = document.createElement("button");
      btn.dataset.copyBtn = "1";
      btn.innerHTML = '<i class="fa-regular fa-copy"></i>';
      btn.title = "Kopírovat";
      btn.style.cssText = "position:absolute;top:10px;right:10px;background:rgba(255,255,255,0.12);border:none;color:#cbd5e1;padding:4px 8px;border-radius:6px;cursor:pointer;font-size:13px;line-height:1;transition:background 0.15s";
      btn.onmouseenter = () => { btn.style.background = "rgba(255,255,255,0.22)"; };
      btn.onmouseleave = () => { btn.style.background = "rgba(255,255,255,0.12)"; };
      btn.onclick = () => {
        const text = pre.querySelector("code")?.innerText ?? pre.innerText;
        navigator.clipboard.writeText(text).then(() => {
          btn.innerHTML = '<i class="fa-regular fa-check"></i>';
          btn.style.color = "#4ade80";
          setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i>'; btn.style.color = "#cbd5e1"; }, 1500);
        });
      };
      pre.appendChild(btn);
    });
  }, [html]);

  const sidebarContent = (
    <>
      <div className="px-4 py-4 border-b border-gray-700 flex items-center justify-between">
        <div>
          <span className="text-lg font-bold text-blue-400">Ubysoft.cz</span>
          <p className="text-xs text-gray-400 mt-0.5">Nápověda</p>
        </div>
        <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setDrawerOpen(false)}>
          <i className="fa-regular fa-xmark text-lg" />
        </button>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {TOPICS.map((t) => (
          <button
            key={t.id}
            onClick={() => select(t.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
              activeId === t.id ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <i className={`fa-regular ${t.icon} w-4 text-center`} />
            {t.label}
          </button>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-700">
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors"
        >
          <i className="fa-regular fa-arrow-left" /> Zpět do administrace
        </button>
      </div>
    </>
  );

  return (
    <>
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-gray-900 text-white flex-col fixed top-0 left-0 h-screen z-10">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-gray-900 text-white flex items-center px-4 gap-3 z-20">
        <button onClick={() => setDrawerOpen(true)} className="text-gray-300 hover:text-white p-1">
          <i className="fa-regular fa-bars text-lg" />
        </button>
        <span className="font-semibold text-blue-400 text-sm">Nápověda</span>
        <span className="text-gray-400 text-xs">— {topic.label}</span>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div className="w-64 bg-gray-900 text-white flex flex-col h-full">{sidebarContent}</div>
          <div className="flex-1 bg-black/50" onClick={() => setDrawerOpen(false)} />
        </div>
      )}

      {/* Content */}
      <main className="flex-1 md:ml-60 mt-14 md:mt-0 py-6 md:py-10 px-4 md:px-12 max-w-4xl">
        <article
          ref={articleRef}
          className="prose prose-gray max-w-none overflow-x-hidden
            prose-headings:font-bold prose-headings:text-gray-900
            prose-h1:text-3xl prose-h1:mb-6
            prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-2
            prose-h3:text-base prose-h3:mt-5 prose-h3:mb-2
            prose-p:text-gray-700 prose-p:leading-relaxed
            prose-li:text-gray-700
            prose-table:text-sm prose-th:bg-gray-50 prose-th:font-semibold prose-th:text-gray-600 prose-td:text-gray-700
            prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-blue-700 prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
            prose-pre:!bg-transparent prose-pre:!p-0 prose-pre:rounded-xl prose-pre:overflow-hidden
            [&_pre]:overflow-x-auto [&_pre_.hljs]:rounded-xl [&_pre_.hljs]:p-5 [&_pre_.hljs]:text-sm
            [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit [&_pre_code]:text-sm [&_pre_code]:before:content-none [&_pre_code]:after:content-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>
    </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} className="max-w-full max-h-full rounded-xl shadow-2xl" style={{ cursor: "zoom-out" }} />
        </div>
      )}
    </>
  );
}
