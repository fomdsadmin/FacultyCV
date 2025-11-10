import React, { useEffect } from "react";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import "./HeaderEditor.css";

const MenuBar = ({ editor }) => {
    const editorState = useEditorState({
        editor,
        selector: (ctx) => ({
            isBold: ctx.editor.isActive("bold") ?? false,
            canBold: ctx.editor.can().chain().toggleBold().run() ?? false,
            isItalic: ctx.editor.isActive("italic") ?? false,
            canItalic: ctx.editor.can().chain().toggleItalic().run() ?? false,
            isStrike: ctx.editor.isActive("strike") ?? false,
            canStrike: ctx.editor.can().chain().toggleStrike().run() ?? false,
            isCode: ctx.editor.isActive("code") ?? false,
            canCode: ctx.editor.can().chain().toggleCode().run() ?? false,
            canClearMarks: ctx.editor.can().chain().unsetAllMarks().run() ?? false,
            isParagraph: ctx.editor.isActive("paragraph") ?? false,
            isHeading1: ctx.editor.isActive("heading", { level: 1 }) ?? false,
            isHeading2: ctx.editor.isActive("heading", { level: 2 }) ?? false,
            isHeading3: ctx.editor.isActive("heading", { level: 3 }) ?? false,
            isHeading4: ctx.editor.isActive("heading", { level: 4 }) ?? false,
            isHeading5: ctx.editor.isActive("heading", { level: 5 }) ?? false,
            isHeading6: ctx.editor.isActive("heading", { level: 6 }) ?? false,
            isBulletList: ctx.editor.isActive("bulletList") ?? false,
            isOrderedList: ctx.editor.isActive("orderedList") ?? false,
            isCodeBlock: ctx.editor.isActive("codeBlock") ?? false,
            isBlockquote: ctx.editor.isActive("blockquote") ?? false,
            canUndo: ctx.editor.can().chain().undo().run() ?? false,
            canRedo: ctx.editor.can().chain().redo().run() ?? false,
        }),
    });

    return (
        <div className="control-group">
            <div className="button-group">
                <button
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    disabled={!editorState.canBold}
                    className={editorState.isBold ? "is-active" : ""}
                >
                    Bold
                </button>
                <button
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    disabled={!editorState.canItalic}
                    className={editorState.isItalic ? "is-active" : ""}
                >
                    Italic
                </button>
                <button
                    onClick={() => editor?.chain().focus().toggleStrike().run()}
                    disabled={!editorState.canStrike}
                    className={editorState.isStrike ? "is-active" : ""}
                >
                    Strike
                </button>
                <button onClick={() => editor?.chain().focus().unsetAllMarks().run()}>
                    Clear marks
                </button>
                <button onClick={() => editor?.chain().focus().clearNodes().run()}>
                    Clear nodes
                </button>
                <button
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={editorState.isHeading1 ? "is-active" : ""}
                >
                    H1
                </button>
                <button
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={editorState.isHeading2 ? "is-active" : ""}
                >
                    H2
                </button>
                <button
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={editorState.isHeading3 ? "is-active" : ""}
                >
                    H3
                </button>
                <button
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 4 }).run()}
                    className={editorState.isHeading4 ? "is-active" : ""}
                >
                    H4
                </button>
                <button
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 5 }).run()}
                    className={editorState.isHeading5 ? "is-active" : ""}
                >
                    H5
                </button>
                <button
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 6 }).run()}
                    className={editorState.isHeading6 ? "is-active" : ""}
                >
                    H6
                </button>
                <button
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    className={editorState.isBulletList ? "is-active" : ""}
                >
                    Bullet list
                </button>
                <button
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    className={editorState.isOrderedList ? "is-active" : ""}
                >
                    Ordered list
                </button>
                <button
                    onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                    className={editorState.isBlockquote ? "is-active" : ""}
                >
                    Blockquote
                </button>
                <button onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
                    Horizontal rule
                </button>
                <button onClick={() => editor?.chain().focus().setHardBreak().run()}>
                    Hard break
                </button>
                <button
                    onClick={() => editor?.chain().focus().undo().run()}
                    disabled={!editorState.canUndo}
                >
                    Undo
                </button>
                <button
                    onClick={() => editor?.chain().focus().redo().run()}
                    disabled={!editorState.canRedo}
                >
                    Redo
                </button>
            </div>
        </div>
    );
};

const HeaderEditor = ({ header = "", onHeaderChange }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
            }),
        ],
        content: header,
        onUpdate: ({ editor }) => {
            // Auto-save on every character typed
            onHeaderChange(editor.getHTML());
        },
    });

    // Update editor content if header prop changes externally
    useEffect(() => {
        if (editor && header && editor.getHTML() !== header) {
            editor.commands.setContent(header);
        }
    }, [header, editor]);

    return (
        <div style={{ marginBottom: 16, padding: "12px", backgroundColor: "#f5f5f5", borderRadius: 4, border: "1px solid #e0e0e0" }}>
            <div style={{ marginBottom: 12 }}>
                <strong style={{ fontSize: 12, color: "#333" }}>Table Header (Rich Text)</strong>
                <p style={{ color: "#666", fontSize: 11, marginTop: 4, marginBottom: 8 }}>
                    Add formatted text, links, or instructions that will appear above the table.
                </p>
            </div>

            <div className="tiptap-editor-container" style={{
                backgroundColor: "white",
                borderRadius: 4,
                border: "1px solid #ddd",
                overflow: "hidden"
            }}>
                {editor && <MenuBar editor={editor} />}
                <EditorContent
                    editor={editor}
                    className="tiptap"
                    style={{
                        padding: "12px",
                        minHeight: "200px",
                        fontSize: "12px",
                        color: "#333"
                    }}
                />
            </div>
        </div>
    );
};

export default HeaderEditor;
