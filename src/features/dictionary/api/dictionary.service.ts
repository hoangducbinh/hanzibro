
export interface DictionaryResult {
    word: string
    pinyin: string
    meaning: string[]
    example?: string
    traditional?: string
    // For ranking/sorting
    score?: number
    // For Hanzi suggestions
    matchType?: 'exact' | 'partial' | 'shorthand'
    isShorthand?: boolean
    syllableCount?: number
}

interface HSKEntry {
    id: string
    index: number
    word: {
        hanzi: string
        pinyin: string
    }
    meaning: string
    example: {
        hanzi: string
        pinyin: string
        meaning: string
    }
}

class DictionaryService {
    private cache: Record<string, DictionaryResult> | null = null
    private loadingPromise: Promise<void> | null = null

    private async loadData(): Promise<void> {
        if (this.cache) return
        if (this.loadingPromise) return this.loadingPromise

        this.loadingPromise = (async () => {
            try {
                const dictionary: Record<string, DictionaryResult> = {}
                const levels = [1, 2, 3, 4, 5, 6]

                const promises = levels.map(level =>
                    fetch(`/data/hsk${level}.json`).then(res => res.json() as Promise<HSKEntry[]>)
                )

                const results = await Promise.all(promises)

                results.forEach(entries => {
                    entries.forEach(entry => {
                        const key = entry.word.hanzi
                        const exampleStr = entry.example
                            ? `${entry.example.hanzi} (${entry.example.pinyin}) - ${entry.example.meaning}`
                            : undefined

                        dictionary[key] = {
                            word: entry.word.hanzi,
                            pinyin: entry.word.pinyin,
                            meaning: [entry.meaning],
                            example: exampleStr,
                        }
                    })
                })

                this.cache = dictionary
            } catch (error) {
                console.error("Failed to load HSK data", error)
                this.loadingPromise = null // Reset on error so we can retry
            }
        })()

        return this.loadingPromise
    }

    // --- Normalization Helpers ---

    private normalizePinyin(text: string): string {
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/ü/g, "v")
            .replace(/ǖ/g, "v")
            .replace(/ǘ/g, "v")
            .replace(/ǚ/g, "v")
            .replace(/ǜ/g, "v")
            .trim()
    }

    private normalizeText(s?: string): string {
        if (!s) return ""
        return s
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "d")
            .toLowerCase()
            .trim()
    }

    private isShorthandQuery(query: string): boolean {
        return query.length >= 2 && /^[a-z]+$/.test(query)
    }

    private matchesShorthand(pinyin: string, shorthand: string): boolean {
        const normalized = this.normalizePinyin(pinyin)
        const syllables = normalized.split(/\s+/).filter(s => s.length > 0)
        const firstLetters = syllables.map(s => s[0]).join('')
        return firstLetters.startsWith(shorthand)
    }

    // --- Search Methods ---

    async searchHanziByPinyin(query: string): Promise<DictionaryResult[]> {
        await this.loadData()
        if (!this.cache) return []

        const normalizedQuery = this.normalizePinyin(query)
        if (!normalizedQuery) return []

        const isShorthand = this.isShorthandQuery(normalizedQuery)
        const exactMatches: DictionaryResult[] = []
        const partialMatches: DictionaryResult[] = []
        const shorthandMatches: DictionaryResult[] = []

        for (const value of Object.values(this.cache)) {
            const pinyin = value.pinyin ?? ""
            const normalizedPinyin = this.normalizePinyin(pinyin)
            const syllables = normalizedPinyin.split(/\s+/).filter(s => s.length > 0)

            // Exact match logic
            if (normalizedPinyin === normalizedQuery || syllables.includes(normalizedQuery)) {
                exactMatches.push({
                    ...value,
                    matchType: 'exact',
                    syllableCount: syllables.length,
                })
                continue
            }

            // Partial match logic
            if (normalizedPinyin.startsWith(normalizedQuery) ||
                syllables.some(s => s.startsWith(normalizedQuery))) {
                partialMatches.push({
                    ...value,
                    matchType: 'partial',
                    syllableCount: syllables.length,
                })
                continue
            }

            // Shorthand logic
            if (isShorthand && this.matchesShorthand(pinyin, normalizedQuery)) {
                shorthandMatches.push({
                    ...value,
                    matchType: 'shorthand',
                    isShorthand: true,
                    syllableCount: syllables.length,
                })
            }
        }

        const sortBySyllables = (a: DictionaryResult, b: DictionaryResult) => {
            return (a.syllableCount ?? 0) - (b.syllableCount ?? 0)
        }

        exactMatches.sort(sortBySyllables)
        partialMatches.sort(sortBySyllables)
        shorthandMatches.sort(sortBySyllables)

        // Limit results for performance
        return [...exactMatches, ...partialMatches, ...shorthandMatches].slice(0, 10)
    }


    async searchDictionary(query: string): Promise<DictionaryResult[]> {
        await this.loadData()
        if (!this.cache) return []

        const q = query.toLowerCase().trim()
        const nq = this.normalizeText(q)
        const results: DictionaryResult[] = []

        for (const [key, value] of Object.entries(this.cache)) {
            const pinyin = (value.pinyin ?? "").toLowerCase()
            const meaningsCombined = (value.meaning || []).join(" ").toLowerCase()
            const example = (value.example ?? "").toLowerCase()
            const trad = (value.traditional ?? "").toLowerCase()

            let score = -1

            if (key === query) score = 1000
            else if (key.includes(query) || trad.includes(query)) score = 950

            const normMeanings = this.normalizeText(meaningsCombined)
            if (meaningsCombined === q || normMeanings === nq) score = 900
            else if (meaningsCombined.includes(q) || normMeanings.includes(nq)) {
                const words = meaningsCombined.split(/[\s,.;:()!]+/)
                const normWords = normMeanings.split(/[\s,.;:()!]+/)
                if (words.includes(q) || normWords.includes(nq)) score = 850
                else score = 800
            }

            if (score < 0) {
                if (pinyin === q || this.normalizeText(pinyin) === nq) score = 750
                else if (pinyin.includes(q) || this.normalizeText(pinyin).includes(nq)) score = 700
            }

            if (score < 0) {
                if (example.includes(q) || this.normalizeText(example).includes(nq)) score = 600
            }

            if (score > 0) {
                results.push({ ...value, score })
            }
        }

        return results
            .sort((a, b) => {
                if (b.score !== a.score) return (b.score || 0) - (a.score || 0)
                return a.word.length - b.word.length
            })
            // Just returning all results, pagination might be needed if too many
            .slice(0, 50)
    }
}

export const dictionaryService = new DictionaryService()
