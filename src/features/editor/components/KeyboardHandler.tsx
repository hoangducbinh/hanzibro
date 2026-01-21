import type React from "react"

import { useEffect } from "react"

interface KeyboardHandlerProps {
  onTone: (toneIndex: number) => void
  lastCharacter: string
  editorRef: React.RefObject<HTMLDivElement>
}

export function useKeyboardHandler({ onTone, lastCharacter, editorRef }: KeyboardHandlerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Kiểm tra xem phím nào được nhấn (1-4)
      if (["1", "2", "3", "4"].includes(e.key) && editorRef.current?.contains(document.activeElement)) {
        // Bạn có thể gọi hàm onTone nếu cần
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onTone, lastCharacter, editorRef])
}
