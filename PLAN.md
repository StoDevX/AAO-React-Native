# Implementation Plan: Navigation Fixes & Tests

## Phase 1: Prettier (auto-fix 26 files)

**Action**: Run `pnpm pretty` to auto-format all 26 files.

No manual edits needed — just run the formatter. Files affected span `modules/`, `src/app/`, `src/views/`.

---

## Phase 2: ESLint config fix

**File**: `eslint.config.mjs:6`

**Problem**: `import expoConfig from 'eslint-config-expo/flat'` fails because Node ESM resolution doesn't allow bare directory imports. The actual file is `eslint-config-expo/flat.js`.

**Fix**: Change line 6 to:
```js
import expoConfig from 'eslint-config-expo/flat.js'
```

Then run `npx eslint` to confirm it works and address any lint errors that surface.

---

## Phase 3: TypeScript errors (3 real errors)

**Error 1**: `modules/navigation-tabs/tabbed-view.tsx:2` — `Cannot find module '@react-navigation/bottom-tabs'`
- This file uses the old `createBottomTabNavigator` pattern. The app now uses `NativeTabs` from expo-router in `_layout.tsx` files. The entire `modules/navigation-tabs/` module appears unused.
- **Fix**: Check if anything imports from `@frogpond/navigation-tabs`. If nothing does, remove the module from `package.json` dependencies. If something does import, add the missing `@react-navigation/bottom-tabs` dep.

**Error 2**: `modules/tableview/cells/textfield.tsx:66` — `Property 'current' does not exist on type '((instance: TextInput | null) => void) | RefObject<TextInput | null>'`
- The `ref` prop type is a union of callback ref and RefObject. `.current` only exists on RefObject.
- **Fix**: Narrow the type with a guard: `if (ref && 'current' in ref) ref.current?.focus()`

**Error 3**: `src/views/directory/list.tsx:49` — `Conversion of type 'OpaqueColorValue | undefined' to type 'string'`
- `c.systemFill` returns `OpaqueColorValue`, cast to `string` is not safe.
- **Fix**: Use `as unknown as string` or check if react-navigation accepts OpaqueColorValue and remove the cast entirely.

---

## Phase 4: GitHub Actions fixes

### 4a: pnpm in cache-cocoapods
**File**: `.github/workflows/check.yml:120`

**Problem**: The `cache-cocoapods` job sets up Node (line 121) but never runs `pnpm/action-setup@v4` first. If the cocoapods cache misses, it needs node_modules, which was built with pnpm.

**Fix**: Add before line 120:
```yaml
      - if: steps.cocoapods-cache.outputs.cache-hit != 'true'
        uses: pnpm/action-setup@v4
```

### 4b: Detox failure -> PR comment
**File**: `.github/workflows/check.yml:525-645` (the `ios-detox` job)

**Problem**: When Detox tests fail, the output is uploaded as an artifact but not posted as a PR comment, making it hard to see failures without downloading artifacts.

**Fix**: After the "Run the Detox tests" step (line 638), add a failure-conditional step that:
1. Captures the Detox output
2. Posts it as a PR comment using `github-script` action

```yaml
      - name: Post Detox failure to PR
        if: failure() && github.event_name == 'pull_request'
        uses: actions/github-script@60a0d83039c74a4aee543508d2ffcb1c3799cdea # v7
        with:
          script: |
            const fs = require('fs');
            const glob = require('glob');
            let body = '## Detox E2E Test Failure\n\n';
            const logFiles = glob.sync('artifacts/**/*.log');
            for (const file of logFiles) {
              const content = fs.readFileSync(file, 'utf8').slice(-3000);
              body += `### ${file}\n\`\`\`\n${content}\n\`\`\`\n`;
            }
            if (logFiles.length === 0) {
              body += 'Detox tests failed. Check the uploaded artifacts for details.';
            }
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: body.slice(0, 65000),
            });
```

---

## Phase 5: Screen title fixes

### 5a: Building Hours (the main bug)
**File**: `src/app/building-hours/index.tsx`

**Problems**:
1. No `default export` (Expo Router requires it for route files)
2. No `<Stack.Screen options={{title: 'Building Hours'}} />` — title falls back to route slug `building-hours`

**Fix**:
```tsx
import {Stack} from 'expo-router'

export default function BuildingHoursView(): React.JSX.Element {
  // ... existing code ...
  return (
    <>
      <Stack.Screen options={{title: 'Building Hours'}} />
      <SectionList ... />
    </>
  )
}
```

### 5b: Calendar title
**File**: `src/app/calendar/_layout.tsx`

**Problem**: Missing `<Stack.Screen options={{title: 'Calendar'}} />` — the other tab layouts (`menus`, `news`, `streaming`, `sis`, `transportation`) all have it, but `calendar` doesn't.

**Fix**: Add `<Stack.Screen options={{title: 'Calendar'}} />` inside the `<NativeTabs>`.

---

## Phase 6: Jest tests

**New file**: `src/app/__tests__/navigation.test.tsx`

Using `@testing-library/react-native` (already installed).

### 6a: Home screen buttons
Test that every `HomeScreenButton` in `HomePage` has the correct `href`. Render the component, query all buttons by their `aria-label` (which matches `title`), and assert the `href` prop.

Covers all 14 internal buttons + 2 external links.

### 6b: Screen titles
For each screen that should have a human-readable title, import the component and verify the `Stack.Screen` `options.title` prop is set correctly (not a slug). Screens to test:
- `building-hours` -> "Building Hours"
- `contacts` -> "Important Contacts"
- `dictionary` -> "Campus Dictionary"
- `directory` -> "Directory"
- `more` -> "More"
- `stoprint` -> "Print Jobs"
- `student-orgs` -> "Student Orgs"

And tab layouts:
- `menus/_layout` -> "Menus"
- `streaming/_layout` -> "Streaming Media"
- `news/_layout` -> "News"
- `sis/_layout` -> "SIS"
- `transportation/_layout` -> "Transportation"
- `calendar/_layout` -> "Calendar"

### 6c: Tab layouts
For each tab `_layout.tsx`, verify the `NativeTabs.Trigger` names and `Label` texts:
- Menus: Stav Hall, The Cage, The Pause, Carleton
- Streaming: Streaming, Webcams, KSTO, KRLX
- News: St. Olaf, The Mess, Oleville
- SIS: Balances, Open Jobs
- Transportation: Express Bus, Red Line, Blue Line, Oles Go, Other Modes
- Calendar: St. Olaf, Oleville, Northfield

### 6d: List -> detail navigation
For `BuildingHoursView`, mock `useRouter` and `useGroupedBuildings`, simulate pressing a row, and assert `router.push` was called with `{pathname: '/building-hours/location/[location]', params: {location: building.name}}`.

---

## Phase 7: Detox tests (one representative per pattern)

**New file**: `e2e/navigation.spec.ts`

Following existing patterns in `e2e/basic-smoke.spec.ts` and `e2e/streaming.spec.ts`.

### 7a: Title display (representative: Building Hours)
```ts
test('Building Hours screen shows proper title', async () => {
  await element(by.text('Building Hours')).tap()
  await expect(element(by.text('Building Hours'))).toBeVisible()
  await expect(element(by.id('screen-homescreen'))).not.toBeVisible()
})
```

### 7b: Settings modal open/close
Already partially covered by `basic-smoke.spec.ts` — add title verification:
```ts
test('Settings screen shows Settings title', async () => {
  await element(by.id('button-open-settings')).tap()
  await expect(element(by.text('Settings'))).toBeVisible()
})
```

### 7c: Tab layout (representative: Menus)
```ts
test('Menus screen shows tab bar with correct tabs', async () => {
  await element(by.text('Menus')).tap()
  await expect(element(by.text('Stav Hall'))).toBeVisible()
  await expect(element(by.text('The Cage'))).toBeVisible()
  await expect(element(by.text('The Pause'))).toBeVisible()
  await expect(element(by.text('Carleton'))).toBeVisible()
})
```

### 7d: List -> detail -> back (representative: Building Hours)
```ts
test('Building Hours list to detail and back', async () => {
  await element(by.text('Building Hours')).tap()
  // tap first building in the list
  await element(by.type('RCTView')).atIndex(0).tap()
  // verify we left the list (detail screen)
  await device.pressBack()
  // verify we're back on the building hours list
  await expect(element(by.text('Building Hours'))).toBeVisible()
})
```

---

## Phase 8: Pre-commit hooks

**File**: `.claude/settings.json` (already created)

Hooks run prettier check, eslint, and jest before every commit.

---

## Commit strategy

Logical chunks, each passing pre-commit hooks:
1. Prettier + ESLint config fix
2. TypeScript fixes
3. GitHub Actions fixes (pnpm + Detox PR comment)
4. Screen title fixes (building-hours, calendar)
5. Jest navigation tests
6. Detox navigation tests
