# The Pokémon Research Lab

High-performance web app to aggregate, analyze, edit, and export a full Pokédex dataset.

## Tech Stack
- Next.js 14+ (App Router), TypeScript
- Tailwind CSS (v4 tokens), shadcn/ui
- Zustand (persisted with localStorage)
- TanStack Query, TanStack Table, TanStack Virtual
- Papa Parse (streaming CSV)

## Features
- Fetch Full Pokédex Dataset
  - TanStack Query pagination for PokeAPI listing
  - Concurrency-controlled detail fetching with live progress and cancel
- CSV Upload (Streaming) + Schema Mapping
  - Client-side streaming with Papa Parse to avoid memory spikes
  - Map CSV headers to typed fields with number/list coercion
- Interactive Virtualized Table
  - TanStack Table + Virtual: fast scroll for 1k+ rows
  - Sorting, inline editing with type-aware inputs, sticky first/last columns (bonus)
- Dynamic Columns
  - Add columns at runtime with default values propagated to all rows
- AI Editing Assistant (Bonus)
  - Simple command parser, e.g.:
    - set hp to 100 for all pokemon of type 'grass'
    - delete rows where name is 'gengar'
    - update ability to 'levitate' where name is 'gengar'
- Export to CSV
  - Exports current view using dynamic columns

## Getting Started
1. Open the app (v0 preview) and:
   - Use “Fetch Full Pokedex Dataset” to aggregate via PokeAPI, or
   - Upload a CSV in the “CSV Upload” tab and map headers, then import.
2. Edit cells inline, add new columns via “Add Column,” or use the AI Editor overlay to apply bulk changes.
3. Click “Export CSV” to download your modified dataset.

## Architecture & Performance
- Global Store: Zustand holds rows and dynamic column definitions; updates are immutable and scoped.
- Virtualization: Row virtualization keeps DOM light for scrolling performance.
- Data Fetching: TanStack Query handles pagination for the listing; details are fetched concurrently with an AbortController and pooled concurrency.
- CSV Streaming: Papa Parse with step and chunkSize to process rows incrementally without loading entire files into memory.
- Persistence: localStorage via Zustand persist for datasets and columns (progress is not persisted).

## Notes
- API: https://pokeapi.co/
- Accessibility: Inputs have aria-labels; images include alt text; semantic sections used.
- Deploy: Use the “Publish” button in v0 to deploy to Vercel. For installing locally, prefer the shadcn CLI or GitHub export from the v0 UI.
