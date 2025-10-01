"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePokedexStore } from "@/store/pokedex-store"
import type { ColumnType } from "@/lib/pokemon-types"

export function AddColumnDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<ColumnType>("text")
  const addColumn = usePokedexStore((s) => s.addColumn)

  function onCreate() {
    if (!name.trim()) return
    addColumn(name.trim(), type)
    setOpen(false)
    setName("")
    setType("text")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Column</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new column</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ability" />
          </div>
          <div className="grid gap-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ColumnType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={onCreate}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
