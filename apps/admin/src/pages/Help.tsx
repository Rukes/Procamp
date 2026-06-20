import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { marked } from "marked";

import zacíname from "../help/zacínáme.md?raw";
import organizace from "../help/organizace.md?raw";
import objekty from "../help/objekty.md?raw";
import rezervace from "../help/rezervace.md?raw";
import uzivatele from "../help/uzivatele.md?raw";
import jazyky from "../help/jazyky.md?raw";
import emaily from "../help/emaily.md?raw";
import formular from "../help/formulár.md?raw";
const TOPICS = [
  { id: "zacínáme",   label: "Začínáme",              icon: "fa-rocket",        content: zacíname },
  { id: "organizace", label: "Organizace",             icon: "fa-building",      content: organizace },
  { id: "objekty",    label: "Objekty",                icon: "fa-tent",          content: objekty },
  { id: "rezervace",  label: "Rezervace",              icon: "fa-calendar",      content: rezervace },
  { id: "uzivatele",  label: "Uživatelé & oprávnění",  icon: "fa-user",          content: uzivatele },
  { id: "jazyky",     label: "Jazyky & měny",          icon: "fa-globe",         content: jazyky },
  { id: "emaily",     label: "E-mailové šablony",      icon: "fa-envelope",      content: emaily },
  { id: "formular",   label: "Formulář na web",        icon: "fa-code",          content: formular },
];

export default function HelpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const hashId = location.hash.replace("#", "") || TOPICS[0].id;
  const [activeId, setActiveId] = useState(hashId);

  useEffect(() => {
    const id = location.hash.replace("#", "");
    if (id && TOPICS.find((t) => t.id === id)) setActiveId(id);
  }, [location.hash]);

  const select = (id: string) => {
    setActiveId(id);
    navigate(`/help#${id}`, { replace: true });
    window.scrollTo(0, 0);
  };

  const topic = TOPICS.find((t) => t.id === activeId) ?? TOPICS[0];
  const html = marked(topic.content) as string;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 text-white flex flex-col fixed top-0 left-0 h-screen z-10">
        <div className="px-4 py-4 border-b border-gray-700">
          <span className="text-lg font-bold text-blue-400">ProCamp</span>
          <p className="text-xs text-gray-400 mt-0.5">Nápověda</p>
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
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors"
          >
            <i className="fa-regular fa-arrow-left" /> Zpět do administrace
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 ml-60 py-10 px-12 max-w-4xl">
        <article
          className="prose prose-gray max-w-none
            prose-headings:font-bold prose-headings:text-gray-900
            prose-h1:text-3xl prose-h1:mb-6
            prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-2
            prose-h3:text-base prose-h3:mt-5 prose-h3:mb-2
            prose-p:text-gray-700 prose-p:leading-relaxed
            prose-li:text-gray-700
            prose-table:text-sm prose-th:bg-gray-50 prose-th:font-semibold prose-th:text-gray-600 prose-td:text-gray-700
            prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-blue-700 prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:p-4"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>
    </div>
  );
}
