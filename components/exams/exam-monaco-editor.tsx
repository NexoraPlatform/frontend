'use client';

import Editor, { loader } from '@monaco-editor/react';

loader.config({
    paths: {
        vs: '/monaco/vs',
    },
});

type ExamMonacoEditorProps = {
    language: string;
    value: string;
    onChange?: (value: string) => void;
};

export default function ExamMonacoEditor({
    language,
    value,
    onChange,
}: ExamMonacoEditorProps) {
    return (
        <Editor
            height="420px"
            theme="vs-dark"
            language={language}
            value={value}
            onChange={(nextValue) => onChange?.(nextValue ?? '')}
            options={{
                automaticLayout: true,
                contextmenu: false,
                fontSize: 15,
                minimap: { enabled: false },
                padding: {
                    top: 16,
                },
                scrollBeyondLastLine: false,
            }}
        />
    );
}
