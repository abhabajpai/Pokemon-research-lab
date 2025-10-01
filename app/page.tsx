"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { usePokedexStore } from "@/store/pokedex-store"
import { PokemonTable } from "@/components/pokemon-table"
import { FetchControls } from "@/components/fetch-controls"
import { UploadCSV } from "@/components/upload-csv"
import { AddColumnDialog } from "@/components/add-column-dialog"
import { ChatOverlay } from "@/components/chat-overlay"
import { exportToCsv } from "@/lib/csv"
import { cn } from "@/lib/utils"

export default function Page() {
  const data = usePokedexStore((s) => s.data)
  const columns = usePokedexStore((s) => s.columns)
  const progress = usePokedexStore((s) => s.progress)
  const [chatOpen, setChatOpen] = useState(false)

  const subtitle = useMemo(() => {
    if (progress.status === "fetching") {
      return `Fetching... ${progress.loaded} / ${progress.total || "?"}`
    }
    if (progress.status === "done") return `Loaded ${data.length} Pokémon`
    return "Ready"
  }, [progress, data.length])

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-balance">The Pokemon Research Lab</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </header>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Data Sources</CardTitle>
            <CardDescription>Fetch from PokeAPI or upload a large CSV and map its schema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="api" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="api">PokeAPI</TabsTrigger>
                <TabsTrigger value="csv">CSV Upload</TabsTrigger>
              </TabsList>
              <TabsContent value="api" className="space-y-4">
                <FetchControls />
              </TabsContent>
              <TabsContent value="csv" className="space-y-4">
                <UploadCSV />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-2">
          <AddColumnDialog />
          <Button variant="secondary" onClick={() => exportToCsv({ rows: data, columns })} disabled={data.length === 0}>
            Export CSV
          </Button>
          <Button variant={chatOpen ? "destructive" : "default"} onClick={() => setChatOpen((v) => !v)}>
            {chatOpen ? "Close AI Editor" : "Open AI Editor"}
          </Button>
        </div>

        <Separator />

        <section aria-label="Data Table" className={cn("relative")}>
          <PokemonTable />
          {chatOpen && <ChatOverlay onClose={() => setChatOpen(false)} />}
        </section>
      </div>
    </main>
  )
}
