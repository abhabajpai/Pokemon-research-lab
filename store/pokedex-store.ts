"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { ColumnDef, ColumnType, PokemonRow } from "@/lib/pokemon-types"
import { defaultColumns } from "@/lib/pokemon-types"

type ProgressState = {
  status: "idle" | "fetching" | "done" | "error"
  total: number
  loaded: number
}

type Store = {
  data: PokemonRow[]
  columns: ColumnDef[]
  progress: ProgressState
  setProgress: (p: ProgressState) => void
  setData: (rows: PokemonRow[]) => void
  upsertMany: (rows: PokemonRow[]) => void
  addColumn: (name: string, type: ColumnType) => void
  updateCell: (rowId: number, key: string, value: any) => void
  bulkUpdate: (predicate: (row: PokemonRow) => boolean, updater: (row: PokemonRow) => void) => void
  deleteWhere: (predicate: (row: PokemonRow) => boolean) => void
  ensureColumnsForCsv: () => void
}

export const usePokedexStore = create<Store>()(
  persist(
    (set, get) => ({
      data: [],
      columns: defaultColumns,
      progress: { status: "idle", total: 0, loaded: 0 },
      setProgress: (p) => set({ progress: p }),
      setData: (rows) => set({ data: rows }),
      upsertMany: (rows) =>
        set((state) => {
          const byId = new Map<number, PokemonRow>()
          for (const r of state.data) byId.set(r.id, r)
          for (const r of rows) {
            const existing = byId.get(r.id)
            if (existing) {
              byId.set(r.id, { ...existing, ...r })
            } else {
              // ensure all current columns exist in new rows with defaults
              const withDefaults: any = { ...r }
              for (const col of state.columns) {
                if (!(col.key in withDefaults)) {
                  withDefaults[col.key] = defaultValueForType(col.type)
                }
              }
              byId.set(r.id, withDefaults)
            }
          }
          return { data: Array.from(byId.values()) }
        }),
      addColumn: (name, type) =>
        set((state) => {
          const baseKey = toKey(name)
          let key = baseKey
          let suffix = 0
          while (state.columns.some((c) => c.key === key)) {
            suffix += 1
            key = `${baseKey}-${suffix}`
          }
          const header = suffix > 0 ? `${name} ${suffix}` : name

          const col: ColumnDef = {
            key,
            header,
            type,
            editable: type !== "image" && type !== "multitext",
          }
          const updatedData = state.data.map((r) => {
            if ((r as any)[key] === undefined) {
              ;(r as any)[key] = defaultValueForType(type)
            }
            return r
          })
          return { columns: [...state.columns, col], data: updatedData }
        }),
      updateCell: (rowId, key, value) =>
        set((state) => {
          const idx = state.data.findIndex((r) => r.id === rowId)
          if (idx === -1) return {}
          const updated = [...state.data]
          updated[idx] = { ...updated[idx], [key]: value }
          return { data: updated }
        }),
      bulkUpdate: (predicate, updater) =>
        set((state) => {
          const updated = state.data.map((r) => {
            if (predicate(r)) {
              const copy = { ...r }
              updater(copy)
              return copy
            }
            return r
          })
          return { data: updated }
        }),
      deleteWhere: (predicate) =>
        set((state) => {
          const filtered = state.data.filter((r) => !predicate(r))
          return { data: filtered }
        }),
      ensureColumnsForCsv: () =>
        set((state) => {
          // ensure default columns exist (safe if user started with CSV only)
          const required = defaultColumns.filter((dc) => !state.columns.find((c) => c.key === dc.key))
          if (!required.length) return {}
          return { columns: [...state.columns, ...required] }
        }),
    }),
    {
      name: "pokedex-store-v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (s) => ({ data: s.data, columns: s.columns }), // progress not persisted
    },
  ),
)

function toKey(s: string) {
  return s
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/gi, "")
    .toLowerCase()
}

function defaultValueForType(type: ColumnType) {
  switch (type) {
    case "number":
      return 0
    case "boolean":
      return false
    case "multitext":
      return []
    default:
      return ""
  }
}
