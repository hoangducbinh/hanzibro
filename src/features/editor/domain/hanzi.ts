
import { dictionaryService, type DictionaryResult } from "../../dictionary/api/dictionary.service"

export interface HanziSuggestion extends DictionaryResult { }

/**
 * Normalize pinyin text by removing tone marks and converting ü to v
 */
export function normalizePinyin(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/ü/g, "v")
        .replace(/ǖ/g, "v")
        .replace(/ǘ/g, "v")
        .replace(/ǚ/g, "v")
        .replace(/ǜ/g, "v")
        .trim()
}

/**
 * Extract pinyin text before cursor position
 * Returns the pinyin syllable being typed
 */
export function getPinyinAtCursor(node: Node, cursorPos: number): { text: string; startPos: number } | null {
    if (node.nodeType !== Node.TEXT_NODE || !node.textContent) {
        return null
    }

    const textBefore = node.textContent.substring(0, cursorPos)

    // Match pinyin letters (a-z, ü, v) at the end of text
    // Stop at space, punctuation, or Chinese characters
    const match = textBefore.match(/([a-zA-ZüÜvV]+)$/)

    if (match && match[0].length >= 1) {
        const pinyinText = match[0]
        const startPos = cursorPos - pinyinText.length
        return { text: pinyinText, startPos }
    }

    return null
}

/**
 * Insert Hanzi at cursor position, replacing the pinyin text
 */
export function insertHanziAtCursor(
    node: Node,
    cursorPos: number,
    pinyinStartPos: number,
    hanzi: string
): number {
    if (node.nodeType !== Node.TEXT_NODE || !node.textContent) {
        return cursorPos
    }

    const textBefore = node.textContent.substring(0, pinyinStartPos)
    const textAfter = node.textContent.substring(cursorPos)

    // Replace pinyin with hanzi
    node.textContent = textBefore + hanzi + textAfter

    // Return new cursor position (after the inserted hanzi)
    return pinyinStartPos + hanzi.length
}

/**
 * Fetch Hanzi suggestions from DictionaryService
 */
export async function fetchHanziSuggestions(pinyin: string): Promise<HanziSuggestion[]> {
    try {
        return await dictionaryService.searchHanziByPinyin(pinyin)
    } catch (error) {
        console.error("Error fetching Hanzi suggestions:", error)
        return []
    }
}

