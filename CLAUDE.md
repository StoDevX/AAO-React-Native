# AAO React Native

## Project Overview

All About Olaf is a React Native mobile app for the St. Olaf College community. It provides students, faculty, and staff with access to campus info, dining menus, course catalogs, campus maps, and more.

- **React Native 0.76.9** with **TypeScript**
- **React Navigation 6** for navigation (typed via `source/navigation/types.ts`)
- **Redux Toolkit** for global state, **React Query 5** for server state
- **Jest** + **React Native Testing Library** for testing
- **Fastlane** for CI/CD
- Monorepo with internal packages in `modules/`

## Code Conventions

- TypeScript for all new code — no `any`
- Functional components with hooks only
- `StyleSheet.create()` for all styles — no inline style objects
- **Naming:** PascalCase components, kebab-case files, camelCase variables/functions, UPPER_SNAKE_CASE constants
- **Imports:** React → React Native → third-party → local. Named imports preferred.
- **No Moment.js** — use `date-fns` or `Day.js` for date/time
- Colors from `@frogpond/colors` — follow existing color system
- Prettier config in `package.json` (tabs, single quotes, no semis)

## Architecture & Patterns

- `source/views/` organized by feature (e.g., `dining/`, `directory/`, `calendar/`)
- Barrel exports (`index.ts`) for clean imports
- State: React Query for server state, Redux Toolkit for global app state, `useState` for component-local
- iOS is the only supported platform
- Email via `sendEmail`, phone via `callPhone` components
- Error logging via Sentry integration
- React Error Boundaries for component error handling

## Mobile Priorities

These patterns are especially important in this codebase:

- **Lists:** Always use `FlatList`, never `ScrollView` for dynamic data. Memoize list items with `React.memo`.
- **Safe areas:** Use `react-native-safe-area-context` — never hardcode status bar padding
- **Touch targets:** Minimum 44x44pt on all interactive elements
- **Accessibility:** Include `accessibilityLabel` and `accessibilityRole` on all interactive elements
- **Offline:** Handle network unavailability gracefully — use cached data as fallback
- **Performance:** Minimize bridge traffic; use `InteractionManager.runAfterInteractions()` for heavy work
- **Memory:** Clean up subscriptions/listeners in `useEffect` cleanup functions
- **Platform testing:** Test on iOS — verify platform-specific UI patterns

## Testing

- Jest + React Native Testing Library for component tests
- Tests live adjacent to source files or in `__tests__/` directories
- Mock native modules and external APIs
- Descriptive test names; group with `describe` blocks
- `beforeEach`/`afterEach` for setup/cleanup
- **XCUITest debugging:** iOS UI tests live in `ios/AllAboutOlafUITests/` and run as sharded CI jobs. When a test fails, two artifacts are uploaded per shard: `uitest-attachments-{shard}` (screenshots extracted via `xcrun xcresulttool export attachments`) and `uitest-results-{shard}.xcresult` (the full XCResult bundle). Start with the attachments for a quick look; open the `.xcresult` bundle in Xcode (or query via `xcrun xcresulttool get --format json --path uitest-results.xcresult`) for full logs, traces, and per-test activity.

## Development Commands

```bash
mise run lint   # ESLint
mise run pretty # Prettier; run `pretty:check` to validate instead
mise run test   # Jest, unit tests
mise run tsc    # Type check
mise run pods   # Install cocoapods, even on Linux
```

## Agent Workflow

**Session startup:** Always run `mise run agent:setup` at the start of every session. This installs dependencies and bundles data files.

**Before committing:** Always run `mise run agent:pre-commit` before committing any changes. This formats code with Prettier, runs ESLint, checks TypeScript types, and runs Jest tests. Do not commit if any step fails.

**Dependency upgrades:** Whenever you upgrade a dependency whose version is mentioned in this file (e.g., React Native, React Navigation, React Query, Redux Toolkit, TypeScript, Jest, Fastlane), update the version reference in CLAUDE.md as part of the same change. Stale version references in this file mislead future sessions about the project's current state.

## Superpowers Skills Framework

This project uses the [Superpowers](https://github.com/obra/superpowers) skills framework. You have superpowers.

**Below is your introduction to using skills. For all other skills, use the `Skill` tool.**

Skills are located in `.claude/skills/`. Agents are in `.claude/agents/`. Commands are in `.claude/commands/`.

### Available Skills

| Skill | Purpose |
|-------|---------|
| `using-superpowers` | Introduction to the skills system |
| `brainstorming` | Socratic design refinement before coding |
| `writing-plans` | Detailed implementation plans |
| `executing-plans` | Batch execution with checkpoints |
| `subagent-driven-development` | Fast iteration with two-stage review |
| `dispatching-parallel-agents` | Concurrent subagent workflows |
| `test-driven-development` | RED-GREEN-REFACTOR cycle |
| `systematic-debugging` | 4-phase root cause process |
| `verification-before-completion` | Ensure it's actually fixed |
| `requesting-code-review` | Pre-review checklist |
| `receiving-code-review` | Responding to feedback |
| `using-git-worktrees` | Parallel development branches |
| `finishing-a-development-branch` | Merge/PR decision workflow |
| `writing-skills` | Create new skills |
| `add-screen` | Scaffold and integrate a new screen into the app |

### Available Agents

| Agent | Purpose |
|-------|---------|
| `code-reviewer` | Reviews completed project steps against plans and coding standards |

### How It Works

**Invoke relevant skills BEFORE any response or action.** Even a 1% chance a skill might apply means you should invoke the skill to check. If an invoked skill turns out to be wrong for the situation, you don't need to use it.

#### Red Flags - These thoughts mean STOP, you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |

#### Skill Priority

When multiple skills could apply, use this order:
1. **Process skills first** (brainstorming, debugging) - these determine HOW to approach the task
2. **Implementation skills second** - these guide execution

"Let's build X" -> brainstorming first, then implementation skills.
"Fix this bug" -> debugging first, then domain-specific skills.
