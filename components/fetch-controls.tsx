"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import { fetchPokemonListPage, fetchPokemonDetail, mapPokemonDetailToRow } from "@/lib/pokeapi"
import { usePokedexStore } from "@/store/pokedex-store"
import { useEffect, useMemo, useRef, useState } from "react"

const PAGE_LIMIT = 200
const DETAIL_CONCURRENCY = 16

export function FetchControls() {
  const setProgress = usePokedexStore((s) => s.setProgress)
  const upsertMany = usePokedexStore((s) => s.upsertMany)
  const [isFetchingAll, setIsFetchingAll] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const qc = useQueryClient()
  const progress = usePokedexStore((s) => s.progress)

  const { data, hasNextPage, fetchNextPage, refetch, isFetching, isFetchingNextPage, status } = useInfiniteQuery({
    queryKey: ["pokemon", "list"],
    queryFn: ({ pageParam = 0, signal }) => fetchPokemonListPage(pageParam, PAGE_LIMIT, signal),
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((sum, p) => sum + p.results.length, 0)
      if (fetched < lastPage.count) return fetched
      return undefined
    },
    initialPageParam: 0,
    enabled: false,
  })

  const totalCount = data?.pages?.[0]?.count ?? 0
  const listing = useMemo(() => data?.pages?.flatMap((p) => p.results) ?? [], [data?.pages])

  useEffect(() => {
    if (isFetchingAll) {
      setProgress({ status: "fetching", total: totalCount || 0, loaded: 0 })
    }
  }, [isFetchingAll, totalCount, setProgress])

  async function fetchAll() {
    setIsFetchingAll(true)
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setProgress({ status: "fetching", total: 0, loaded: 0 })

    try {
      // paginate the list using TanStack Query (requirement)
      await refetch()
      while (hasNextPage) {
        // eslint-disable-next-line no-await-in-loop
        await fetchNextPage()
      }
      const allResults = qc.getQueryData<any>(["pokemon", "list"])?.pages.flatMap((p: any) => p.results) ?? []
      const count = qc.getQueryData<any>(["pokemon", "list"])?.pages?.[0]?.count ?? allResults.length
      setProgress({ status: "fetching", total: count, loaded: 0 })

      // detail fetching with concurrency and live progress
      let loaded = 0
      const queue: Promise<void>[] = []
      let active = 0
      const iterator = allResults[Symbol.iterator]()
      const nextTask = () => {
        const nx = iterator.next()
        if (nx.done) return
        active++
        const { url } = nx.value
        const p = (async () => {
          const detail = await fetchPokemonDetail(url, abortRef.current?.signal)
          const row = mapPokemonDetailToRow(detail)
          upsertMany([row])
          loaded++
          setProgress({ status: "fetching", total: count, loaded })
        })()
          .catch(() => {
            loaded++
            setProgress({ status: "fetching", total: count, loaded })
          })
          .finally(() => {
            active--
            if (isFetchingAll && active < DETAIL_CONCURRENCY) nextTask()
          })
        queue.push(p)
        if (active < DETAIL_CONCURRENCY) nextTask()
      }
      // kick off pool
      for (let i = 0; i < DETAIL_CONCURRENCY; i++) nextTask()
      await Promise.all(queue)

      setProgress({ status: "done", total: count, loaded })
    } catch (e) {
      setProgress({ status: "error", total: 0, loaded: 0 })
    } finally {
      setIsFetchingAll(false)
    }
  }

  function cancel() {
    abortRef.current?.abort()
    setIsFetchingAll(false)
    setProgress({ status: "idle", total: 0, loaded: 0 })
  }

  const pct = progress.total > 0 ? Math.min(100, Math.round((progress.loaded / progress.total) * 100)) : 0

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={fetchAll} disabled={isFetchingAll}>
          Fetch Full Pokedex Dataset
        </Button>
        <Button variant="secondary" onClick={cancel} disabled={!isFetchingAll}>
          Cancel
        </Button>
      </div>
      <Progress value={pct} className="w-full" />
      <p className="text-xs text-muted-foreground">
        {isFetchingAll ? `Fetching details... ${progress.loaded} / ${progress.total || "?"}` : "Idle"}
      </p>
    </div>
  )
}
