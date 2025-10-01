"use client"

import * as React from "react"
import {
  type ColumnDef as TSColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { usePokedexStore } from "@/store/pokedex-store"
import type { ColumnDef, PokemonRow } from "@/lib/pokemon-types"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function colSizeClasses(col: ColumnDef) {
  if (col.type === "image") return "w-[56px] min-w-[56px]"
  if (col.type === "number") return "min-w-[84px] text-right tabular-nums"
  if (col.type === "multitext") return "min-w-[160px]"
  // widen common text columns
  if (typeof col.key === "string" && /name|type/i.test(col.key)) return "min-w-[160px]"
  return "min-w-[120px]"
}

function EditableCell({
  rowId,
  col,
  value,
}: {
  rowId: number
  col: ColumnDef
  value: any
}) {
  const updateCell = usePokedexStore((s) => s.updateCell)

  if (col.type === "image") {
    const src = String(value || "")
    return src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src || "/placeholder.svg"} alt="Pokemon sprite" className="h-10 w-10 rounded" />
    ) : null
  }

  if (col.type === "multitext") {
    const str = Array.isArray(value) ? value.join(" / ") : String(value ?? "")
    return (
      <Input
        className="h-8 w-full"
        defaultValue={str}
        aria-label={`Edit ${col.header}`}
        placeholder="type1 / type2"
        onBlur={(e) => {
          const parts = e.target.value
            .split("/")
            .map((s) => s.trim())
            .filter(Boolean)
          updateCell(rowId, col.key, parts)
        }}
      />
    )
  }

  if (col.type === "boolean") {
    const bool = Boolean(value)
    return (
      <input
        type="checkbox"
        className="h-4 w-4"
        aria-label={`Toggle ${col.header}`}
        checked={bool}
        onChange={(e) => updateCell(rowId, col.key, e.target.checked)}
      />
    )
  }

  // text/number
  return (
    <Input
      className={cn("h-8 w-full", col.type === "number" && "text-right tabular-nums")}
      defaultValue={String(value ?? "")}
      aria-label={`Edit ${col.header}`}
      inputMode={col.type === "number" ? "numeric" : undefined}
      pattern={col.type === "number" ? "[0-9]*" : undefined}
      onBlur={(e) => {
        const v = col.type === "number" ? Number(e.target.value) : e.target.value
        updateCell(rowId, col.key, v)
      }}
    />
  )
}

export function PokemonTable() {
  const data = usePokedexStore((s) => s.data)
  const columns = usePokedexStore((s) => s.columns)
  const addColumn = usePokedexStore((s) => s.addColumn)

  const [sorting, setSorting] = React.useState<SortingState>([])

  const tableCols = React.useMemo<TSColumnDef<PokemonRow, any>[]>(() => {
    const list: TSColumnDef<PokemonRow, any>[] = columns.map((c, idx) => ({
      id: c.key,
      accessorFn: (row) => (row as any)[c.key],
      header: c.header,
      enableSorting: c.type !== "image",
      cell: (ctx) => {
        const val = ctx.getValue()
        return c.editable ? (
          <EditableCell rowId={ctx.row.original.id} col={c} value={val} />
        ) : c.type === "image" ? (
          val ? (
            <img src={String(val) || "/placeholder.svg"} alt="Pokemon sprite" className="h-10 w-10 rounded" />
          ) : null
        ) : (
          <span>{Array.isArray(val) ? val.join(" / ") : String(val ?? "")}</span>
        )
      },
      sortingFn: (a, b) => {
        const va = (a.original as any)[c.key]
        const vb = (b.original as any)[c.key]
        if (typeof va === "number" && typeof vb === "number") return va - vb
        return String(va ?? "").localeCompare(String(vb ?? ""))
      },
      meta: { index: idx },
    }))

    // Sticky "Add Column" button as last header
    list.push({
      id: "__actions__",
      header: () => (
        <div className="text-right">
          <Button
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              addColumn("custom", "text")
            }}
            aria-label="Add column"
          >
            + Add
          </Button>
        </div>
      ),
      cell: () => null,
      enableSorting: false,
      meta: { index: list.length },
    })

    return list
  }, [columns, addColumn])

  const table = useReactTable({
    data,
    columns: tableCols,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const parentRef = React.useRef<HTMLDivElement>(null)
  const hScrollRef = React.useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  })

  const rows = rowVirtualizer.getVirtualItems()

  // sticky column helpers
  const firstColId = columns[0]?.key
  const lastColId = "__actions__"

  return (
    <div className="rounded-md border overflow-x-auto" ref={hScrollRef}>
      <div ref={parentRef} className="h-[70vh] overflow-y-auto">
        <table className="min-w-full w-full border-collapse table-auto">
          <thead className="sticky top-0 z-20 bg-background">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const idx = (h.column.columnDef.meta as any)?.index as number | undefined
                  const colDef = typeof idx === "number" ? columns[idx] : undefined
                  const isFirst = h.column.id === firstColId
                  const isLast = h.column.id === lastColId
                  return (
                    <th
                      key={h.id}
                      className={cn(
                        "px-3 py-2 text-left text-sm font-medium whitespace-nowrap",
                        "bg-background",
                        colDef && colSizeClasses(colDef),
                        // align header text to right for numeric columns
                        colDef?.type === "number" && "text-right",
                        isFirst && "sticky left-0 z-20 bg-background border-l border-border",
                        isLast &&
                          "sticky right-0 z-20 bg-background text-right w-[88px] min-w-[88px] border-r border-border",
                      )}
                      onClick={h.column.getCanSort() ? h.column.getToggleSortingHandler() : undefined}
                      title={
                        typeof h.column.columnDef.header === "string"
                          ? (h.column.columnDef.header as string)
                          : undefined
                      }
                    >
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      {{
                        asc: " ▲",
                        desc: " ▼",
                      }[h.column.getIsSorted() as string] ?? null}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody
            style={{
              height: rowVirtualizer.getTotalSize(),
              position: "relative",
            }}
          >
            {rows.map((vr) => {
              const row = table.getRowModel().rows[vr.index]
              return (
                <tr
                  key={row.id}
                  data-index={vr.index}
                  style={{
                    position: "absolute",
                    transform: `translateY(${vr.start}px)`,
                    width: "100%",
                  }}
                  className="odd:bg-muted/30 hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => {
                    const idx = (cell.column.columnDef.meta as any)?.index as number | undefined
                    const colDef = typeof idx === "number" ? columns[idx] : undefined
                    const isFirst = cell.column.id === firstColId
                    const isLast = cell.column.id === lastColId
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          "px-3 py-1 text-sm whitespace-nowrap align-middle",
                          colDef && colSizeClasses(colDef),
                          isFirst && "sticky left-0 z-10 bg-background border-l border-border",
                          isLast && "sticky right-0 z-10 bg-background w-[88px] min-w-[88px] border-r border-border",
                        )}
                        title={
                          !colDef?.editable && typeof cell.getValue() !== "object"
                            ? String(
                                Array.isArray(cell.getValue())
                                  ? (cell.getValue() as any[]).join(" / ")
                                  : (cell.getValue() ?? ""),
                              )
                            : undefined
                        }
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
