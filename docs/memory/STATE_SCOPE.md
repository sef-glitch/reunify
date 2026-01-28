# State & Scope

## Geographic Scope
- **All U.S. states supported** — baseline workflow works nationwide
- **No automated state-law logic** — app does not enforce state-specific legal rules
- **50-state resource directory** — state/category filtered support resources
- **AI informational guidance** — supportive, not legal advice

## Web App Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Auth (signin/signup) | Complete | Credentials provider, Argon2 hashing |
| Dashboard | Complete | Stats cards, quick actions |
| Cases | Complete | List, detail, create with baseline tasks |
| Tasks | Complete | List, filter, CRUD, priority |
| Weekly Plan | Complete | Category groups, toggle completion, upload proof link |
| Document Vault | Complete | Upload, tag, search, filter |
| AI Chat | Complete | Streaming GPT-4, history persistence |
| Court Packet Export | Complete | Configurable PDF with sections |
| Resources | Complete | State/category filter, bookmarks |
| Settings | Basic | Email display, sign out |
| Password Reset | Missing | No recovery mechanism |
| Error Boundaries | Missing | No global error catching |
| Audit Trail UI | Missing | Table populated, no UI to view |
| Pagination | Missing | All lists load full dataset |
| Onboarding | Missing | No guided first-use flow |
| Loading Skeletons | Missing | Plain "Loading..." text |

## Mobile App Status

| Feature | Status | Notes |
|---------|--------|-------|
| Auth infrastructure | Complete | WebView auth, JWT storage, fetch interceptor |
| Tab navigation | Missing | Stack only, no tabs |
| Dashboard screen | Missing | Returns null |
| Cases screens | Missing | Not created |
| Tasks screen | Missing | Not created |
| Plan screen | Missing | Not created |
| Vault screen | Missing | Not created |
| Chat screen | Missing | Not created |
| Export screen | Missing | Not created |
| Resources screen | Missing | Not created |
| Settings screen | Missing | Not created |

## Known Bugs
- Task status casing inconsistency: `dashboard/page.jsx` uses `"Completed"`, other files use `"completed"`, DB default is `'Not Started'`
- Chakra UI installed but never imported (dead dependency)
- No client-side file size validation before upload
