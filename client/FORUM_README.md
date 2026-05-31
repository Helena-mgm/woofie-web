# Community & Messages — Developer Notes

## Overview

Forum routes are now split across feature-aligned modules under `src/features/` to keep UI, data access, and mutations encapsulated per domain.

```
src/
├── app/
│   ├── community/
│   │   ├── page.tsx          # Authenticated feed
│   │   └── map/page.tsx      # Map explorer
│   ├── messages/page.tsx     # Messaging hub
│   └── services/page.tsx     # Care marketplace
├── features/
│   ├── community/
│   │   ├── feed/             # Feed UI + mappers + reducer
│   │   └── map/              # Map view wrapper
│   ├── messages/             # Inbox hooks + UI
│   ├── services/             # Filters + cards + hook
│   └── security/             # ProtectRoute gate
└── shared/
    └── ui/                   # Tailwind-based primitives (Button/Card/...)
```

## Routes

| Path | Feature | Description |
| --- | --- | --- |
| `/community` | Community feed | Authenticated feed with composer, filters, nested comments |
| `/community/map` | Map explorer | MapLibre view with curated highlights and POI toggle |
| `/messages` | Messaging hub | Inbox + thread, WoofieBot integration, Query-driven state |
| `/services` | Care marketplace | Filterable list of verified walkers, sitters, and specialists |

## Feature Highlights

### Community Feed
- Post composer built on `shared/ui` primitives
- Reducer-driven `useFeed` hook with async commands in `feedCommands.ts`
- API layer (`feedApi.ts`) + mappers to normalise backend payloads
- Comment thread supports replies, likes, deletes without touching global state

### Messages
- `useMessages` orchestrates REST + WebSocket events
- Inbox panel and thread UI separated into <70 line components
- Bot conversations leverage `sendBotMessage` with typing indicator feedback

### Services
- `useServices` centralises availability/service/search filters
- `ServiceFilters` and `ServiceCard` provide Tailwind-first UI
- Data mocks live in `infrastructure/data/services.ts` ready for backend wiring

### Map
- `features/community/map/MapView` wraps the existing MapLibre canvas
- Sidebar showcases curated dog-friendly places; POI toggle drives map markers

## Design System
- New primitives (`Button`, `Card`, `Badge`, `Input`, `Textarea`, `Avatar`) live in `shared/ui`
- Palette follows Woofie brand (`#D2691E`, `#8B4513`, gradient backgrounds)
- Rounded 32-36px corners + soft shadows for consistent visual language

## Integration Notes
- Feed actions hit `/api/posts/**` endpoints (like/comment/reply/delete)
- Messages consume `/api/conversations` + `/api/conversations/:id/messages`
- Services currently mock data; swap `mockDogSitters` once backend endpoints exist
- All authenticated routes run through `ProtectRoute` (cookie/token gate)

## Next Steps
1. Connect feed/services data to production API responses
2. Replace legacy `chatWebSocket` client with a typed wrapper inside `features/messages`
3. Migrate remaining legacy presentation modules (events, auth layouts) into feature slices
4. Expand map POI sourcing and support live event overlays
