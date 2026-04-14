# Reunify

A calm, trauma-informed mobile app for organizing family court and CPS cases.

## Features

- **Authentication**: Secure email/password login with local account storage
- **Onboarding**: Welcoming introduction flow for new users explaining key features
- **Demo Mode**: Try the app with pre-filled sample case data without committing
- **Dashboard**: Overview with next court date, priority tasks, and quick actions
- **Cases**: Create and manage legal cases with state, county, case type, stage, and goals
- **Tasks**: Checklist per case with priority levels and due dates; export to CSV
- **Documents**: Generate documents from templates (letters, declarations, logs, request templates) and manage a document library with version history
- **Evidence**: Upload photos/files, add notes and tags, link evidence to tasks and documents
- **Offline Queue**: Evidence uploads are queued when offline and synced when back online
- **Profile**: Personal information, helpful resources, and data export
- **Export**: Export tasks to CSV; generate court packets combining documents and evidence index
- **Help & Support**: In-app help page with FAQs about subscriptions, privacy, exports, and usage

### AI Assistant

The app includes an AI-powered assistant (GPT-5.2) that provides:

- **Action Plan Generator**: Creates prioritized task lists and evidence-gathering suggestions based on your case details and goals
- **Document Drafting**: Generates professional, neutral-toned documents (letters, declarations, requests) customized to your case with a **review before saving** step
- **Term Explainer**: Explains legal terms and court document excerpts in plain language, with questions to ask your lawyer and things to verify
- **Smart Case Analysis**: AI-powered assessment of case preparation — identifies strengths, areas to improve, risk factors, and stage-specific advice
- **Task Suggestions**: AI analyzes existing tasks and case context to suggest new tasks that fill gaps in preparation

All AI responses include clear disclaimers that this is not legal advice and users should verify information with official sources or counsel.

### Accessibility

- All interactive elements have accessibility labels
- Haptic feedback on key interactions
- High contrast text and clear visual hierarchy
- Screen reader compatible

## Tech Stack

- Expo SDK 53 / React Native 0.76.7
- Expo Router (file-based routing)
- SQLite (expo-sqlite) for persistent database storage on mobile
- AsyncStorage for web platform support and settings
- Zustand for local state (evidence queue)
- React Context for authentication and data management
- React Query for async state management
- NativeWind / TailwindCSS (styling)
- Lucide React Native (icons)
- expo-secure-store for session management (mobile)
- expo-haptics for tactile feedback
- react-native-reanimated for animations
- @react-native-community/netinfo for network status
- OpenAI API for AI features

## Database Schema

- **users**: id, email, passwordHash, name, phone, notes, timestamps
- **cases**: id, userId, name, state, county, caseType, stage, nextHearingDate, goals
- **tasks**: id, userId, caseId, title, description, priority, status, dueDate, aiGenerated, aiPlanId, timestamps
- **documents**: id, userId, caseId, title, category, content, timestamps
- **document_versions**: id, documentId, version, content, createdAt (tracks version history)
- **evidence**: id, userId, caseId, title, type, uri, notes, tags, linkedTaskIds, linkedDocumentIds, createdAt
- **settings**: id, userId, key, value, updatedAt

## Data Storage

All data is stored locally on the device using SQLite (mobile) or AsyncStorage (web). User passwords are hashed. Session is stored securely using expo-secure-store on mobile or AsyncStorage on web. No personal data is sent to external servers except for AI features which use OpenAI.

## AI Features

The AI Assistant uses OpenAI's GPT-5.2 via the chat completions API to provide guidance. All AI-generated content includes disclaimers and recommendations to verify with official sources or legal counsel. The AI service:

- Generates action plans with prioritized tasks and evidence suggestions
- Drafts professional documents in a neutral tone (with review/edit before saving)
- Explains legal terms in plain language with follow-up questions
- Analyzes cases for organizational readiness with strengths, gaps, and risk factors
- Suggests new tasks based on case context and existing task gaps

API key is configured via the Vibecode API tab.

## Export Features

- **Tasks CSV**: Export all tasks (or filtered by case) to a CSV file
- **Court Packet**: Generate an HTML document combining selected documents and an evidence index table

## Subscriptions

Premium subscription powered by RevenueCat. Pricing:
- **Monthly**: $12.99/month
- **Yearly**: $99.99/year (save 35%)
- **Free Trial**: 7-day free trial with annual plan

Premium features include:
- AI case analysis & strategic insights
- AI action plan generation
- AI task suggestions & recommendations
- AI-powered document drafting
- Court packet export

Free users can:
- Create and manage cases
- Track tasks with priorities
- Store documents and evidence
- Use all organizational features
- **Explain a Term** (AI-powered legal term explanations)

Subscription status is managed via RevenueCat with the "premium" entitlement.

## Help & Support

The in-app Help page covers:
- Subscription plans and billing
- Privacy and data security
- Exporting records and backups
- Legal disclaimers
- App usage tips

## Disclaimer

This app provides information support only — not legal advice. Always consult with a qualified attorney for legal matters.
