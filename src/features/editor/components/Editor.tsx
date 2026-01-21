import type React from "react"

import { forwardRef, useState, useEffect, useCallback, useRef } from "react"
import { convertTone } from "../domain/pinyin"
import { getPinyinAtCursor, insertHanziAtCursor, fetchHanziSuggestions, type HanziSuggestion } from "../domain/hanzi"
import HanziSuggestions from "./HanziSuggestions"

interface EditorProps {
  onInput: (e: React.FormEvent<HTMLDivElement>) => void
  content: string
  hanziInputEnabled: boolean
}

const Editor = forwardRef<HTMLDivElement, EditorProps>(({ onInput, content, hanziInputEnabled }, ref) => {
  const [suggestions, setSuggestions] = useState<HanziSuggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionsPosition, setSuggestionsPosition] = useState({ top: 0, left: 0 })
  const [loading, setLoading] = useState(false)
  const [currentPinyin, setCurrentPinyin] = useState<{ text: string; startPos: number; node: Node } | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch suggestions when pinyin changes
  const fetchSuggestions = useCallback(async (pinyin: string) => {
    if (!hanziInputEnabled || pinyin.length < 1) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setLoading(true)
    const results = await fetchHanziSuggestions(pinyin)
    setSuggestions(results)
    setShowSuggestions(results.length > 0)
    setSelectedIndex(0)
    setLoading(false)
  }, [hanziInputEnabled])

  // Handle input changes and detect pinyin
  const handleInputChange = (e: React.FormEvent<HTMLDivElement>) => {
    onInput(e)

    if (!hanziInputEnabled) {
      setShowSuggestions(false)
      return
    }

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    if (!range.collapsed) return // Only work with cursor, not selection

    const node = range.startContainer
    const cursorPos = range.startOffset

    const pinyinInfo = getPinyinAtCursor(node, cursorPos)

    if (pinyinInfo && pinyinInfo.text.length >= 1) {
      setCurrentPinyin({ ...pinyinInfo, node })

      // Debounce API calls
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(pinyinInfo.text)
      }, 300)

      // Position suggestions near cursor
      const rect = range.getBoundingClientRect()
      setSuggestionsPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX,
      })
    } else {
      setCurrentPinyin(null)
      setShowSuggestions(false)
      setSuggestions([])
    }
  }

  // Handle suggestion selection
  const selectSuggestion = useCallback((suggestion: HanziSuggestion) => {
    if (!currentPinyin) return

    const selection = window.getSelection()
    if (!selection) return

    const newCursorPos = insertHanziAtCursor(
      currentPinyin.node,
      currentPinyin.startPos + currentPinyin.text.length,
      currentPinyin.startPos,
      suggestion.word
    )

    // Restore cursor position
    const newRange = document.createRange()
    newRange.setStart(currentPinyin.node, newCursorPos)
    newRange.setEnd(currentPinyin.node, newCursorPos)
    selection.removeAllRanges()
    selection.addRange(newRange)

    // Trigger input event to update content
    if (ref && typeof ref !== "function" && ref.current) {
      onInput({
        currentTarget: ref.current,
      } as React.FormEvent<HTMLDivElement>)
    }

    // Clear suggestions
    setShowSuggestions(false)
    setSuggestions([])
    setCurrentPinyin(null)
  }, [currentPinyin, onInput, ref])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle Hanzi suggestions navigation
    if (showSuggestions && suggestions.length > 0) {
      // Number key selection (1-9)
      if (/^[1-9]$/.test(e.key)) {
        const index = parseInt(e.key) - 1
        if (index < suggestions.length) {
          e.preventDefault()
          selectSuggestion(suggestions[index])
          return
        }
      }

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % suggestions.length)
        return
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        selectSuggestion(suggestions[selectedIndex])
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setShowSuggestions(false)
        setSuggestions([])
        return
      }
    }

    // Original pinyin tone input handling
    if (["1", "2", "3", "4"].includes(e.key)) {
      const toneNum = Number.parseInt(e.key)
      const selection = window.getSelection()

      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)

        // Case 1: Text is selected -> convert selected text
        if (!range.collapsed) {
          const text = range.toString().trim()
          if (text && /[a-züv]+\d?/i.test(text)) {
            e.preventDefault()
            const newText = convertTone(text, toneNum)
            range.deleteContents()
            range.insertNode(document.createTextNode(newText))
            selection.collapseToEnd()
            onInput({
              currentTarget: e.currentTarget,
            } as React.FormEvent<HTMLDivElement>)
          }
          return;
        }

        // Case 2: No selection (cursor is at end of word) -> find word before cursor
        if (range.collapsed) {
          const node = range.startContainer
          if (node.nodeType === Node.TEXT_NODE && node.textContent) {
            const cursorPos = range.startOffset
            const textBefore = node.textContent.substring(0, cursorPos)

            // Regex to find the last pinyin-like syllable
            const match = textBefore.match(/([a-zA-ZüÜvV]+)$/)

            if (match) {
              e.preventDefault()
              const word = match[0]
              const newWord = convertTone(word, toneNum)

              // Replace the text
              const newTextBefore = textBefore.substring(0, textBefore.length - word.length) + newWord
              const fullText = newTextBefore + node.textContent.substring(cursorPos)

              node.textContent = fullText

              // Restore cursor position
              const newCursorPos = newTextBefore.length
              const newRange = document.createRange()
              newRange.setStart(node, newCursorPos)
              newRange.setEnd(node, newCursorPos)
              selection.removeAllRanges()
              selection.addRange(newRange)

              onInput({
                currentTarget: e.currentTarget,
              } as React.FormEvent<HTMLDivElement>)
            }
          }
        }
      }
    }
  }

  // Close suggestions when Hanzi input is disabled
  useEffect(() => {
    if (!hanziInputEnabled) {
      setShowSuggestions(false)
      setSuggestions([])
      setCurrentPinyin(null)
    }
  }, [hanziInputEnabled])

  return (
    <div className="flex-1 overflow-hidden flex flex-col relative">
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInputChange}
        onKeyDown={handleKeyDown}
        className="flex-1 overflow-auto p-8 text-lg leading-relaxed outline-none bg-card text-foreground selection:bg-primary/20 ring-2 ring-primary/50 rounded-lg m-4"
        role="textbox"
        aria-label="Text editor"
        style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
      />
      <div className="px-8 py-3 text-sm text-muted-foreground">{content.length} ký tự</div>

      {showSuggestions && (
        <HanziSuggestions
          suggestions={suggestions}
          selectedIndex={selectedIndex}
          onSelect={selectSuggestion}
          onClose={() => setShowSuggestions(false)}
          position={suggestionsPosition}
          loading={loading}
        />
      )}
    </div>
  )
})

Editor.displayName = "Editor"

export default Editor

