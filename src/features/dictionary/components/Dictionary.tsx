import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { dictionaryService, type DictionaryResult as DictionaryEntry } from "../api/dictionary.service"

export default function Dictionary() {
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<DictionaryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setError("")
    try {
      const data = await dictionaryService.searchDictionary(searchQuery)
      setResults(data)

      if (data.length === 0) {
        setError("Hệ thống đang cập nhật dữ liệu mỗi ngày, bạn vui lòng thử lại sau nhé!")
      }
    } catch (err) {
      setError("Lỗi tìm kiếm. Vui lòng thử lại")
      console.error("[v0] Dictionary search error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-96 border-l border-border bg-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-3">Tra cứu từ</h3>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Nhập từ hoặc ký tự..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-sm h-9"
            disabled={loading}
          />
          <Button type="submit" size="sm" disabled={loading} title="Tìm kiếm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </form>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {error ? (
          <div className="p-4 text-sm text-muted-foreground text-center">{error}</div>
        ) : results.length > 0 ? (
          <div className="divide-y divide-border">
            {results.map((entry, index) => (
              <div key={index} className="p-4 hover:bg-muted/50 transition-colors">
                {/* Word and Pinyin */}
                <div className="mb-2">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-bold text-foreground">{entry.word}</span>
                    {entry.traditional && entry.traditional !== entry.word && (
                      <span className="text-sm text-muted-foreground">{entry.traditional}</span>
                    )}
                  </div>
                  <p className="text-sm text-primary font-mono">{entry.pinyin}</p>
                </div>

                {/* Meaning */}
                <div className="space-y-1">
                  {entry.meaning.map((def, i) => (
                    <p key={i} className="text-sm text-foreground leading-relaxed">
                      <span className="font-semibold text-muted-foreground">{i + 1}.</span> {def}
                    </p>
                  ))}
                </div>

                {/* Example */}
                {entry.example && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      <strong>Ví dụ:</strong> {entry.example}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 flex items-center justify-center h-full text-center">
            <div>
              <p className="text-sm text-muted-foreground">Nhập từ để tra cứu</p>
              <p className="text-xs text-muted-foreground mt-2">
                Hỗ trợ tìm kiếm tiếng Trung, Pinyin và nghĩa tiếng Việt
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="border-t border-border p-3 bg-muted/50 text-center">
        <p className="text-xs text-muted-foreground">@hoangducbinh.prod</p>
      </div>
    </div>
  )
}
