import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

import { PINYIN_TONES } from "../domain/pinyin"

interface ToneHelperProps {
  lastCharacter: string
  onInsertCharacter: (char: string) => void
}

export default function ToneHelper({ lastCharacter, onInsertCharacter }: ToneHelperProps) {
  const lastChar = lastCharacter.toLowerCase()
  const tones = PINYIN_TONES[lastChar]

  const toneLabels = ["0️⃣ Không dấu", "1️⃣ Phẳng (ā)", "2️⃣ Nổi (á)", "3️⃣ Huyền (ǎ)", "4️⃣ Huyền (à)"]

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border p-4">
        <h3 className="font-semibold text-foreground mb-2">Trợ giúp dấu Pinyin</h3>
        <p className="text-xs text-muted-foreground">
          Nhấn phím <strong>1-4</strong> để thêm dấu vào ký tự cuối cùng
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {tones ? (
          <div className="p-4 space-y-2">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                Ký tự cuối: <span className="font-mono font-bold text-lg text-foreground">{lastCharacter}</span>
              </p>
            </div>

            <div className="space-y-2">
              {tones.map((tone, index) => (
                <Button
                  key={index}
                  onClick={() => {
                    onInsertCharacter(tone)
                  }}
                  variant={index === 0 ? "outline" : "default"}
                  className="w-full justify-start h-auto py-3"
                  title={`Nhấn ${index === 0 ? "Xóa" : index}`}
                >
                  <span className="text-2xl font-bold mr-3">{tone}</span>
                  <span className="flex-1 text-left text-sm">{toneLabels[index]}</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </Button>
              ))}
            </div>

            <div className="pt-4 border-t border-border mt-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>Mẹo:</strong> Chọn ký tự nguyên âm (a, e, i, o, u, ü) để xem các dấu có sẵn.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 flex items-center justify-center h-full text-center">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Hãy nhập một ký tự để xem các dấu Pinyin</p>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {Object.keys(PINYIN_TONES).map((char) => (
                  <button
                    key={char}
                    onClick={() => onInsertCharacter(char)}
                    className="px-2 py-1 rounded text-sm font-mono bg-muted hover:bg-primary/20 transition-colors"
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="border-t border-border p-3 bg-muted/50">
        <p className="text-xs text-muted-foreground text-center">
          Phím tắt: <kbd className="px-2 py-1 bg-background rounded text-xs font-mono">1-4</kbd>
        </p>
      </div>
    </div>
  )
}
