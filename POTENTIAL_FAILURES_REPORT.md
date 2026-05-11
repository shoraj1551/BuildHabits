# Potential Failure Report (Current Branch)

Date: 2026-05-11

## Scope
Reviewed key frontend state and analytics logic plus attempted a TypeScript production build.

## Potential Failures

1. **Archived habits can still be toggled from analytics totals (data integrity mismatch).**
   - `completionsPerDay` is computed from all `habits`, including archived ones, while reliability uses only active habits.
   - This can inflate completion bars and make the overview inconsistent with “active-only” reliability.
   - Files: `src/components/Analytics.tsx`, `src/utils/analyticsUtils.ts`.

2. **`clearAllData` does not actually clear all persisted data.**
   - The method only resets `habits`, but leaves `userProfile` and other persisted keys untouched.
   - A user may expect a full reset and get partial state retention after invoking “clear all data”.
   - File: `src/store/useHabitStore.ts`.

3. **Potential timezone/day-boundary edge behavior around local-midnight writes.**
   - `toISOLocal` manually offsets and truncates to date; this is usually fine, but it can still produce subtle edge behavior when dates are constructed from mixed UTC/local sources.
   - Risk is higher if future code passes dates parsed from UTC timestamps.
   - File: `src/utils/dateUtils.ts`.

4. **No defensive validation for persisted shape before merge.**
   - The custom `merge` trusts `persistedState.habits` item shape and unconditionally does `new Date(habit.createdAt)`.
   - Corrupted localStorage could create invalid dates and downstream rendering/sorting bugs.
   - File: `src/store/useHabitStore.ts`.

## Build/Tooling Failure Observed

5. **`npm run build` currently fails in this environment due unresolved module/type resolution.**
   - Errors include missing `react`, `react/jsx-runtime`, `zustand`, `date-fns`, etc. despite dependencies declared in `package.json`.
   - Most likely cause in this environment: dependencies are not installed (`node_modules` absent) before build.
   - This blocks compile-time verification and can mask true code-level TypeScript errors until install is fixed.

## Recommended Next Checks

- Run `npm ci` then rerun `npm run build`.
- Add a small validation layer for persisted habit records (e.g., guard invalid `createdAt`).
- Decide whether analytics “Total Output” should include archived habits; if not, switch to `activeHabits` consistently.
- Consider making `clearAllData` reset `userProfile` + UI state, or rename it to `clearHabits` for accuracy.
