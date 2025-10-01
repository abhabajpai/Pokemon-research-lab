export type NumericStat = "hp" | "attack" | "defense" | "specialAttack" | "specialDefense" | "speed"

export type ColumnType = "text" | "number" | "boolean" | "image" | "multitext"

export interface ColumnDef {
  key: string
  header: string
  type: ColumnType
  editable?: boolean
}

export interface PokemonRow {
  id: number
  name: string
  sprite: string
  types: string[]
  hp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
  // dynamic columns
  [key: string]: string | number | boolean | string[]
}

export const defaultColumns: ColumnDef[] = [
  { key: "id", header: "ID", type: "number", editable: false },
  { key: "sprite", header: "Sprite", type: "image", editable: false },
  { key: "name", header: "Name", type: "text", editable: true },
  { key: "types", header: "Type(s)", type: "multitext", editable: true },
  { key: "hp", header: "HP", type: "number", editable: true },
  { key: "attack", header: "Attack", type: "number", editable: true },
  { key: "defense", header: "Defense", type: "number", editable: true },
  { key: "specialAttack", header: "Sp. Atk", type: "number", editable: true },
  { key: "specialDefense", header: "Sp. Def", type: "number", editable: true },
  { key: "speed", header: "Speed", type: "number", editable: true },
]
