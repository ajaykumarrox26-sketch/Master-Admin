# Project memory

## Product intent & audience

- Data Import tool to bring external data into a system (specific system TBD).
- Firebase project ID `girembo-sewa-kendra-598ed` suggests an Indian service-center context (possibly finance/lending based on "Sewa Kendra").

## Brand personality & voice

- Production-grade, non-cookie-cutter UI (per `.bolt/prompt`).

## Visual design & UX direction

- Stack: React + Vite, Tailwind CSS, Lucide React icons.
- Path alias `@/` maps to `src/` for imports.

## Decisions, constraints & rationale

- Firebase config managed via `.env` environment variables, initialized in `src/firebase.ts` (or similar).
- Firebase credentials (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId) are env-driven.
- `measurementId` (`G-3KCTXPVMZ5`) added to enable optional Google Analytics.
- No extra UI/icon/theme packages beyond Tailwind + lucide-react unless explicitly requested.

## Open questions & assumptions

- Target system receiving imported data is unspecified.
- Firebase services in use (Auth, Firestore, Storage, Analytics) not fully confirmed — assume Auth + Firestore at minimum.
- Import data formats/sources not yet defined.
- UI/design system details not yet inferred.