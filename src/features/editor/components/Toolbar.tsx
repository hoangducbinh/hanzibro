import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer, Copy, Trash2, Settings, Languages } from "lucide-react"

interface ToolbarProps {
  editorRef: React.RefObject<HTMLDivElement | null>
  content: string
  hanziInputEnabled: boolean
  onToggleHanziInput: () => void
}

export default function Toolbar({ editorRef, content, hanziInputEnabled, onToggleHanziInput }: ToolbarProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleClear = () => {
    if (editorRef.current) {
      editorRef.current.innerText = ""
      editorRef.current.focus()
    }
  }

  const handlePrint = () => {
    const printWindow = window.open("", "", "height=500,width=900")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>In tài liệu</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
              p { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <pre>${content}</pre>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }


  return (
    <>
      <div className="bg-card p-4 flex items-center gap-2 flex-wrap">
        <Button onClick={handleCopy} variant="outline" className="hover:bg-primary hover:text-primary-foreground" size="sm" title="Sao chép (Ctrl+C)">
          <Copy className="w-4 h-4 mr-2" />
          {copied ? "Đã sao chép!" : "Sao chép"}
        </Button>

        <Button onClick={handleClear} variant="outline" className="hover:bg-primary hover:text-primary-foreground" size="sm" title="Xóa tất cả">
          <Trash2 className="w-4 h-4 mr-2" />
          Xóa
        </Button>

        <Button onClick={handlePrint} variant="outline" className="hover:bg-primary hover:text-primary-foreground" size="sm" title="In (Ctrl+P)">
          <Printer className="w-4 h-4 mr-2" />
          In
        </Button>

        <div className="ml-auto flex gap-2">
          <Button
            onClick={onToggleHanziInput}
            variant={hanziInputEnabled ? "default" : "outline"}
            className={hanziInputEnabled ? "" : "hover:bg-primary hover:text-primary-foreground"}
            size="sm"
            title={hanziInputEnabled ? "Tắt gõ Hán tự" : "Bật gõ Hán tự"}
          >
            <Languages className="w-4 h-4 mr-2" />
            汉字
          </Button>
          <Button onClick={() => { }} variant="outline" className="hover:bg-primary hover:text-primary-foreground" size="sm" title="Cài đặt">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  )
}
