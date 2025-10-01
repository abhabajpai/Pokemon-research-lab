import type { PokemonRow } from "./pokemon-types"

export async function fetchPokemonListPage(offset: number, limit: number, signal?: AbortSignal) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`, { signal })
  if (!res.ok) throw new Error("Failed to fetch PokeAPI list")
  return (await res.json()) as {
    count: number
    next: string | null
    previous: string | null
    results: { name: string; url: string }[]
  }
}

export async function fetchPokemonDetail(url: string, signal?: AbortSignal) {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error("Failed to fetch PokeAPI detail")
  return (await res.json()) as any
}

export function mapPokemonDetailToRow(detail: any): PokemonRow {
  const statsRecord: Record<string, number> = {}
  for (const s of detail.stats as Array<{ base_stat: number; stat: { name: string } }>) {
    const key = s.stat.name
    statsRecord[key] = s.base_stat
  }
  const types = (detail.types as Array<{ type: { name: string } }>).map((t) => t.type.name)

  return {
    id: detail.id,
    name: detail.name,
    sprite: detail.sprites?.front_default || "",
    types,
    hp: statsRecord["hp"] ?? 0,
    attack: statsRecord["attack"] ?? 0,
    defense: statsRecord["defense"] ?? 0,
    specialAttack: statsRecord["special-attack"] ?? 0,
    specialDefense: statsRecord["special-defense"] ?? 0,
    speed: statsRecord["speed"] ?? 0,
  }
}
