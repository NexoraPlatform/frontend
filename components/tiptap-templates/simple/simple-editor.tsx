"use client";

import { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CharacterCount from "@tiptap/extension-character-count";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import { Markdown } from "@tiptap/markdown";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { lowlight } from "lowlight/lib/common";

import "./simple-editor.css";

type SimpleEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
};

const getMarkdownFromStorage = (storage: Record<string, unknown>) => {
  const markdownStorage = storage as { markdown?: { getMarkdown: () => string } };
  return markdownStorage.markdown?.getMarkdown?.();
};

const getCharacterCount = (storage: Record<string, unknown>) => {
  const characterStorage = storage as { characterCount?: { characters: () => number } };
  return characterStorage.characterCount?.characters?.() ?? 0;
};

export function SimpleEditor({ value, onChange, placeholder, readOnly }: SimpleEditorProps) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Markdown.configure({ html: true, transformCopiedText: true }),
      Image.configure({ inline: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CharacterCount,
      Placeholder.configure({
        placeholder: placeholder ?? "Scrie aici...",
      }),
    ],
    [placeholder],
  );

  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");

  const editor = useEditor({
    extensions,
    content: value ?? "",
    editable: !readOnly,
    editorProps: {
      attributes: {
        class:
          "tiptap-editor prose prose-slate max-w-none focus:outline-none dark:prose-invert",
        dir: direction,
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange?.(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          class:
            "tiptap-editor prose prose-slate max-w-none focus:outline-none dark:prose-invert",
          dir: direction,
        },
      },
    });
  }, [direction, editor]);

  useEffect(() => {
    if (!editor || value === undefined) return;
    const currentValue = editor.getHTML();
    if (currentValue !== value) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  const handleAddImage = () => {
    if (!editor) return;
    const url = window.prompt("URL imagine");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleCopyMarkdown = async () => {
    if (!editor) return;
    const markdown = getMarkdownFromStorage(editor.storage);
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
  };

  const characterCount = editor ? getCharacterCount(editor.storage) : 0;

  return (
    <div className="tiptap-wrapper">
      <div className="tiptap-toolbar">
        <button
          type="button"
          className={editor?.isActive("bold") ? "is-active" : ""}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={!editor || readOnly}
        >
          Bold
        </button>
        <button
          type="button"
          className={editor?.isActive("italic") ? "is-active" : ""}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={!editor || readOnly}
        >
          Italic
        </button>
        <button
          type="button"
          className={editor?.isActive("strike") ? "is-active" : ""}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          disabled={!editor || readOnly}
        >
          Strike
        </button>
        <button
          type="button"
          className={editor?.isActive("heading", { level: 2 }) ? "is-active" : ""}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={!editor || readOnly}
        >
          H2
        </button>
        <button
          type="button"
          className={editor?.isActive("bulletList") ? "is-active" : ""}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          disabled={!editor || readOnly}
        >
          • List
        </button>
        <button
          type="button"
          className={editor?.isActive("orderedList") ? "is-active" : ""}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          disabled={!editor || readOnly}
        >
          1. List
        </button>
        <button
          type="button"
          className={editor?.isActive("taskList") ? "is-active" : ""}
          onClick={() => editor?.chain().focus().toggleTaskList().run()}
          disabled={!editor || readOnly}
        >
          Tasks
        </button>
        <button type="button" onClick={handleAddImage} disabled={!editor || readOnly}>
          Image
        </button>
        <button
          type="button"
          className={editor?.isActive("codeBlock") ? "is-active" : ""}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          disabled={!editor || readOnly}
        >
          Code
        </button>
        <button
          type="button"
          onClick={() => setDirection("ltr")}
          disabled={!editor || readOnly}
        >
          LTR
        </button>
        <button
          type="button"
          onClick={() => setDirection("rtl")}
          disabled={!editor || readOnly}
        >
          RTL
        </button>
        <button type="button" onClick={handleCopyMarkdown} disabled={!editor}>
          Markdown
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor || readOnly}
        >
          Undo
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor || readOnly}
        >
          Redo
        </button>
      </div>
      <EditorContent editor={editor} />
      <div className="tiptap-footer">Caractere: {characterCount}</div>
    </div>
  );
}
