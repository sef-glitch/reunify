# Copilot Instructions for Reunify Codebase

## Project Overview
**Reunify** is a trauma-informed mobile app for organizing family court and CPS cases. It's a monorepo with:
- **Mobile app** (`/mobile`): Expo SDK 53 React Native app with tabs, case management, AI assistance, and offline queuing
- **Backend** (`/backend`): Bun + Hono REST API with Zod validation

## Architecture & Data Flow

### Mobile App (`/mobile`)
- **Entry point**: `src/app/_layout.tsx` (root layout with AuthGate, QueryClient, theme providers)
- **Routing**: Expo Router file-based with tabs (`src/app/(tabs)/_layout.tsx` registers actual tabs: cases, documents, evidence, tasks, profile)
- **State management**: 
  - **Server/async state**: React Query (always use object API: `useQuery({ queryKey, queryFn })`)
  - **Local state**: Zustand (select only needed slices with selectors to prevent re-renders)
  - **Auth state**: `auth-context.tsx` with AsyncStorage persistence
- **Key features**: Case intake, task planning, document generation, evidence upload + offline queue, AI assistant
- **Styling**: NativeWind + Tailwind v3 (cn.ts for className merging); CameraView, LinearGradient, Animated components use inline `style` prop

### Backend (`/backend`)
- **Entry point**: `src/index.ts` (Hono app with CORS, health check, route mounting)
- **Routes**: Mount in `src/index.ts`, define in `src/routes/` with Zod validation (`zValidator`)
- **All endpoints must be prefixed with `/api/`**
- **No database configured**—if needed, use database-auth skill and update CLAUDE.md

## Critical Developer Workflows

### Running Locally
- **Mobile**: `bun run start` (Vibecode manages dev server at port 8081)
- **Backend**: `bun run --hot src/index.ts` for hot reload, `bun run typecheck` for validation
- **Linting mobile**: `bun run lint` (uses expo lint)

### Package Management (Critical!)
After `bun add` or `bun remove`, **immediately commit**:
```bash
git add package.json bun.lock
git commit -m "chore: add/remove package-name"
```
Without committing, package changes are lost on sandbox restart, causing "Cannot find package" errors.

## Project-Specific Patterns & Conventions

### Mobile App

**Routing & Navigation**
- Expo Router only: never use stack manually for routing
- Only files registered in `src/app/(tabs)/_layout.tsx` become actual tabs—unregistered files in (tabs)/ are nested routes within tabs
- For modals: create route in `src/app/` (not (tabs)), then register as modal in root `_layout.tsx` with `presentation: "modal"`
- Cannot have both `src/app/index.tsx` and `src/app/(tabs)/index.tsx` (both map to "/" conflict)

**State & Async Operations**
- Wrap third-party lib calls (RevenueCat, OpenAI, etc.) in `useQuery`/`useMutation` for consistent loading states
- Reuse `queryKey` across components to share cached data—don't create duplicate providers
- Use `useMutation` instead of manual `setIsLoading` patterns
- Example: `const { data: plan } = useQuery({ queryKey: ['action-plan', caseId], queryFn: () => generateActionPlan(caseId) })`

**TypeScript & Types**
- Explicit type annotations: `useState<Type[]>([])` not `useState([])`
- Include ALL required properties when creating objects (strict mode enabled)
- Use optional chaining `?.` and nullish coalescing `??` for null/undefined handling
- Key types in `ai-service.ts`: CaseIntake (case details), PlanTask (AI-generated tasks), DocumentTemplate, EvidenceItem

**UI/Styling Gotchas**
- CameraView from `expo-camera` (NOT deprecated Camera), use inline `style={{ flex: 1 }}`
- Horizontal ScrollViews in flex containers need `style={{ flexGrow: 0 }}` to constrain height
- Use Pressable over TouchableOpacity for buttons
- Use custom modals, not Alert.alert()
- Keyboard must be dismissable and not obscure inputs (use react-native-keyboard-controller if needed)
- SafeAreaView: skip when using Stack/Tab navigator with native headers; use for custom/hidden headers; for games use `useSafeAreaInsets` hook

**Icons & Fonts**
- Icons: lucide-react-native
- Fonts: install via `@expo-google-fonts/{font-name}` (e.g., `@expo-google-fonts/inter`)
- Context menus/dropdowns: use zeego (see zeego.dev)

**AI Assistant Integration**
- All AI responses include "not legal advice" disclaimers (key design principle)
- OpenAI API key from `EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY`
- AI Service (`ai-service.ts`): generateActionPlan(), generateDocument(), explainTerm(), analyzeCase(), suggestTasks()
- Models: responses should be trauma-informed, neutral-toned for legal docs, plain language for explanations
- Evidence analysis: actually send to LLM, don't mock

**Offline Queue**
- Evidence uploads queued when offline (`evidence-queue.ts`)
- SyncIndicator component shows sync status
- Queue syncs automatically when connection restored

### Backend

**Zod Validation Pattern**

Store schemas in `src/routes/` or create `src/schemas/` if reused across routes. Use `zValidator` middleware to validate request input:

```typescript
// src/routes/todos.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const createTodoSchema = z.object({
  title: z.string().min(1, "Title required"),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

const todosRouter = new Hono();

// Validate JSON body
todosRouter.post(
  "/",
  zValidator("json", createTodoSchema),
  (c) => {
    const { title, priority } = c.req.valid("json");
    return c.json({ todo: { id: "1", title, priority } }, { status: 201 });
  }
);

// Validate URL params
todosRouter.get(
  "/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  (c) => {
    const { id } = c.req.valid("param");
    return c.json({ todo: { id } });
  }
);

export { todosRouter };
```

**Key patterns**:
- Validation errors automatically return `400` with error details
- Use `c.req.valid("json")` / `c.req.valid("param")` / `c.req.valid("query")` to extract validated data
- Consistent HTTP codes: `400` (validation), `401` (auth), `403` (permission), `500` (server error)

**API Endpoints**

Currently only `/api/sample` exists (returns greeting). Design new endpoints following this table structure:

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/sample` | GET | Example endpoint (remove when real routes added) |

As you add features, expand this with:
- `/api/cases/*` – Case CRUD and context
- `/api/tasks/*` – Task management per case
- `/api/documents/*` – Document generation & storage
- `/api/evidence/*` – Evidence uploads and metadata
- `/api/ai/*` – AI service proxying (if server-side needed)

**CORS & Allowed Origins**
- Localhost: `http://localhost:*`, `http://127.0.0.1:*`
- Vibecode dev: `https://*.dev.vibecode.run`
- Vibecode prod: `https://*.vibecode.run`

## Forbidden Files
Mobile: Do NOT edit patches/, babel.config.js, metro.config.js, app.json, tsconfig.json, nativewind-env.d.ts

## Integrations

### RevenueCat (Payments & Subscriptions)

RevenueCat is partially integrated and gracefully handles missing configuration—the app works fine whether or not it's set up.

**Current State**:
- Client module: `/mobile/src/lib/revenuecatClient.ts` wraps SDK with platform detection and error handling
- Paywall UI: `/mobile/src/app/paywall.tsx` (currently wired but may show fallback if keys missing)
- Environment variables (Vibecode Payments tab sets these):
  - `EXPO_PUBLIC_VIBECODE_REVENUECAT_TEST_KEY` – Dev/test builds (iOS + Android)
  - `EXPO_PUBLIC_VIBECODE_REVENUECAT_APPLE_KEY` – iOS production
  - `EXPO_PUBLIC_VIBECODE_REVENUECAT_GOOGLE_KEY` – Android production

**Platform Differences**:
- iOS/Android: Full RevenueCat support via app stores
- Web: Disabled (RevenueCat doesn't support web; skip payments UI)

**Testing**:
- Dev mode uses test key → connects to RevenueCat Test Store
- Verify keys exist in Vibecode ENV tab before testing
- Mobile app gracefully degrades if keys missing (no errors, paywall hidden)

## Secrets & Env Safety

**Critical**: Never store sensitive API keys in `EXPO_PUBLIC_*` environment variables (they're baked into the app binary and visible).

**OpenAI API Key Security**:
- Currently: `EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY` in mobile code
- **Risk**: Exposed in client bundle → potential abuse
- **Better approach**:
  1. Move key to backend `/backend/src/env.ts` only
  2. Create `/api/ai/chat` endpoint that proxies requests
  3. Mobile calls backend instead of OpenAI directly
  4. Backend validates & rate-limits per user

**Server-Side Secrets** (if added):
- Database credentials, API keys, webhooks: store in backend env only
- Frontend should never directly access these
- Use backend-provided tokens/sessions instead

**RevenueCat Keys**:
- `EXPO_PUBLIC_VIBECODE_REVENUECAT_*` is safe (intentionally public, RevenueCat SDK designed for it)
- App Store & Play Store handle actual payment processing
- Mobile calls backend via fetch/axios
- Backend provides /api/sample example route (expand as needed)
- All mobile-backend requests go through Vibecode proxy (DO NOT REMOVE `import "@vibecodeapp/proxy"`)

## Key Files by Purpose

| Purpose | File(s) |
|---------|---------|
| AI responses & prompts | `/mobile/src/lib/ai-service.ts` |
| Case/task/evidence state | `/mobile/src/lib/database.ts`, React Query hooks |
| Auth flow | `/mobile/src/lib/auth-context.tsx` |
| UI utilities | `/mobile/src/lib/cn.ts`, `/mobile/src/components/` |
| Backend routes | `/backend/src/routes/`, mounted in `/backend/src/index.ts` |
| Offline queue | `/mobile/src/lib/evidence-queue.ts` |

## Development Notes
- User is non-technical (Vibecode App only, no terminal access)—explain changes clearly and ask to use LOGS/ENV/API tabs
- This is Vibecode environment: system manages git and dev server, don't interact with either
- Logs in expo.log file for mobile debugging
- When implementing AI features, first try to do it yourself; only ask user for API keys/env if needed
- For ambitious requests, scope down to specific functionality
- Use unsplash.com for placeholder images, or direct user to IMAGES tab for generation/upload
