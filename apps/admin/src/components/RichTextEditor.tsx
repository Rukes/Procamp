import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

const Btn = ({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`px-2 py-1 rounded text-sm transition-colors ${active ? "bg-gray-200 text-gray-900" : "text-gray-600 hover:bg-gray-100"}`}
  >
    {children}
  </button>
);

export default function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-blue-600 underline" } }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value]);

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("URL odkazu", prev ?? "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex flex-wrap gap-0.5 p-2 border-b border-gray-100 bg-gray-50">
        <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Tučně"><i className="fa-regular fa-bold" /></Btn>
        <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Kurzíva"><i className="fa-regular fa-italic" /></Btn>
        <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Podtržení"><i className="fa-regular fa-underline" /></Btn>
        <div className="w-px bg-gray-200 mx-1" />
        <Btn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Nadpis 2">H2</Btn>
        <Btn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Nadpis 3">H3</Btn>
        <div className="w-px bg-gray-200 mx-1" />
        <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Seznam"><i className="fa-regular fa-list" /></Btn>
        <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Číslovaný seznam"><i className="fa-regular fa-list-ol" /></Btn>
        <div className="w-px bg-gray-200 mx-1" />
        <Btn active={editor.isActive("link")} onClick={setLink} title="Odkaz"><i className="fa-regular fa-link" /></Btn>
        <Btn active={false} onClick={() => editor.chain().focus().unsetLink().run()} title="Zrušit odkaz"><i className="fa-regular fa-link-slash" /></Btn>
        <div className="w-px bg-gray-200 mx-1" />
        <Btn active={false} onClick={() => editor.chain().focus().undo().run()} title="Zpět"><i className="fa-regular fa-arrow-rotate-left" /></Btn>
        <Btn active={false} onClick={() => editor.chain().focus().redo().run()} title="Vpřed"><i className="fa-regular fa-arrow-rotate-right" /></Btn>
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-48 max-h-96 overflow-y-auto focus-within:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-40"
      />
    </div>
  );
}
