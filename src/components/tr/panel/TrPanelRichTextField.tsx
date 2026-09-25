"use client";

import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { panelFieldClass, panelHintClass } from "@/components/tr/panel/panelUi";

interface ToolbarState {
  isEmpty: boolean;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  h2: boolean;
  h3: boolean;
  bulletList: boolean;
  orderedList: boolean;
  blockquote: boolean;
  link: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

const IDLE_TOOLBAR: ToolbarState = {
  isEmpty: true,
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  h2: false,
  h3: false,
  bulletList: false,
  orderedList: false,
  blockquote: false,
  link: false,
  canUndo: false,
  canRedo: false,
};

/**
 * The panel's rich-text field (product description now, category description and
 * more later). It edits HTML restricted to what `richTextSanitize.ts` allows —
 * paragraphs, two heading levels, bold / italic / underline / strike, lists, quotes
 * and links — and the server sanitizes again on every write.
 *
 * `initialHtml` is read once: the field owns its content afterwards and reports each
 * edit through `onChange` (`""` when empty). Remount it (a new `key`) to load other
 * content. Load it lazily (`next/dynamic`, `ssr: false`) — the editor is a sizeable
 * bundle that only editor pages need.
 */
export function TrPanelRichTextField({
  initialHtml,
  onChange,
  placeholder = "",
  disabled = false,
  labelledBy,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Id of the element that labels the field. */
  labelledBy?: string;
}) {
  // The toolbar state below is read before the editor has its content; one re-render
  // once it exists (see `onCreate`) makes it start from the real document.
  const [, setCreated] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        // A synthetic empty paragraph after a list would count as an edit on load.
        trailingNode: false,
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
        },
      }),
    ],
    content: initialHtml,
    editable: !disabled,
    // Rendered on the client only; avoids a server/client markup mismatch.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tr-rich-content min-h-[9rem] px-3 py-3 outline-none",
        role: "textbox",
        "aria-multiline": "true",
        ...(labelledBy ? { "aria-labelledby": labelledBy } : {}),
      },
    },
    onCreate: () => setCreated(true),
    onUpdate: ({ editor: current }) => {
      onChange(current.isEmpty ? "" : current.getHTML());
    },
  });

  useEffect(() => {
    // `false`: switching editability is not a content edit, so it must not report one.
    if (editor && editor.isEditable === disabled) editor.setEditable(!disabled, false);
  }, [editor, disabled]);

  const state = useEditorState<ToolbarState>({
    editor,
    selector: ({ editor: current }): ToolbarState => ({
      isEmpty: current?.isEmpty ?? true,
      bold: current?.isActive("bold") ?? false,
      italic: current?.isActive("italic") ?? false,
      underline: current?.isActive("underline") ?? false,
      strike: current?.isActive("strike") ?? false,
      h2: current?.isActive("heading", { level: 2 }) ?? false,
      h3: current?.isActive("heading", { level: 3 }) ?? false,
      bulletList: current?.isActive("bulletList") ?? false,
      orderedList: current?.isActive("orderedList") ?? false,
      blockquote: current?.isActive("blockquote") ?? false,
      link: current?.isActive("link") ?? false,
      canUndo: current?.can().undo() ?? false,
      canRedo: current?.can().redo() ?? false,
    }),
  }) ?? IDLE_TOOLBAR;

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const linkInputId = useId();

  if (!editor) {
    return (
      <div
        className={`${panelFieldClass} min-h-[12rem] animate-pulse bg-neutral-50`}
        aria-hidden
      />
    );
  }

  const openLink = () => {
    setLinkUrl((editor.getAttributes("link").href as string | undefined) ?? "");
    setLinkOpen(true);
  };

  const applyLink = () => {
    const url = normalizeUrl(linkUrl);
    const chain = editor.chain().focus().extendMarkRange("link");
    if (url) chain.setLink({ href: url }).run();
    else chain.unsetLink().run();
    setLinkOpen(false);
  };

  const tools: Array<{
    label: string;
    Icon: LucideIcon;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    gapBefore?: boolean;
  }> = [
    { label: "Kalın", Icon: Bold, active: state.bold, onClick: () => editor.chain().focus().toggleBold().run() },
    { label: "İtalik", Icon: Italic, active: state.italic, onClick: () => editor.chain().focus().toggleItalic().run() },
    { label: "Altı çizili", Icon: Underline, active: state.underline, onClick: () => editor.chain().focus().toggleUnderline().run() },
    { label: "Üstü çizili", Icon: Strikethrough, active: state.strike, onClick: () => editor.chain().focus().toggleStrike().run() },
    { label: "Başlık", Icon: Heading2, active: state.h2, gapBefore: true, onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "Alt başlık", Icon: Heading3, active: state.h3, onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: "Madde işaretli liste", Icon: List, active: state.bulletList, gapBefore: true, onClick: () => editor.chain().focus().toggleBulletList().run() },
    { label: "Numaralı liste", Icon: ListOrdered, active: state.orderedList, onClick: () => editor.chain().focus().toggleOrderedList().run() },
    { label: "Alıntı", Icon: Quote, active: state.blockquote, onClick: () => editor.chain().focus().toggleBlockquote().run() },
    { label: "Bağlantı", Icon: Link2, active: state.link, gapBefore: true, onClick: openLink },
    { label: "Geri al", Icon: Undo2, disabled: !state.canUndo, gapBefore: true, onClick: () => editor.chain().focus().undo().run() },
    { label: "Yinele", Icon: Redo2, disabled: !state.canRedo, onClick: () => editor.chain().focus().redo().run() },
  ];

  return (
    <div
      className={`overflow-hidden rounded-lg border border-neutral-200 bg-white transition-colors focus-within:border-[color:var(--panel-accent)] ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <div
        role="toolbar"
        aria-label="Metin biçimi"
        className="flex flex-wrap items-center gap-0.5 border-b border-neutral-200 bg-neutral-50 px-1.5 py-1"
      >
        {tools.map(({ label, Icon, active, disabled: toolDisabled, onClick, gapBefore }) => (
          <span key={label} className={gapBefore ? "ml-1.5 border-l border-neutral-200 pl-1.5" : ""}>
            <button
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={active === undefined ? undefined : active}
              disabled={disabled || toolDisabled}
              // Keep the selection in the editor when a tool is pressed.
              onMouseDown={(event) => event.preventDefault()}
              onClick={onClick}
              className={`flex size-8 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-200/70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--panel-accent)] disabled:pointer-events-none disabled:opacity-35 ${
                active ? "bg-[color:var(--panel-accent-soft)] text-[color:var(--panel-accent-deep)]" : ""
              }`}
            >
              <Icon className="size-4" aria-hidden />
            </button>
          </span>
        ))}
      </div>

      {linkOpen ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-white px-3 py-2">
          <label htmlFor={linkInputId} className="sr-only">
            Bağlantı adresi
          </label>
          <input
            id={linkInputId}
            autoFocus
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              } else if (event.key === "Escape") {
                event.preventDefault();
                setLinkOpen(false);
                editor.commands.focus();
              }
            }}
            placeholder="https://"
            inputMode="url"
            className={`${panelFieldClass} min-w-0 flex-1 basis-56`}
          />
          <button
            type="button"
            onClick={applyLink}
            className="h-9 rounded-lg bg-[color:var(--panel-accent)] px-3 text-[13px] font-semibold text-white hover:bg-[color:var(--panel-accent-hover)]"
          >
            {linkUrl.trim() ? "Uygula" : "Bağlantıyı kaldır"}
          </button>
          <button
            type="button"
            onClick={() => {
              setLinkOpen(false);
              editor.commands.focus();
            }}
            className="h-9 rounded-lg px-3 text-[13px] font-semibold text-neutral-600 hover:bg-neutral-100"
          >
            Vazgeç
          </button>
        </div>
      ) : null}

      <div className="relative">
        {/* Read from the editor itself: `state.isEmpty` only re-renders us when it flips. */}
        {editor.isEmpty && placeholder ? (
          <p
            className={`${panelHintClass} pointer-events-none absolute top-3 left-3 text-neutral-400`}
            aria-hidden
          >
            {placeholder}
          </p>
        ) : null}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

/** A typed address as a link target: `ornek.com` becomes `https://ornek.com`. */
function normalizeUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  return `https://${value.replace(/^\/+/, "")}`;
}
