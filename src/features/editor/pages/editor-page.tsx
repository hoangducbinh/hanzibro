
import { useState, useRef, useEffect } from "react"
import Editor from "../components/Editor"
import Toolbar from "../components/Toolbar"
import { Dictionary } from "@/features/dictionary"

export default function EditorPage() {
    const editorRef = useRef<HTMLDivElement>(null)
    const [content, setContent] = useState("")
    const [hanziInputEnabled, setHanziInputEnabled] = useState(true)

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const text = e.currentTarget.textContent || ""
        setContent(text)
    }

    const toggleHanziInput = () => {
        setHanziInputEnabled((prev) => !prev)
    }

    useEffect(() => {
        editorRef.current?.focus()
    }, [])

    return (
        <div className="flex h-screen bg-background">
            {/* Main Editor */}
            <div className="flex-1 flex flex-col">
                <Toolbar
                    editorRef={editorRef}
                    content={content}
                    hanziInputEnabled={hanziInputEnabled}
                    onToggleHanziInput={toggleHanziInput}
                />
                <Editor
                    ref={editorRef}
                    onInput={handleInput}
                    content={content}
                    hanziInputEnabled={hanziInputEnabled}
                />
            </div>

            {/* Dictionary Sidebar */}
            <Dictionary />
        </div>
    )
}
