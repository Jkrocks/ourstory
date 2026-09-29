# OurStory design system

## Idea
One colourful thread wanders down a warm white page. Photographs sit on it in circles and soft rectangles, each ringed in the colour of its kind of memory. Colour comes from an Indian celebration palette and always means something: the kind of memory.

## Tokens (`src/index.css`)
All colours are RGB triples used as `rgb(var(--token))`, with light and dark values.

| Token | Name | Light | Use |
|---|---|---|---|
| `--paper` | Warm white | 251 247 240 | Page |
| `--card` | Print | 255 255 255 | Cards, sheets |
| `--ink` | Ink | 35 32 28 | Text |
| `--muted` | Pencil | 110 102 92 | Secondary text |
| `--line` | Hairline | 226 217 203 | Borders, dividers |
| `--sand` | Sand | 243 235 222 | Soft fills, empty photos |
| `--heart` | Rani pink | 201 46 104 | Primary action, favourites |
| `--honey` | Marigold | 244 166 0 | Birthdays, festivals |
| `--sage` | Peacock teal | 13 133 133 | Home, everyday |
| `--indigo` | Indigo | 64 76 172 | School, graduation |
| `--leaf` | Leaf | 40 128 64 | First steps, achievements |
| `--peach` | Coral | 240 108 78 | Funny moments, important dates |
| `--lilac` | Lilac | 142 96 204 | Babies, stories |
| `--sky` | Sky | 24 120 190 | Trips, photos |

### Tone classes
Put `tone-<name>` on an element to set `--tone`, then use:
- `bg-tone` – solid fill with readable text (dark text on marigold and coral, white on the rest; dark text on all tones in dark mode)
- `bg-tone-soft` – 14% tint for panels
- `text-tone`, `border-tone`, `ring-[rgb(var(--tone))]`

Memory type → tone: `toneOf(typeId)` in `src/lib/utils.ts`. Decorative cycling: `toneAt(i)`.

## Type
- Display: **Zen Old Mincho** – titles, numbers, year markers
- Text & UI: **Zen Kaku Gothic New** – body 16px / 1.7, labels 12–14px with letter-spacing
- Scale: 12 · 14 · 16 · 17 · 22 · 26 · 34 · 44 · 56 · 84

## Components
| Component | Rule |
|---|---|
| **Btn** primary | Rani pink, full pill, 48px min height. One per view. |
| **Btn** soft / ghost | Sand fill / text only, for secondary actions |
| **Photo stop** (`PathMemory`) | Circle, rect, tall or wide shape; 5px ring in the memory's tone; optional tone dot; milestone gets a vertical tone tag |
| **Wandering thread** (`useWander`) | 3.5px line through each photo's centre; pink → marigold → teal → indigo → lilac gradient |
| **TypeBadge** | White pill with a tone-filled emoji circle |
| **Tinted panel** | `bg-tone-soft`, 24–32px radius, no shadow (On this day, Coming up, Invite) |
| **Sheet** | Bottom sheet on phones, centred dialog on desktop; Escape closes; focus returns |
| **YouTube tile** | Thumbnail from YouTube; if it can't load, a pink→marigold gradient tile with a play mark |

## States
- Focus: 3px teal outline on every control
- Hover: photos scale 1.02–1.03, cards lift 2px
- Disabled: 40% opacity
- Loading: "Saving…" on the save button; sign-in buttons disable while working
- Errors: pink text with `role="alert"`, written as what happened and what to do

## Motion
Rise-in 550ms, fade 400ms, sheet 320ms, heart pop 450ms, recap Ken Burns 9s. All off under `prefers-reduced-motion`.

## Accessibility
Touch targets ≥ 44px. Text on tone fills picked for ≥ 4.5:1. Every icon button has a label. Keyboard: Tab through everything, Escape closes overlays, arrow keys in the photo viewer and recap.
