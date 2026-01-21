export const PINYIN_TONES: Record<string, string[]> = {
    a: ["a", "ā", "á", "ǎ", "à"],
    e: ["e", "ē", "é", "ě", "è"],
    i: ["i", "ī", "í", "ǐ", "ì"],
    o: ["o", "ō", "ó", "ǒ", "ò"],
    u: ["u", "ū", "ú", "ǔ", "ù"],
    ü: ["ü", "ǖ", "ǘ", "ǚ", "ǜ"],
    v: ["v", "ǖ", "ǘ", "ǚ", "ǜ"], // v as alternative for ü
    n: ["n", "n̄", "ń", "ň", "ǹ"],
    m: ["m", "m̄", "ḿ", "m̌", "m̀"],
}

export function convertTone(text: string, toneNum: number): string {
    // Normalize toneNum to 1-4 index (0-3 array index), but the map has 5 elements (0=neutral, 1-4 tones)
    // Input toneNum comes from key "1"-"4", so we map 1->1, 2->2, etc.
    // The arrays in PINYIN_TONES are: [neutral, tone1, tone2, tone3, tone4]
    // So toneNum 1 corresponds to index 1.

    if (toneNum < 1 || toneNum > 4) return text

    // Remove existing tone numbers from the end if any (though usually we pass clean text)
    const cleanText = text.replace(/\d+$/, "")

    let result = cleanText

    // Rules for tone mark placement
    // Priority: a, e
    if (cleanText.includes("a") || cleanText.includes("e")) {
        for (const char of cleanText) {
            if (char === "a" || char === "e") {
                if (PINYIN_TONES[char]) {
                    result = cleanText.replace(char, PINYIN_TONES[char][toneNum])
                    return result
                }
            }
        }
    }

    // "ou" case
    if (cleanText.includes("ou")) {
        result = cleanText.replace("o", PINYIN_TONES["o"][toneNum])
        return result
    }

    // Otherwise, place on the last vowel
    const vowels = ["a", "e", "i", "o", "u", "ü", "v"]
    for (let i = cleanText.length - 1; i >= 0; i--) {
        const char = cleanText[i].toLowerCase()
        if (vowels.includes(char) && PINYIN_TONES[char]) {
            // Handle case sensitivity if needed, but for now assuming lowercase input mostly or mapping back
            // The map keys are lowercase. If the original char was uppercase, we might need to handle that.
            // For this simple implementation, let's assume usage is mostly lowercase syllables or we replace the char directly.
            const replacement = PINYIN_TONES[char][toneNum]
            // Preserve case could be complex, let's just replace the exact char instance
            // Ideally we match the case of the original char.
            // Since PINYIN_TONES only has lowercase, we return lowercase result for now.
            result = cleanText.substring(0, i) + replacement + cleanText.substring(i + 1)
            return result;
        }
    }

    return result
}
