import type { ColumnDef, PokemonRow } from "./pokemon-types"

export function exportToCsv({
  rows,
  columns,
  fileName = "pokemon_research_lab.csv",
}: { rows: PokemonRow[]; columns: ColumnDef[]; fileName?: string }) {
  if (!rows.length) return
  // Build header from columns only (dynamic safe)
  const headers = columns.map((c) => c.header)
  const keys = columns.map((c) => c.key)

  const csvLines = [headers.join(",")]
  for (const r of rows) {
    const vals = keys.map((k) => {
      const v = (r as any)[k]
      const out = Array.isArray(v) ? v.join(" / ") : v
      const s = String(out ?? "")
      // escape commas/quotes/newlines
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
      return s
    })
    csvLines.push(vals.join(","))
  }

  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
