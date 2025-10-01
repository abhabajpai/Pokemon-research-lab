"use client"

import type React from "react"

import { useState } from "react"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { usePokedexStore } from "@/store/pokedex-store"
import type { PokemonRow } from "@/lib/pokemon-types"

type AppField =
  | "id"
  | "name"
  | "sprite"
  | "types"
  | "hp"
  | "attack"
  | "defense"
  | "specialAttack"
  | "specialDefense"
  | "speed"

const FIELD_OPTIONS: { key: AppField; label: string; type: "number" | "text" | "list" }[] = [
  { key: "id", label: "ID", type: "number" },
  { key: "name", label: "Name", type: "text" },
  { key: "sprite", label: "Sprite", type: "text" },
  { key: "types", label: "Type(s)", type: "list" },
  { key: "hp", label: "HP", type: "number" },
  { key: "attack", label: "Attack", type: "number" },
  { key: "defense", label: "Defense", type: "number" },
  { key: "specialAttack", label: "Sp. Atk", type: "number" },
  { key: "specialDefense", label: "Sp. Def", type: "number" },
  { key: "speed", label: "Speed", type: "number" },
]

export function UploadCSV() {
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [delimiter, setDelimiter] = useState<string>(",")
  const [typesDelimiter, setTypesDelimiter] = useState<string>(" / ")
  const [mapping, setMapping] = useState<Record<AppField, string | "">>({
    id: "",
    name: "",
    sprite: "",
    types: "",
    hp: "",
    attack: "",
    defense: "",
    specialAttack: "",
    specialDefense: "",
    speed: "",
  })
  const upsertMany = usePokedexStore((s) => s.upsertMany)
  const ensureColumnsForCsv = usePokedexStore((s) => s.ensureColumnsForCsv)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    setFile(f ?? null)
    if (!f) return
    Papa.parse(f, {
      header: true,
      preview: 1,
      complete: (res) => {
        const fields: string[] = (res.meta.fields as string[]) || []
        setHeaders(fields)
      },
    })
  }

  function setMap(field: AppField, value: string) {
    setMapping((m) => ({ ...m, [field]: value }))
  }

  async function startImport() {
    if (!file) return
    // Basic: ensure required columns exist
    ensureColumnsForCsv()

    await new Promise<void>((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        worker: true,
        skipEmptyLines: true,
        delimiter: delimiter || ",",
        chunkSize: 1024 * 1024, // stream in chunks
        step: (results) => {
          const rowObj = results.data as Record<string, string>
          const r: Partial<PokemonRow> = {}
          for (const opt of FIELD_OPTIONS) {
            const srcKey = mapping[opt.key]
            if (!srcKey) continue
            const raw = rowObj[srcKey]
            if (raw == null) continue
            if (opt.type === "number") {
              const num = Number(raw)
              ;(r as any)[opt.key] = Number.isFinite(num) ? num : 0
            } else if (opt.type === "list") {
              const parts = String(raw)
                .split(typesDelimiter)
                .map((s) => s.trim())
                .filter(Boolean)
              ;(r as any)[opt.key] = parts
            } else {
              ;(r as any)[opt.key] = String(raw)
            }
          }
          if (typeof r.id !== "number") return
          upsertMany([r as PokemonRow])
        },
        complete: () => resolve(),
        error: (err) => reject(err),
      })
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input type="file" accept=".csv,text/csv" onChange={handleFileChange} />
        <div className="flex items-center gap-2">
          <Label className="text-xs">Delimiter</Label>
          <Input className="h-8 w-16" value={delimiter} onChange={(e) => setDelimiter(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Types split</Label>
          <Input className="h-8 w-24" value={typesDelimiter} onChange={(e) => setTypesDelimiter(e.target.value)} />
        </div>
      </div>

      {!!headers.length && (
        <Card>
          <CardHeader>
            <CardTitle>Schema Mapping</CardTitle>
          </CardHeader>
          {/* already responsive with md:grid-cols-2 */}
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {FIELD_OPTIONS.map((f) => (
              <div key={f.key} className="grid gap-1.5">
                <Label>{f.label}</Label>
                <Select value={mapping[f.key]} onValueChange={(v) => setMap(f.key, v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select CSV column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                    <SelectItem value="ignore">(Ignore)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <Button className="w-full sm:w-auto" onClick={startImport} disabled={!file}>
          Import CSV (Streaming)
        </Button>
      </div>
    </div>
  )
}
