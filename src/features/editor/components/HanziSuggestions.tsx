import { useEffect, useRef } from "react"
import type { HanziSuggestion } from "../domain/hanzi"

interface HanziSuggestionsProps {
    suggestions: HanziSuggestion[]
    selectedIndex: number
    onSelect: (suggestion: HanziSuggestion) => void
    onClose: () => void
    position: { top: number; left: number }
    loading?: boolean
}

export default function HanziSuggestions({
    suggestions,
    selectedIndex,
    onSelect,
    onClose,
    position,
    loading = false,
}: HanziSuggestionsProps) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onClose()
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [onClose])

    useEffect(() => {
        if (containerRef.current && selectedIndex >= 0) {
            const listElement = containerRef.current.querySelector('.suggestions-list') as HTMLElement
            if (listElement) {
                const selectedElement = listElement.children[selectedIndex] as HTMLElement
                if (selectedElement) {
                    selectedElement.scrollIntoView({ inline: "nearest", behavior: "smooth" })
                }
            }
        }
    }, [selectedIndex])

    if (loading) {
        return (
            <div
                ref={containerRef}
                className="fixed z-50 bg-card/80 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-3 animate-in fade-in-0 zoom-in-95 duration-200"
                style={{ top: position.top, left: position.left }}
            >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Gợi ý...</span>
                </div>
            </div>
        )
    }

    if (suggestions.length === 0) {
        return null
    }

    const selectedSuggestion = suggestions[selectedIndex]

    return (
        <div
            ref={containerRef}
            className="fixed z-50 flex flex-col gap-1 select-none pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-200"
            style={{ top: position.top, left: position.left }}
        >
            {/* Main Suggestion Bar */}
            <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-lg shadow-2xl overflow-hidden flex items-center p-1">
                <div className="suggestions-list flex items-center gap-0.5 max-w-[500px] overflow-x-auto no-scrollbar">
                    {suggestions.map((suggestion, index) => {
                        const isSelected = index === selectedIndex
                        const numberKey = index < 9 ? (index + 1).toString() : null

                        return (
                            <div
                                key={`${suggestion.word}-${index}`}
                                className={`
                                    flex items-center gap-1.5 px-3 py-1.5 cursor-pointer rounded-md transition-all duration-150 whitespace-nowrap
                                    ${isSelected
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "hover:bg-accent hover:text-accent-foreground"
                                    }
                                `}
                                onClick={() => onSelect(suggestion)}
                            >
                                {numberKey && (
                                    <span className={`text-[10px] font-bold opacity-60 ${isSelected ? "text-primary-foreground" : "text-primary"}`}>
                                        {numberKey}
                                    </span>
                                )}
                                <span className={`text-xl font-medium ${isSelected ? "" : "text-foreground"}`}>
                                    {suggestion.word}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Info Box (appears below the main bar for the selected item) */}
            {selectedSuggestion && (
                <div className="bg-popover/90 backdrop-blur-sm border border-border/50 rounded-md shadow-lg p-2 max-w-[350px] animate-in slide-in-from-top-1 duration-150">
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary">{selectedSuggestion.pinyin}</span>
                            {selectedSuggestion.isShorthand && (
                                <span className="px-1 py-0.5 text-[9px] rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">
                                    gõ tắt
                                </span>
                            )}
                        </div>
                        {selectedSuggestion.meaning && selectedSuggestion.meaning.length > 0 && (
                            <div className="text-[11px] text-muted-foreground line-clamp-1 italic">
                                {selectedSuggestion.meaning.slice(0, 2).join(", ")}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

