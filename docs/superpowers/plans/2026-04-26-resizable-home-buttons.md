# Resizable Home Screen Buttons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users resize each home-screen tile between 1×1, 1×2, 2×2, and 2×4 via long-press → iOS context menu, with sizes auto-persisted across app launches and a "Reset home screen layout" action on the existing notice menu.

**Architecture:** A new pure `packTiles` function arranges variable-size tiles on a 4-column grid using strict-order packing. A new `HomeScreenGrid` renders absolute-positioned tiles inside a sized container. Each cell is a `HomeScreenTile` orchestrator that wires Redux + the existing `@frogpond/context-menu` around a size-aware `HomeScreenButton`. Persistence is free: the `settings` slice is already wrapped by `redux-persist`.

**Tech Stack:** React Native 0.81.5, TypeScript, Redux Toolkit + redux-persist, React Navigation 6, `react-native-ios-context-menu` (via `@frogpond/context-menu`), Jest + React Native Testing Library, XCUITest.

**Spec:** `docs/superpowers/specs/2026-04-26-resizable-home-buttons-design.md`

---

## File Structure

**New files:**

| File | Responsibility |
|------|----------------|
| `source/views/home/types.ts` | `TileSize` type, `TILE_SIZES`, `DEFAULT_TILE_SIZE`, `TILE_DIMENSIONS`, `GRID_COLUMNS` |
| `source/views/home/pack-tiles.ts` | Pure `packTiles(views, sizeOf)` returning `PackedTile[]` |
| `source/views/home/grid.tsx` | `HomeScreenGrid` — absolute-positioned layout |
| `source/views/home/tile.tsx` | `HomeScreenTile` — Redux + ContextMenu orchestrator per cell |
| `source/views/home/__tests__/pack-tiles.test.ts` | Packer unit tests |
| `source/views/home/__tests__/tile.test.tsx` | Tile orchestrator component tests |
| `source/views/home/__tests__/button.test.tsx` | Button size-variant tests |
| `source/views/__tests__/views.test.ts` | View id uniqueness + slug-format tests |
| `source/redux/__tests__/settings.test.ts` | Settings slice tests for new fields |

**Modified files:**

| File | Change |
|------|--------|
| `source/views/views.ts` | Add `id: string` to `CommonView`; add slug ids to all entries |
| `source/redux/parts/settings.ts` | Add `homescreenSizes`, reducers, selector |
| `modules/context-menu/index.tsx` | Accept `Array<{key, title}>` action shape (backwards compat with `string[]`) |
| `source/views/home/button.tsx` | Add `size` prop + four content variants |
| `source/views/home/tile.tsx` | New (orchestrator) — see "New" |
| `source/views/home/notice.tsx` | Add "Reset home screen layout" menu item |
| `source/views/home/index.tsx` | Use `HomeScreenGrid` instead of `partitionByIndex` |
| `ios/AllAboutOlafUITests/ModuleHomeTests.swift` | Add 3 new tests |

---

## Task list

1. Add `TileSize` types and grid constants
2. Implement and test the `packTiles` packer (TDD)
3. Add stable `id` field to all views, with uniqueness tests
4. Extend the settings Redux slice with `homescreenSizes`, reducers, and selector
5. Extend `@frogpond/context-menu` to accept `{key, title}` action shape
6. Add size-aware variants to `HomeScreenButton`
7. Build the `HomeScreenTile` orchestrator (Redux + ContextMenu)
8. Build the `HomeScreenGrid` layout component
9. Wire `HomePage` to use the new grid
10. Add "Reset home screen layout" to the notice context menu
11. Add XCUITests covering resize, persistence, gap, rotation, and reset

Each task ends with `mise run agent:pre-commit` and a commit on the current branch (`claude/resizable-home-buttons-tAQN6`).

---

## Task 1: Add `TileSize` types and grid constants

**Files:**
- Create: `source/views/home/types.ts`

- [ ] **Step 1: Create the types file**

Write `source/views/home/types.ts`:

```ts
export type TileSize = '1x1' | '1x2' | '2x2' | '2x4'

export const TILE_SIZES: readonly TileSize[] = ['1x1', '1x2', '2x2', '2x4']

export const DEFAULT_TILE_SIZE: TileSize = '1x2'

export const TILE_DIMENSIONS: Record<TileSize, {rows: 1 | 2; cols: 1 | 2 | 4}> = {
	'1x1': {rows: 1, cols: 1},
	'1x2': {rows: 1, cols: 2},
	'2x2': {rows: 2, cols: 2},
	'2x4': {rows: 2, cols: 4},
}

export const GRID_COLUMNS = 4
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `mise run tsc`
Expected: PASS — no errors. (The file isn't imported yet; this just validates syntax.)

- [ ] **Step 3: Run pre-commit checks**

Run: `mise run agent:pre-commit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add source/views/home/types.ts
git commit -m "feat(home): add TileSize types and grid constants"
```

---

## Task 2: Implement and test the `packTiles` packer (TDD)

**Files:**
- Create: `source/views/home/pack-tiles.ts`
- Test: `source/views/home/__tests__/pack-tiles.test.ts`

- [ ] **Step 1: Write the failing test file**

Create `source/views/home/__tests__/pack-tiles.test.ts`:

```ts
import {describe, it, expect} from '@jest/globals'
import {packTiles} from '../pack-tiles'
import type {TileSize} from '../types'
import type {ViewType} from '../../views'

const v = (id: string): ViewType => ({
	id,
	type: 'view',
	view: 'Home',
	title: id,
	icon: 'home',
	foreground: 'light',
	tint: '#000',
})

const fixedSize = (size: TileSize) => () => size
const sizeMap = (sizes: Record<string, TileSize>) => (view: ViewType) =>
	sizes[view.id] ?? '1x2'

describe('packTiles', () => {
	it('returns empty array for no views', () => {
		expect(packTiles([], fixedSize('1x2'))).toEqual([])
	})

	it('packs all-1x2 tiles into the same two-column layout as today', () => {
		const views = [v('a'), v('b'), v('c'), v('d'), v('e')]
		const packed = packTiles(views, fixedSize('1x2'))
		expect(packed.map((p) => [p.row, p.col])).toEqual([
			[0, 0],
			[0, 2],
			[1, 0],
			[1, 2],
			[2, 0],
		])
	})

	it('places a single 2x4 spanning the full row at (0,0)', () => {
		const packed = packTiles([v('wide')], fixedSize('2x4'))
		expect(packed[0]).toMatchObject({row: 0, col: 0, size: '2x4'})
	})

	it('packs mixed [1x2, 1x2, 2x2, 1x1, 1x2] with the 2x2 reservation respected', () => {
		const views = [v('a'), v('b'), v('c'), v('d'), v('e')]
		const sizes = sizeMap({a: '1x2', b: '1x2', c: '2x2', d: '1x1', e: '1x2'})
		const packed = packTiles(views, sizes)
		// a(1x2) at (0,0); b(1x2) at (0,2);
		// c(2x2) wraps to (1,0) and reserves (1,0)(1,1)(2,0)(2,1);
		// d(1x1) at (1,2);
		// e(1x2) — cursor at (1,3) overflows; wraps to (2,0) which is reserved;
		//   advances to (2,2) where 2 cols fit.
		expect(packed.map((p) => [p.row, p.col])).toEqual([
			[0, 0],
			[0, 2],
			[1, 0],
			[1, 2],
			[2, 2],
		])
	})

	it('reserves columns of a 2x2 across both rows so subsequent tiles flow around it', () => {
		const views = [v('a'), v('b'), v('c'), v('d')]
		const sizes = sizeMap({a: '2x2', b: '1x2', c: '1x2', d: '1x2'})
		const packed = packTiles(views, sizes)
		// a(2x2) at (0,0) reserves (0,0)(0,1)(1,0)(1,1);
		// b(1x2) at (0,2);
		// c(1x2) wraps and lands at (1,2) past the reservation;
		// d(1x2) at (2,0).
		expect(packed.map((p) => [p.row, p.col])).toEqual([
			[0, 0],
			[0, 2],
			[1, 2],
			[2, 0],
		])
	})

	it('drops a 2x4 to a new row when it cannot fit in remaining cols', () => {
		const views = [v('small'), v('wide')]
		const sizes = sizeMap({small: '1x1', wide: '2x4'})
		const packed = packTiles(views, sizes)
		expect(packed[0]).toMatchObject({row: 0, col: 0})
		expect(packed[1]).toMatchObject({row: 1, col: 0})
	})

	it('wraps a 2x4 to the next row when the cursor sits past col 0', () => {
		const views = [v('a'), v('b'), v('c')]
		const sizes = sizeMap({a: '1x2', b: '1x2', c: '2x4'})
		const packed = packTiles(views, sizes)
		expect(packed.map((p) => [p.row, p.col])).toEqual([
			[0, 0],
			[0, 2],
			[1, 0],
		])
	})
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mise run test -- pack-tiles`
Expected: FAIL — Cannot find module `../pack-tiles`.

- [ ] **Step 3: Implement the packer**

Create `source/views/home/pack-tiles.ts`:

```ts
import type {ViewType} from '../views'
import {GRID_COLUMNS, TILE_DIMENSIONS, type TileSize} from './types'

export type PackedTile = {
	view: ViewType
	size: TileSize
	row: number
	col: number
}

export function packTiles(
	views: ViewType[],
	sizeOf: (view: ViewType) => TileSize,
): PackedTile[] {
	const result: PackedTile[] = []
	const occupied = new Set<string>()

	const cellKey = (r: number, c: number) => `${r},${c}`
	const isOccupied = (r: number, c: number) => occupied.has(cellKey(r, c))
	const occupy = (r: number, c: number) => occupied.add(cellKey(r, c))

	const fits = (r: number, c: number, rows: number, cols: number) => {
		if (c + cols > GRID_COLUMNS) return false
		for (let dr = 0; dr < rows; dr++) {
			for (let dc = 0; dc < cols; dc++) {
				if (isOccupied(r + dr, c + dc)) return false
			}
		}
		return true
	}

	let row = 0
	let col = 0

	for (const view of views) {
		const size = sizeOf(view)
		const {rows, cols} = TILE_DIMENSIONS[size]

		while (!fits(row, col, rows, cols)) {
			col += 1
			if (col >= GRID_COLUMNS) {
				col = 0
				row += 1
			}
		}

		result.push({view, size, row, col})
		for (let dr = 0; dr < rows; dr++) {
			for (let dc = 0; dc < cols; dc++) {
				occupy(row + dr, col + dc)
			}
		}

		col += cols
		if (col >= GRID_COLUMNS) {
			col = 0
			row += 1
		}
	}

	return result
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `mise run test -- pack-tiles`
Expected: PASS — all 7 tests green.

- [ ] **Step 5: Run pre-commit checks**

Run: `mise run agent:pre-commit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add source/views/home/pack-tiles.ts source/views/home/__tests__/pack-tiles.test.ts
git commit -m "feat(home): add packTiles packer for variable-size grid"
```

---

## Task 3: Add stable `id` field to all views, with uniqueness tests

**Files:**
- Modify: `source/views/views.ts`
- Test: `source/views/__tests__/views.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `source/views/__tests__/views.test.ts`:

```ts
import {describe, it, expect} from '@jest/globals'
import {AllViews} from '../views'

describe('AllViews()', () => {
	it('every view has a non-empty kebab-case id', () => {
		const views = AllViews()
		const idPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/
		for (const view of views) {
			expect(view.id).toMatch(idPattern)
		}
	})

	it('all view ids are unique', () => {
		const views = AllViews()
		const ids = views.map((view) => view.id)
		const unique = new Set(ids)
		expect(unique.size).toBe(ids.length)
	})
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mise run test -- views.test`
Expected: FAIL — `view.id` is `undefined`, doesn't match the pattern.

- [ ] **Step 3: Add `id` to `CommonView` and to every view entry**

Modify `source/views/views.ts`. Update the type and add `id:` as the first field of every view object.

Change `CommonView` (around line 21–27):

```ts
type CommonView = {
	id: string
	title: string
	icon: keyof typeof EntypoGlyphs
	foreground: 'light' | 'dark'
	tint: string
	disabled?: boolean
}
```

Then add an `id` to each entry in the `AllViews()` return array. The full mapping:

| Title (existing) | `id` |
|------------------|------|
| Menus | `menus` |
| SIS | `sis` |
| Building Hours | `building-hours` |
| Calendar | `calendar` |
| Directory | `directory` |
| Streaming Media | `streaming-media` |
| News | `news` |
| Campus Map | `campus-map` |
| Important Contacts | `important-contacts` |
| Transportation | `transportation` |
| Campus Dictionary | `campus-dictionary` |
| Student Orgs | `student-orgs` |
| More | `more` |
| stoPrint | `stoprint` |
| Course Catalog | `course-catalog` |
| Oleville | `oleville` |

For example, the Menus entry becomes:

```ts
{
	id: 'menus',
	type: 'view',
	view: menus,
	title: 'Menus',
	icon: 'bowl',
	foreground: 'light',
	tint: c.grassToLime[0],
},
```

Apply the same pattern to all 16 views.

- [ ] **Step 4: Run tests to verify they pass**

Run: `mise run test -- views.test`
Expected: PASS — both tests green.

- [ ] **Step 5: Type-check**

Run: `mise run tsc`
Expected: PASS. (TypeScript will flag any missed `id` in `views.ts` because `CommonView` requires it.)

- [ ] **Step 6: Run pre-commit checks**

Run: `mise run agent:pre-commit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add source/views/views.ts source/views/__tests__/views.test.ts
git commit -m "feat(views): add stable id field to home screen views"
```

---

## Task 4: Extend the settings Redux slice with `homescreenSizes`, reducers, and selector

**Files:**
- Modify: `source/redux/parts/settings.ts`
- Test: `source/redux/__tests__/settings.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `source/redux/__tests__/settings.test.ts`:

```ts
import {describe, it, expect} from '@jest/globals'
import {
	reducer,
	resetHomescreenSizes,
	selectHomescreenSize,
	setHomescreenTileSize,
	type State,
} from '../parts/settings'
import {DEFAULT_TILE_SIZE} from '../../views/home/types'
import type {RootState} from '../store'

const baseState: State = {
	unofficialityAcknowledged: false,
	devModeOverride: false,
	homescreenSizes: {},
}

const wrapState = (settings: State): RootState =>
	({settings} as unknown as RootState)

describe('settings slice — homescreen sizes', () => {
	it('initial state has an empty homescreenSizes map', () => {
		const next = reducer(undefined, {type: '@@INIT'})
		expect(next.homescreenSizes).toEqual({})
	})

	it('setHomescreenTileSize writes the size keyed by id', () => {
		const next = reducer(
			baseState,
			setHomescreenTileSize({id: 'menus', size: '2x2'}),
		)
		expect(next.homescreenSizes).toEqual({menus: '2x2'})
	})

	it('setHomescreenTileSize overwrites an existing size for the same id', () => {
		const initial: State = {
			...baseState,
			homescreenSizes: {menus: '1x1'},
		}
		const next = reducer(initial, setHomescreenTileSize({id: 'menus', size: '2x4'}))
		expect(next.homescreenSizes).toEqual({menus: '2x4'})
	})

	it('resetHomescreenSizes clears the map', () => {
		const initial: State = {
			...baseState,
			homescreenSizes: {menus: '2x2', sis: '1x1'},
		}
		const next = reducer(initial, resetHomescreenSizes())
		expect(next.homescreenSizes).toEqual({})
	})

	it('selectHomescreenSize returns the stored size when present', () => {
		const state = wrapState({...baseState, homescreenSizes: {menus: '2x2'}})
		expect(selectHomescreenSize('menus')(state)).toBe('2x2')
	})

	it('selectHomescreenSize returns DEFAULT_TILE_SIZE for an unknown id', () => {
		const state = wrapState(baseState)
		expect(selectHomescreenSize('not-a-real-id')(state)).toBe(DEFAULT_TILE_SIZE)
	})
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mise run test -- settings.test`
Expected: FAIL — `setHomescreenTileSize`, `resetHomescreenSizes`, `selectHomescreenSize`, and `State` exports do not exist.

- [ ] **Step 3: Extend the slice**

Replace the contents of `source/redux/parts/settings.ts` with:

```ts
import {createSlice} from '@reduxjs/toolkit'
import type {PayloadAction} from '@reduxjs/toolkit'
import type {RootState} from '../store'
import {DEFAULT_TILE_SIZE, type TileSize} from '../../views/home/types'

export type State = {
	unofficialityAcknowledged: boolean
	devModeOverride: boolean
	homescreenSizes: Record<string, TileSize>
}

// why `as`? see https://redux-toolkit.js.org/tutorials/typescript#:~:text=In%20some%20cases%2C%20TypeScript
const initialState = {
	unofficialityAcknowledged: false,
	devModeOverride: false,
	homescreenSizes: {},
} as State

const slice = createSlice({
	name: 'settings',
	initialState,
	reducers: {
		acknowledgeAcknowledgement(state, {payload}: PayloadAction<boolean>) {
			state.unofficialityAcknowledged = payload
		},
		setDevModeOverride(state, {payload}: PayloadAction<boolean>) {
			state.devModeOverride = payload
		},
		setHomescreenTileSize(
			state,
			{payload}: PayloadAction<{id: string; size: TileSize}>,
		) {
			state.homescreenSizes[payload.id] = payload.size
		},
		resetHomescreenSizes(state) {
			state.homescreenSizes = {}
		},
	},
})

export const {
	acknowledgeAcknowledgement,
	setDevModeOverride,
	setHomescreenTileSize,
	resetHomescreenSizes,
} = slice.actions
export const reducer = slice.reducer

export const selectAcknowledgement = (
	state: RootState,
): State['unofficialityAcknowledged'] =>
	state.settings.unofficialityAcknowledged

export const selectDevModeOverride = (
	state: RootState,
): State['devModeOverride'] => state.settings.devModeOverride

export const selectHomescreenSize =
	(id: string) =>
	(state: RootState): TileSize =>
		state.settings.homescreenSizes[id] ?? DEFAULT_TILE_SIZE
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `mise run test -- settings.test`
Expected: PASS — all 6 tests green.

- [ ] **Step 5: Type-check the rest of the project**

Run: `mise run tsc`
Expected: PASS. (Existing callers of `acknowledgeAcknowledgement` and `setDevModeOverride` are unchanged.)

- [ ] **Step 6: Run pre-commit checks**

Run: `mise run agent:pre-commit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add source/redux/parts/settings.ts source/redux/__tests__/settings.test.ts
git commit -m "feat(settings): add homescreenSizes state with reducers and selector"
```

---

## Task 5: Extend `@frogpond/context-menu` to accept `{key, title}` action shape

**Files:**
- Modify: `modules/context-menu/index.tsx`

`HomeScreenTile` (Task 7) needs the menu to display "Small" / "Medium" / "Large" / "Wide" while the action keys remain stable storage values (`'1x1'`, `'1x2'`, `'2x2'`, `'2x4'`). The current component derives the visible label from `upperFirst(action)`. Extend it to accept either a `string[]` (current behavior) or `Array<{key, title}>` (new shape).

- [ ] **Step 1: Update the component**

Replace `modules/context-menu/index.tsx` with:

```tsx
import React from 'react'
import {StyleProp, ViewStyle} from 'react-native'
import {Touchable} from '@frogpond/touchable'
import {
	ContextMenuButton,
	MenuState,
	OnPressMenuItemEvent,
} from 'react-native-ios-context-menu'
import {upperFirst} from 'lodash'

export type ContextMenuAction = string | {key: string; title: string}

interface ContextMenuProps {
	actions: ContextMenuAction[]
	buttonStyle?: StyleProp<ViewStyle>
	children?: React.ReactElement
	disabled?: boolean
	isMenuPrimaryAction?: boolean
	onPress?: () => void
	onPressMenuItem: (menuKey: string) => void | Promise<void>
	selectedAction?: string
	testID?: string
	title: string
}

const normalize = (action: ContextMenuAction): {key: string; title: string} =>
	typeof action === 'string'
		? {key: action, title: upperFirst(action)}
		: action

export const ContextMenu = React.forwardRef<
	ContextMenuButton,
	ContextMenuProps
>((props, ref): React.ReactElement => {
	const {
		actions,
		buttonStyle,
		children,
		disabled,
		isMenuPrimaryAction,
		onPress,
		onPressMenuItem,
		selectedAction,
		testID,
		title,
	} = props

	let menuItems = React.useMemo(() => {
		return actions.map((action) => {
			const {key, title: actionTitle} = normalize(action)
			const menuState: MenuState = selectedAction === key ? 'on' : 'off'
			return {
				actionKey: key,
				actionTitle,
				menuState,
			}
		})
	}, [actions, selectedAction])

	return (
		<ContextMenuButton
			ref={ref}
			isContextMenuEnabled={!disabled}
			isMenuPrimaryAction={isMenuPrimaryAction ?? false}
			menuConfig={{
				menuTitle: title ?? '',
				menuItems,
			}}
			onPressMenuItem={({nativeEvent}: Parameters<OnPressMenuItemEvent>[0]) => {
				onPressMenuItem(nativeEvent.actionKey)
			}}
			style={buttonStyle}
			testID={testID}
		>
			{onPress ? (
				<Touchable highlight={false} onPress={onPress}>
					{children}
				</Touchable>
			) : (
				children
			)}
		</ContextMenuButton>
	)
})
```

- [ ] **Step 2: Type-check the project**

Run: `mise run tsc`
Expected: PASS. Existing callers (`source/views/home/notice.tsx`, `source/views/transportation/bus/components/day-picker.tsx`, `source/views/settings/screens/overview/component-library/context-menu.tsx`) all pass `string[]` and continue to work.

- [ ] **Step 3: Run all tests**

Run: `mise run test`
Expected: PASS — no existing tests should break.

- [ ] **Step 4: Run pre-commit checks**

Run: `mise run agent:pre-commit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add modules/context-menu/index.tsx
git commit -m "feat(context-menu): accept structured {key, title} actions"
```

---

## Task 6: Add size-aware variants to `HomeScreenButton`

**Files:**
- Modify: `source/views/home/button.tsx`
- Test: `source/views/home/__tests__/button.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `source/views/home/__tests__/button.test.tsx`:

```tsx
import React from 'react'
import {describe, it, expect} from '@jest/globals'
import {render, screen} from '@testing-library/react-native'

import {HomeScreenButton} from '../button'
import type {ViewType} from '../../views'

const baseView: ViewType = {
	id: 'menus',
	type: 'view',
	view: 'Menus',
	title: 'Menus',
	icon: 'bowl',
	foreground: 'light',
	tint: '#3478F6',
}

describe('HomeScreenButton', () => {
	it('renders the title text at size 1x2 (default)', () => {
		render(<HomeScreenButton view={baseView} size="1x2" onPress={() => {}} />)
		expect(screen.getByText('Menus')).toBeTruthy()
	})

	it('renders the title text at size 2x2', () => {
		render(<HomeScreenButton view={baseView} size="2x2" onPress={() => {}} />)
		expect(screen.getByText('Menus')).toBeTruthy()
	})

	it('renders the title text at size 2x4', () => {
		render(<HomeScreenButton view={baseView} size="2x4" onPress={() => {}} />)
		expect(screen.getByText('Menus')).toBeTruthy()
	})

	it('hides the title text at size 1x1 (icon-only)', () => {
		render(<HomeScreenButton view={baseView} size="1x1" onPress={() => {}} />)
		expect(screen.queryByText('Menus')).toBeNull()
	})

	it('always exposes the title via accessibilityLabel, including at 1x1', () => {
		render(<HomeScreenButton view={baseView} size="1x1" onPress={() => {}} />)
		expect(screen.getByLabelText('Menus')).toBeTruthy()
	})
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mise run test -- button.test`
Expected: FAIL — `HomeScreenButton` does not yet accept a `size` prop, so `'Menus'` will appear at every size (the 1×1 hidden-title test fails).

- [ ] **Step 3: Update the button to be size-aware**

Replace `source/views/home/button.tsx` with:

```tsx
import * as React from 'react'
import {Platform, StyleSheet, Text, View} from 'react-native'
import {Entypo as Icon} from '@react-native-vector-icons/entypo'
import type {ViewType} from '../views'
import {Touchable} from '@frogpond/touchable'
import {transparent} from '@frogpond/colors'
import {homescreenForegroundDark, homescreenForegroundLight} from './colors'
import type {TileSize} from './types'

type Props = {
	view: ViewType
	size: TileSize
	onPress: () => void
}

type Variant = {
	containerStyle: object
	iconSize: number
	showTitle: boolean
	titleStyle?: object
	titleNumberOfLines?: number
}

function variantFor(size: TileSize): Variant {
	switch (size) {
		case '1x1':
			return {
				containerStyle: styles.contentColumn,
				iconSize: 24,
				showTitle: false,
			}
		case '1x2':
			return {
				containerStyle: styles.contentColumn,
				iconSize: 32,
				showTitle: true,
				titleStyle: styles.title1x2,
				titleNumberOfLines: 1,
			}
		case '2x2':
			return {
				containerStyle: styles.contentColumn,
				iconSize: 44,
				showTitle: true,
				titleStyle: styles.title2x2,
				titleNumberOfLines: 2,
			}
		case '2x4':
			return {
				containerStyle: styles.contentRow,
				iconSize: 40,
				showTitle: true,
				titleStyle: styles.title2x4,
				titleNumberOfLines: 1,
			}
	}
}

export function HomeScreenButton({
	view,
	size,
	onPress,
}: Props): React.ReactNode {
	const foreground =
		view.foreground === 'light' ? styles.lightForeground : styles.darkForeground
	const variant = variantFor(size)

	return (
		<Touchable
			accessibilityLabel={view.title}
			accessibilityRole="button"
			accessible={true}
			highlight={false}
			onPress={onPress}
			style={[styles.button, {backgroundColor: view.tint}]}
		>
			<View style={variant.containerStyle}>
				<Icon
					name={view.icon}
					size={variant.iconSize}
					style={[foreground, styles.icon]}
				/>
				{variant.showTitle ? (
					<Text
						style={[foreground, styles.title, variant.titleStyle]}
						numberOfLines={variant.titleNumberOfLines}
					>
						{view.title}
					</Text>
				) : null}
			</View>
		</Touchable>
	)
}

export const CELL_MARGIN = 10
const cellVerticalPadding = 8
const cellHorizontalPadding = 4

const styles = StyleSheet.create({
	button: {
		elevation: 2,
		borderRadius: 17,
		flex: 1,
		marginBottom: CELL_MARGIN,
		marginLeft: CELL_MARGIN / 2,
		marginRight: CELL_MARGIN / 2,
	},
	contentColumn: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingTop: cellVerticalPadding,
		paddingBottom: cellVerticalPadding / 2,
		paddingHorizontal: cellHorizontalPadding,
	},
	contentRow: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		gap: 12,
	},
	icon: {
		backgroundColor: transparent,
	},
	title: {
		backgroundColor: transparent,
		fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed',
	},
	title1x2: {
		fontSize: 14,
	},
	title2x2: {
		fontSize: 15,
	},
	title2x4: {
		fontSize: 17,
		fontWeight: '600',
	},
	lightForeground: {
		color: homescreenForegroundLight,
	},
	darkForeground: {
		color: homescreenForegroundDark,
	},
})
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `mise run test -- button.test`
Expected: PASS — all 5 tests green.

- [ ] **Step 5: Type-check**

Run: `mise run tsc`
Expected: FAIL — `source/views/home/index.tsx` (current `HomePage`) calls `<HomeScreenButton view={view} onPress={...} />` without a `size` prop. Leave the failure for now; Task 9 wires `HomePage` to the new grid which supplies the `size` prop. Do not patch the failure here — it intentionally surfaces the missing wiring.

If pre-commit blocks this commit because of the tsc failure, temporarily add a default of `size = '1x2'` to keep the existing call site valid. Replace the `Props` type and the destructuring header with:

```ts
type Props = {
	view: ViewType
	size?: TileSize
	onPress: () => void
}

export function HomeScreenButton({
	view,
	size = '1x2',
	onPress,
}: Props): React.ReactNode {
```

This default is removed in Task 9 once the call site is updated.

- [ ] **Step 6: Run pre-commit checks**

Run: `mise run agent:pre-commit`
Expected: PASS (with the temporary default in place).

- [ ] **Step 7: Commit**

```bash
git add source/views/home/button.tsx source/views/home/__tests__/button.test.tsx
git commit -m "feat(home): make HomeScreenButton size-aware with 4 variants"
```

---

## Task 7: Build the `HomeScreenTile` orchestrator

**Files:**
- Create: `source/views/home/tile.tsx`
- Test: `source/views/home/__tests__/tile.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `source/views/home/__tests__/tile.test.tsx`:

```tsx
import React from 'react'
import {describe, it, expect, jest, beforeEach} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {Provider} from 'react-redux'
import {configureStore} from '@reduxjs/toolkit'

import {ContextMenu} from '@frogpond/context-menu'
import {HomeScreenTile} from '../tile'
import {reducer as settings, type State} from '../../../redux/parts/settings'
import type {ViewType} from '../../views'

const mockNavigate = jest.fn()
const mockOpenUrl = jest.fn()

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({navigate: mockNavigate}),
}))

jest.mock('@frogpond/open-url', () => ({
	openUrl: (url: string) => mockOpenUrl(url),
}))

// Stub out the native iOS context menu — render its children inline so the
// underlying button is still queryable, and capture the props for assertion.
jest.mock('@frogpond/context-menu', () => ({
	ContextMenu: jest.fn(({children}) => children),
}))

const navView: ViewType = {
	id: 'menus',
	type: 'view',
	view: 'Menus',
	title: 'Menus',
	icon: 'bowl',
	foreground: 'light',
	tint: '#3478F6',
}

const urlView: ViewType = {
	id: 'oleville',
	type: 'url',
	url: 'https://oleville.com/',
	title: 'Oleville',
	icon: 'browser',
	foreground: 'dark',
	tint: '#FFCC00',
}

const buildStore = (initial?: Partial<State>) =>
	configureStore({
		reducer: {settings},
		preloadedState: {
			settings: {
				unofficialityAcknowledged: false,
				devModeOverride: false,
				homescreenSizes: {},
				...initial,
			},
		},
	})

const lastContextMenuProps = () => {
	const calls = (ContextMenu as unknown as jest.Mock).mock.calls
	return calls[calls.length - 1][0] as {
		actions: Array<{key: string; title: string}>
		selectedAction?: string
		onPressMenuItem: (key: string) => void
	}
}

describe('HomeScreenTile', () => {
	beforeEach(() => {
		mockNavigate.mockReset()
		mockOpenUrl.mockReset()
		;(ContextMenu as unknown as jest.Mock).mockClear()
	})

	it('navigates on press for a view-type entry', () => {
		const store = buildStore()
		render(
			<Provider store={store}>
				<HomeScreenTile view={navView} />
			</Provider>,
		)
		fireEvent.press(screen.getByLabelText('Menus'))
		expect(mockNavigate).toHaveBeenCalledWith('Menus')
	})

	it('opens the URL on press for a url-type entry', () => {
		const store = buildStore()
		render(
			<Provider store={store}>
				<HomeScreenTile view={urlView} />
			</Provider>,
		)
		fireEvent.press(screen.getByLabelText('Oleville'))
		expect(mockOpenUrl).toHaveBeenCalledWith('https://oleville.com/')
	})

	it('passes the persisted tile size through as selectedAction and renders that variant', () => {
		const store = buildStore({homescreenSizes: {menus: '1x1'}})
		render(
			<Provider store={store}>
				<HomeScreenTile view={navView} />
			</Provider>,
		)
		expect(lastContextMenuProps().selectedAction).toBe('1x1')
		// At 1x1 the title is hidden visually but accessibilityLabel remains.
		expect(screen.queryByText('Menus')).toBeNull()
		expect(screen.getByLabelText('Menus')).toBeTruthy()
	})

	it('exposes the four size actions with human labels', () => {
		const store = buildStore()
		render(
			<Provider store={store}>
				<HomeScreenTile view={navView} />
			</Provider>,
		)
		expect(lastContextMenuProps().actions).toEqual([
			{key: '1x1', title: 'Small'},
			{key: '1x2', title: 'Medium'},
			{key: '2x2', title: 'Large'},
			{key: '2x4', title: 'Wide'},
		])
	})

	it('dispatches setHomescreenTileSize when the menu callback fires', () => {
		const store = buildStore()
		render(
			<Provider store={store}>
				<HomeScreenTile view={navView} />
			</Provider>,
		)
		lastContextMenuProps().onPressMenuItem('2x2')
		expect(store.getState().settings.homescreenSizes).toEqual({menus: '2x2'})
	})
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mise run test -- tile.test`
Expected: FAIL — Cannot find module `../tile`.

- [ ] **Step 3: Implement the orchestrator**

Create `source/views/home/tile.tsx`:

```tsx
import React from 'react'
import {useNavigation} from '@react-navigation/native'
import {useDispatch, useSelector} from 'react-redux'
import {ContextMenu} from '@frogpond/context-menu'
import {openUrl} from '@frogpond/open-url'

import type {ViewType} from '../views'
import {HomeScreenButton} from './button'
import {TILE_SIZES, type TileSize} from './types'
import {
	selectHomescreenSize,
	setHomescreenTileSize,
} from '../../redux/parts/settings'

const SIZE_ACTIONS: Array<{key: TileSize; title: string}> = [
	{key: '1x1', title: 'Small'},
	{key: '1x2', title: 'Medium'},
	{key: '2x2', title: 'Large'},
	{key: '2x4', title: 'Wide'},
]

type Props = {
	view: ViewType
}

export function HomeScreenTile({view}: Props): React.ReactElement {
	const navigation = useNavigation()
	const dispatch = useDispatch()
	const size = useSelector(selectHomescreenSize(view.id))

	const onPress = React.useCallback(() => {
		if (view.type === 'url' || view.type === 'browser-url') {
			openUrl(view.url)
		} else if (view.type === 'view') {
			navigation.navigate(view.view)
		} else {
			throw new Error(`unexpected view type ${(view as ViewType).type}`)
		}
	}, [navigation, view])

	const onPressMenuItem = React.useCallback(
		(key: string) => {
			if ((TILE_SIZES as readonly string[]).includes(key)) {
				dispatch(
					setHomescreenTileSize({id: view.id, size: key as TileSize}),
				)
			}
		},
		[dispatch, view.id],
	)

	return (
		<ContextMenu
			actions={SIZE_ACTIONS}
			selectedAction={size}
			onPress={onPress}
			onPressMenuItem={onPressMenuItem}
			title="Tile size"
			testID={`home-tile-${view.id}`}
		>
			<HomeScreenButton view={view} size={size} onPress={onPress} />
		</ContextMenu>
	)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `mise run test -- tile.test`
Expected: PASS — all 5 tests green.

- [ ] **Step 5: Type-check**

Run: `mise run tsc`
Expected: PASS for the new file. The temporary `size?` default in `button.tsx` from Task 6 is still in place.

- [ ] **Step 6: Run pre-commit checks**

Run: `mise run agent:pre-commit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add source/views/home/tile.tsx source/views/home/__tests__/tile.test.tsx
git commit -m "feat(home): add HomeScreenTile orchestrator with iOS context menu"
```

---

## Task 8: Build the `HomeScreenGrid` layout component

**Files:**
- Create: `source/views/home/grid.tsx`

This component takes the ordered `views`, runs `packTiles`, and absolute-positions each tile inside a wrapping `View` whose height is computed from the maximum row + tile height. Width comes from `useWindowDimensions()` so rotation and split-view recalculate.

- [ ] **Step 1: Create the grid file**

Create `source/views/home/grid.tsx`:

```tsx
import React from 'react'
import {StyleSheet, View, useWindowDimensions} from 'react-native'

import type {ViewType} from '../views'
import {CELL_MARGIN} from './button'
import {packTiles, type PackedTile} from './pack-tiles'
import {
	GRID_COLUMNS,
	TILE_DIMENSIONS,
	DEFAULT_TILE_SIZE,
	type TileSize,
} from './types'

const UNIT_HEIGHT = 80

type Props = {
	views: ViewType[]
	sizeOf: (view: ViewType) => TileSize
	renderTile: (packed: PackedTile) => React.ReactElement
}

export function HomeScreenGrid({
	views,
	sizeOf,
	renderTile,
}: Props): React.ReactElement {
	const {width: screenWidth} = useWindowDimensions()

	const horizontalPadding = CELL_MARGIN / 2
	const usableWidth = screenWidth - horizontalPadding * 2
	const unitWidth = usableWidth / GRID_COLUMNS

	const packed = React.useMemo(() => packTiles(views, sizeOf), [views, sizeOf])

	const maxRowEnd = packed.reduce((acc, p) => {
		const {rows} = TILE_DIMENSIONS[p.size]
		return Math.max(acc, p.row + rows)
	}, 0)

	const containerHeight = maxRowEnd * UNIT_HEIGHT

	return (
		<View
			style={[
				styles.container,
				{
					height: containerHeight,
					marginHorizontal: horizontalPadding,
					marginTop: CELL_MARGIN,
				},
			]}
		>
			{packed.map((p) => {
				const {rows, cols} = TILE_DIMENSIONS[p.size]
				const left = p.col * unitWidth
				const top = p.row * UNIT_HEIGHT
				const width = cols * unitWidth
				const height = rows * UNIT_HEIGHT
				return (
					<View
						key={p.view.id}
						style={[styles.cell, {left, top, width, height}]}
					>
						{renderTile(p)}
					</View>
				)
			})}
		</View>
	)
}

// Re-export so consumers (HomePage) don't need to import from types directly.
export {DEFAULT_TILE_SIZE}
export type {TileSize, PackedTile}

const styles = StyleSheet.create({
	container: {
		position: 'relative',
	},
	cell: {
		position: 'absolute',
	},
})
```

- [ ] **Step 2: Type-check**

Run: `mise run tsc`
Expected: PASS for the new file.

- [ ] **Step 3: Run all tests**

Run: `mise run test`
Expected: PASS — no existing tests should break, no new tests are required (the grid is exercised via Task 7's tile tests + manual / XCUITest).

- [ ] **Step 4: Run pre-commit checks**

Run: `mise run agent:pre-commit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add source/views/home/grid.tsx
git commit -m "feat(home): add HomeScreenGrid for variable-size tile layout"
```

---

## Task 9: Wire `HomePage` to use the new grid

**Files:**
- Modify: `source/views/home/index.tsx`
- Modify: `source/views/home/button.tsx` (remove temporary default from Task 6 if added)

- [ ] **Step 1: Replace `HomePage` to use `HomeScreenGrid` + `HomeScreenTile`**

Replace `source/views/home/index.tsx` with:

```tsx
import * as React from 'react'
import {ScrollView, StyleSheet} from 'react-native'

import {AllViews, type ViewType} from '../views'
import {FaqBannerGroup} from '../faqs'
import {FAQ_TARGETS} from '../faqs/constants'
import {CELL_MARGIN} from './button'
import {HomeScreenGrid} from './grid'
import {HomeScreenTile} from './tile'
import {DEFAULT_TILE_SIZE} from './types'
import {OpenSettingsButton} from '@frogpond/navigation-buttons'
import {UnofficialAppNotice} from './notice'
import {useSelector} from 'react-redux'
import type {RootState} from '../../redux/store'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

const styles = StyleSheet.create({
	banner: {
		marginHorizontal: CELL_MARGIN,
		marginTop: CELL_MARGIN,
		marginBottom: CELL_MARGIN / 2,
	},
})

function HomePage(): React.ReactNode {
	const allViews = AllViews().filter((view) => !view.disabled)

	const sizes = useSelector(
		(state: RootState) => state.settings.homescreenSizes,
	)
	const sizeOf = React.useCallback(
		(view: ViewType) => sizes[view.id] ?? DEFAULT_TILE_SIZE,
		[sizes],
	)

	return (
		<ScrollView
			alwaysBounceHorizontal={false}
			contentInsetAdjustmentBehavior="automatic"
			showsHorizontalScrollIndicator={false}
			showsVerticalScrollIndicator={false}
			testID="screen-homescreen"
		>
			<FaqBannerGroup style={styles.banner} target={FAQ_TARGETS.HOME} />

			<HomeScreenGrid
				views={allViews}
				sizeOf={sizeOf}
				renderTile={(packed) => <HomeScreenTile view={packed.view} />}
			/>

			<UnofficialAppNotice />
		</ScrollView>
	)
}

export {HomePage as View}

export const NavigationKey = 'Home'

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'All About Olaf',
	headerBackTitle: 'Home',
	headerRight: (props) => <OpenSettingsButton {...props} />,
}

export type NavigationParams = undefined
```

- [ ] **Step 2: Remove the temporary `size` default in `button.tsx` if it was added in Task 6**

Open `source/views/home/button.tsx`. If the `Props` type still has `size?: TileSize` and the function signature has `size = '1x2'`, change them back to required:

```ts
type Props = {
	view: ViewType
	size: TileSize
	onPress: () => void
}

export function HomeScreenButton({
	view,
	size,
	onPress,
}: Props): React.ReactNode {
```

If Task 6 didn't need the temporary default (i.e., pre-commit passed without it), this step is a no-op.

- [ ] **Step 3: Type-check**

Run: `mise run tsc`
Expected: PASS — `HomePage` now passes `size` to every tile via `HomeScreenTile`, and the temporary default is gone.

- [ ] **Step 4: Run all tests**

Run: `mise run test`
Expected: PASS — packer, settings, button, tile, and views tests all green; nothing else regresses.

- [ ] **Step 5: Run pre-commit checks**

Run: `mise run agent:pre-commit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add source/views/home/index.tsx source/views/home/button.tsx
git commit -m "feat(home): wire HomePage to HomeScreenGrid with size-aware tiles"
```

---

## Task 10: Add "Reset home screen layout" to the notice context menu

**Files:**
- Modify: `source/views/home/notice.tsx`

- [ ] **Step 1: Update the notice component**

Edit `source/views/home/notice.tsx`. Add a new action constant, the new dispatch import, and extend the menu:

Replace the imports near the top with:

```tsx
import React from 'react'
import {View, Text, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import sample from 'lodash/sample'
import {CELL_MARGIN} from './button'
import {ContextMenu} from '@frogpond/context-menu'
import {useDispatch, useSelector} from 'react-redux'
import restart from 'react-native-restart-newarch'
import {
	resetHomescreenSizes,
	selectDevModeOverride,
	setDevModeOverride,
} from '../../redux/parts/settings'
import {useIsDevMode} from '../../lib/use-is-dev-mode'
```

Replace the action constants and `onPressMenuItem` with:

```tsx
const RESTART_ACTION = 'Restart app'
const DEV_MODE_ACTION = 'Enable dev mode'
const RESET_LAYOUT_ACTION = 'Reset home screen layout'
```

```tsx
const onPressMenuItem = (menuKey: string) => {
	if (menuKey === RESTART_ACTION) {
		restart.Restart()
	} else if (menuKey === DEV_MODE_ACTION) {
		dispatch(setDevModeOverride(!devModeOverride))
	} else if (menuKey === RESET_LAYOUT_ACTION) {
		dispatch(resetHomescreenSizes())
	}
}
```

And update the `actions` array on the `<ContextMenu>` element:

```tsx
actions={[RESTART_ACTION, DEV_MODE_ACTION, RESET_LAYOUT_ACTION]}
```

- [ ] **Step 2: Type-check**

Run: `mise run tsc`
Expected: PASS.

- [ ] **Step 3: Run all tests**

Run: `mise run test`
Expected: PASS — no existing tests cover `notice.tsx` directly, so behavior is unchanged.

- [ ] **Step 4: Run pre-commit checks**

Run: `mise run agent:pre-commit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add source/views/home/notice.tsx
git commit -m "feat(home): add Reset home screen layout action to notice menu"
```

---

## Task 11: Add XCUITests covering resize, persistence, gap, rotation, and reset

**Files:**
- Modify: `ios/AllAboutOlafUITests/ModuleHomeTests.swift`

These tests cover the manual verification scenarios from the spec. They run on a simulator/device — locally, run via Xcode's Test navigator or `fastlane scan`. CI will pick them up via the existing UI test pipeline.

- [ ] **Step 1: Add helpers and three new test methods**

Replace `ios/AllAboutOlafUITests/ModuleHomeTests.swift` with:

```swift
import XCTest

class ModuleHomeTests: XCTestCase {
	private var app: XCUIApplication!

	override func setUpWithError() throws {
		continueAfterFailure = false
		app = XCUIApplication()
		app.launch()
	}

	override func tearDownWithError() throws {
		XCUIDevice.shared.orientation = .portrait
	}

	// MARK: - Helpers

	/// Long-press the given home tile, then tap the menu item with the given title.
	private func resizeTile(_ identifier: String, to label: String) {
		let tile = app.element(matching: identifier)
		XCTAssertTrue(tile.waitForExistence(timeout: 30), "\(identifier) should exist")
		tile.press(forDuration: 1.0)

		let menuItem = app.buttons[label]
		XCTAssertTrue(
			menuItem.waitForExistence(timeout: 10),
			"Menu item '\(label)' should appear on long-press of \(identifier)")
		menuItem.tap()
	}

	/// Long-press the unofficial-app notice and tap "Reset home screen layout".
	private func resetLayoutFromNoticeMenu() {
		let notice = app.element(matching: "home-notice")
		XCTAssertTrue(notice.waitForExistence(timeout: 10), "Home notice should exist")
		notice.press(forDuration: 1.0)

		let resetItem = app.buttons["Reset home screen layout"]
		XCTAssertTrue(
			resetItem.waitForExistence(timeout: 10),
			"Notice menu should expose 'Reset home screen layout'")
		resetItem.tap()
	}

	// MARK: - Existing tests

	func testShowsTheHomeScreen() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(
			homescreen.waitForExistence(timeout: 30),
			"Home screen should be visible")

		let menus = app.buttons["Menus"]
		XCTAssertTrue(
			menus.waitForExistence(timeout: 30),
			"Home screen should show Menus button")
	}

	func testLongPressNoticeTogglesDevMode() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(
			homescreen.waitForExistence(timeout: 30),
			"Home screen should be visible")

		// Long-press the unofficial-app notice widget to open its UIMenu.
		// This exercises the react-native-ios-context-menu v3 native code
		// path against a Release build.
		let notice = app.element(matching: "home-notice")
		XCTAssertTrue(
			notice.waitForExistence(timeout: 30),
			"Home notice widget should be visible")
		notice.press(forDuration: 1.0)

		// The menu presents three items: "Restart app", "Enable dev mode",
		// and "Reset home screen layout". Tap the second to flip the persisted
		// dev-mode override on.
		let enableDevMode = app.buttons["Enable dev mode"]
		XCTAssertTrue(
			enableDevMode.waitForExistence(timeout: 10),
			"Context menu should show 'Enable dev mode' option")
		enableDevMode.tap()

		// Open Settings and confirm the DEVELOPER section is now rendered,
		// proving the override reached the gated section in a Release build.
		let settingsButton = app.buttons["button-open-settings"]
		XCTAssertTrue(
			settingsButton.waitForExistence(timeout: 10),
			"Settings button should appear on home screen")
		settingsButton.tap()

		let developerSection = app.staticTexts["DEVELOPER"]
		XCTAssertTrue(
			developerSection.waitForExistence(timeout: 30),
			"DEVELOPER section should be visible after enabling dev mode")
	}

	// MARK: - Resizable tiles

	func testLongPressTileChangesSize() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		let menusTileId = "home-tile-menus"

		var originalFrame: CGRect = .zero

		XCTContext.runActivity(named: "resize tile via context menu") { _ in
			let tile = app.element(matching: menusTileId)
			XCTAssertTrue(tile.waitForExistence(timeout: 10))
			originalFrame = tile.frame

			resizeTile(menusTileId, to: "Large")

			let resized = app.element(matching: menusTileId)
			XCTAssertTrue(resized.waitForExistence(timeout: 10))
			XCTAssertGreaterThan(
				resized.frame.height,
				originalFrame.height * 1.5,
				"Resizing to Large should at least 1.5× the tile's height")
		}

		XCTContext.runActivity(named: "size persists across launches") { _ in
			app.terminate()
			app.launch()

			let tile = app.element(matching: menusTileId)
			XCTAssertTrue(tile.waitForExistence(timeout: 30))
			tile.press(forDuration: 1.0)

			let largeItem = app.buttons["Large"]
			XCTAssertTrue(largeItem.waitForExistence(timeout: 10))
			XCTAssertTrue(
				largeItem.isSelected,
				"After relaunch, 'Large' should still be the selected size")

			// Dismiss the menu by tapping somewhere neutral.
			app.element(matching: "screen-homescreen").tap()
		}

		XCTContext.runActivity(named: "small tile preserves accessibility label") { _ in
			resizeTile(menusTileId, to: "Small")
			XCTAssertTrue(
				app.buttons["Menus"].exists,
				"Even at Small (1x1) the 'Menus' accessibility label should remain announceable")
		}

		XCTContext.runActivity(named: "reset from notice menu restores defaults") { _ in
			resetLayoutFromNoticeMenu()

			let tile = app.element(matching: menusTileId)
			XCTAssertTrue(tile.waitForExistence(timeout: 10))
			XCTAssertEqual(
				tile.frame.height,
				originalFrame.height,
				accuracy: 1.0,
				"After reset, the tile should return to its default height")
			XCTAssertEqual(
				tile.frame.width,
				originalFrame.width,
				accuracy: 1.0,
				"After reset, the tile should return to its default width")
		}
	}

	func testGapBehaviorWithOrphanSmallTile() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		// Menus → Small (1x1) at col 0; SIS → Wide (2x4) needs 4 cols and so
		// drops to row 1 because only 3 cols remain on row 0.
		resizeTile("home-tile-menus", to: "Small")
		resizeTile("home-tile-sis", to: "Wide")

		let menus = app.element(matching: "home-tile-menus")
		let sis = app.element(matching: "home-tile-sis")
		XCTAssertTrue(menus.waitForExistence(timeout: 10))
		XCTAssertTrue(sis.waitForExistence(timeout: 10))

		XCTAssertGreaterThan(
			sis.frame.minY,
			menus.frame.maxY,
			"SIS (Wide) should drop below Menus (Small) since 1+4 > 4 cols")

		resetLayoutFromNoticeMenu()
	}

	func testRotationReflowsLayout() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		let tile = app.element(matching: "home-tile-menus")
		XCTAssertTrue(tile.waitForExistence(timeout: 10))
		let portraitWidth = tile.frame.width

		XCUIDevice.shared.orientation = .landscapeLeft

		// Wait for the layout animation to settle.
		let landscapeWidthChanged = NSPredicate(format: "frame.size.width != %f", portraitWidth)
		let expectation = XCTNSPredicateExpectation(predicate: landscapeWidthChanged, object: tile)
		XCTAssertEqual(
			XCTWaiter.wait(for: [expectation], timeout: 10.0),
			.completed,
			"Tile width should change after rotation to landscape")

		XCTAssertNotEqual(
			tile.frame.width,
			portraitWidth,
			"Layout should recompute for the new screen width")
	}
}
```

- [ ] **Step 2: Verify the Swift file compiles by building the UI test target locally**

Run (from repo root): `xcodebuild -workspace ios/AllAboutOlaf.xcworkspace -scheme AllAboutOlaf -destination 'platform=iOS Simulator,name=iPhone 15' build-for-testing 2>&1 | tail -30`
Expected: `** TEST BUILD SUCCEEDED **`. If the local environment lacks Xcode, push the branch and rely on CI to run the UI test build — but flag the limitation in the PR.

- [ ] **Step 3: Run the UI tests on a simulator (requires Xcode)**

Run: `xcodebuild -workspace ios/AllAboutOlaf.xcworkspace -scheme AllAboutOlaf -destination 'platform=iOS Simulator,name=iPhone 15' -only-testing:AllAboutOlafUITests/ModuleHomeTests test 2>&1 | tail -40`
Expected: All five tests in `ModuleHomeTests` pass. If running locally is not possible, push and let CI run them.

- [ ] **Step 4: Run pre-commit checks**

Run: `mise run agent:pre-commit`
Expected: PASS — Swift files are not part of the JS/TS pre-commit suite, but the command shouldn't fail because of them.

- [ ] **Step 5: Commit**

```bash
git add ios/AllAboutOlafUITests/ModuleHomeTests.swift
git commit -m "test(home): add XCUITests for tile resize, persist, gap, rotation, reset"
```

- [ ] **Step 6: Push the branch**

```bash
git push -u origin claude/resizable-home-buttons-tAQN6
```

---

## Done

After Task 11, the feature is implemented end-to-end with full unit, component, and UI test coverage. The branch is ready for review.

**What's not in this plan (deferred per spec):**

1. Drag-to-reorder edit mode — separate spec.
2. Live content previews (Strategy C) in 2×2 / 2×4 — separate spec; the 2×4 already reserves a subtitle slot in the JSX.
3. Settings-screen UI for sizes — long-press is the only affordance in v1.
