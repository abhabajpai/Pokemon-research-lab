"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { usePokedexStore } from "@/store/pokedex-store"

// Simple parser for commands like:
// "set hp to 100 for all pokemon of type 'grass'"
// "delete rows where name is 'gengar'"
// "update ability to 'levitate' where name is 'gengar'"
function parseCommand(input: string) {
  const s = input.trim().toLowerCase()

  // set <field> to <value> for all pokemon of type '<type>'
  let m = s.match(/^set\s+([\w\s.]+)\s+to\s+(['"]?)(.+?)\2\s+for\s+all\s+pokemon\s+of\s+type\s+['"]?(.+?)['"]?$/i)
  if (m) {
    const field = m[1].trim()
    const value = m[3].trim()
    const typeFilter = m[4].trim()
    return { kind: "setByType", field, value, typeFilter } as const
  }

  // delete rows where <field> is <value>
  m = s.match(/^delete\s+rows\s+where\s+([\w\s.]+)\s+is\s+['"]?(.+?)['"]?$/i)
  if (m) {
    const field = m[1].trim()
    const value = m[2].trim()
    return { kind: "deleteWhere", field, value } as const
  }

  // update <field> to <value> where <field2> is <value2>
  m = s.match(/^update\s+([\w\s.]+)\s+to\s+['"]?(.+?)['"]?\s+where\s+([\w\s.]+)\s+is\s+['"]?(.+?)['"]?$/i)
  if (m) {
    const field = m[1].trim()
    const value = m[2].trim()
    const condField = m[3].trim()
    const condValue = m[4].trim()
    return { kind: "updateWhere", field, value, condField, condValue } as const
  }

  return { kind: "unknown" } as const
}

export function ChatOverlay({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState("")
  const bulkUpdate = usePokedexStore((s) => s.bulkUpdate)
  const deleteWhere = usePokedexStore((s) => s.deleteWhere)
  const addColumn = usePokedexStore((s) => s.addColumn)

  function apply() {
    const parsed = parseCommand(value)
    if (parsed.kind === "setByType") {
      const { field, value: v, typeFilter } = parsed
      // ensure column exists
      if (!usePokedexStore.getState().columns.find((c) => c.key === field)) {
        addColumn(field, "text")
      }
      bulkUpdate(
        (row) => (row.types || []).map((t) => String(t).toLowerCase()).includes(typeFilter.toLowerCase()),
        (row) => {
          const numV = Number(v)
          ;(row as any)[field] = Number.isFinite(numV) ? numV : v
        },
      )
    } else if (parsed.kind === "deleteWhere") {
      const { field, value: v } = parsed
      deleteWhere((row) => String((row as any)[field] ?? "").toLowerCase() === v.toLowerCase())
    } else if (parsed.kind === "updateWhere") {
      const { field, value: v, condField, condValue } = parsed
      if (!usePokedexStore.getState().columns.find((c) => c.key === field)) {
        addColumn(field, "text")
      }
      bulkUpdate(
        (row) => String((row as any)[condField] ?? "").toLowerCase() === condValue.toLowerCase(),
        (row) => {
          const numV = Number(v)
          ;(row as any)[field] = Number.isFinite(numV) ? numV : v
        },
      )
    } else {
      // ignore unknown
    }
    setValue("")
  }

  return (
    <div className="pointer-events-auto fixed inset-x-0 top-0 z-40 mx-auto w-full max-w-[1200px] p-4">
      <Card className="border-primary/40 bg-card/95 backdrop-blur">
        <div className="flex flex-col items-stretch gap-3 p-3 md:flex-row md:items-start">
          <Textarea
            className="w-full"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Try: set hp to 100 for all pokemon of type 'grass'`}
          />
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
            <Button className="w-full md:w-auto" onClick={apply}>
              Apply
            </Button>
            <Button className="w-full md:w-auto" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
