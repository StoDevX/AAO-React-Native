# Add Screen Skill

This skill provides a comprehensive guide for adding new screens to the All About Olaf React Native application. It covers all necessary steps including component creation, routing, TypeScript types, and integration with the app's existing architecture.

## When to Use This Skill

Use this skill when you need to add a new screen/view to the AAO React Native app. This includes:
- Creating new top-level screens accessible from the home screen
- Adding detail screens or sub-screens
- Setting up proper routing with expo-router
- Ensuring TypeScript type safety
- Following the project's established patterns and conventions

## Prerequisites

Before using this skill, ensure you have:
- A clear understanding of what the screen should do
- Any required data types or API integrations
- Whether the screen should be accessible from the home screen or as a sub-screen

## Process

### Step 1: Plan the Screen Structure

**Determine the screen requirements:**
- Screen name and purpose
- Route parameters (if any) — a dynamic segment like `[name]` or `[jobId]`
- Whether it needs to be in the home screen menu
- Icon and gradient for the home screen tile (if applicable)
- Any sub-screens or related components

**Determine where its route file goes.** There is one stack, declared in
`app/_layout.tsx`, and no route groups:
- `app/` for a screen of its own, e.g. one opened from a Home tile
- under another screen's folder when only that screen opens it
  (`app/student-work/job/description.tsx` is opened only from the job)
- `app/settings/` for a Settings screen, which pushes inside the Settings modal

### Step 2: Create the Route File

The app uses expo-router 57's file-based routing. **The route file IS the
screen** — there is no separate view directory and no wrapper component to
register elsewhere.

**A screen with no parameters** is a single kebab-case file:

```
app/screen-name.tsx
```

**A screen with sub-screens or a dynamic parameter** is a directory:

```
app/screen-name/index.tsx     # list / entry screen
app/screen-name/[param].tsx   # detail screen, one dynamic segment
```

**Router chrome goes in an outer component; screen logic goes in an inner
one.** If the screen has no early returns (loading/error/not-found), one
component is enough — the chrome and the body both go in the default export:

```tsx
import * as React from 'react'
import {Stack} from 'expo-router'

export default function ScreenNamePage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Screen Title</Stack.Title>
			{/* screen content */}
		</>
	)
}
```

If the screen has early returns (a loading state, an error state, a
not-found state), split it into two components so the chrome renders once,
outside the branching, and no branch can omit it:

```tsx
function ScreenNameView(): React.ReactNode {
	// data logic and early returns, each returning BARE content
	if (isLoading) return <LoadingView />
	return <TheContent />
}

export default function ScreenNamePage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Screen Title</Stack.Title>
			<ScreenNameView />
		</>
	)
}
```

A third component — `ScreenNamePage` (chrome), `ScreenNameLoader` (the
route's query and its early returns), `ScreenNameView` (the screen itself) —
is required, not stylistic, when flattening the loader into the screen would
change behaviour: a `useState` initialiser seeded from loaded data (React
only evaluates it on first mount), or the screen's own ungated `useQuery`
calls that must not fire until the loader's data resolves. See
`app/hours/detail/report.tsx` for the reference three-component
shape, and `app/settings/credits.tsx` for the simple chrome-plus-body shape.

**Nothing may be added to `app/` that is not a route.** Every `.ts`/`.tsx`
file under `app/` becomes a route in expo-router 57 — no test files, no
helpers, no types there, even ones that feel private to one screen.

### Step 3: Add Support Code to `source/features/`

Anything the route does not render directly — queries, types, row
components, reducers, shared constants, helpers — goes in
`source/features/<feature>/`, imported by relative path from the route file.
There is no barrel/index file requirement; route files import straight from
the file that defines what they need.

**Example:**

```tsx
import {contactByTitleOptions} from '../../../source/features/directory/contacts-query'
```

### Step 4: Wire Up Route Parameters (if applicable)

A dynamic segment file, e.g. `app/directory/named/[title].tsx`, receives its
parameter via `useLocalSearchParams`:

```tsx
import {useLocalSearchParams} from 'expo-router'

let {title} = useLocalSearchParams<{title: string}>()
```

Navigate to it with `useRouter`:

```tsx
import {useRouter} from 'expo-router'

let router = useRouter()
router.navigate({pathname: '/directory/named/[title]', params: {title: contactTitle}})
```

Any `.navigate(literal)` call site needs
`useNavigation<NavigationProp<LegacyRootParamList>>()` for its typed generic;
`router.navigate()` call sites don't need one.

### Step 5: Add to Home Screen Menu (if applicable)

**Update `source/features/views.ts`:**
- Add an entry to the `AllViews()` array whose `view` is the route's path
  (e.g. `'/screen-name'`), matching the file/folder name under `app/`.

**Example view addition:**

```tsx
{
	type: 'view',
	view: '/screen-name',
	title: 'Screen Name',
	icon: 'star', // an SF Symbol name
	gradient: c.blueGradient,
},
```

### Step 6: Test and Validate

**Run the app and test navigation:**
- Ensure the screen appears in the home menu (if added)
- Test navigation to and from the screen
- Verify proper back navigation
- Check for TypeScript errors

**Validate integration:**
- Screen follows established patterns
- No linting errors
- Proper error handling
- Accessibility considerations

## Common Patterns and Best Practices

### Screen Naming Conventions
- Route files and folders are kebab-case (`credits.tsx`,
  `course-search/results/index.tsx`), and so are their URLs (`/settings/credits`).
  A dynamic segment is bracketed (`detail/[name].tsx`).
- Support files under `source/features/` are kebab-case
- Component names inside a route file follow the `ScreenNamePage` /
  `ScreenNameView` / `ScreenNameLoader` convention from Step 2

### Router Chrome
- Always set a meaningful `<Stack.Title>`
- Use `<Stack.Toolbar>` / `<Stack.Toolbar.Button>` for header actions (a
  button, a menu) — see `app/hours/detail/[name].tsx`
- Where the chrome's title depends on loaded data, compute it once (e.g.
  `let screen = <Stack.Screen options={{title: …}} />`) and splice it into
  every branch, so no branch can omit it

### Type Safety
- Define specific parameter types for dynamic routes
- No `any`

### Component Organization
- Keep components focused and single-responsibility
- Use hooks for state management
- Follow existing styling patterns

### Error Handling
- Implement proper error boundaries
- Handle loading states appropriately
- Provide user-friendly error messages

## Troubleshooting

### Common Issues

**Screen not appearing in the home menu:**
- Check that the `view` path in `source/features/views.ts` matches the route
  file's path exactly
- Verify the route file is at the path the `view` names

**A stray file broke the build:**
- Any `.ts`/`.tsx` file added under `app/` becomes a route. A test file, a
  helper, or a types-only file placed there registers as a broken route —
  move it to `source/features/<feature>/` instead.

**TypeScript errors:**
- Check parameter type definitions
- Verify import paths into `source/features/`
- Ensure component exports match expected interface

### Getting Help

If you encounter issues:
1. Check existing screens for reference patterns
2. Review a screen of similar shape (simple, chrome+view, or chrome+loader+view)
3. Test incrementally - add one piece at a time
4. Run the app frequently to catch issues early

## Examples

See existing routes for reference implementations:
- `app/settings/credits.tsx` — simple chrome-plus-body screen, no data loading
- `app/directory/named/[title].tsx` — chrome spliced into each branch of a query
- `app/hours/detail/report.tsx` — the full three-component shape (chrome, loader, view)
- `source/features/home/` — the home screen's support components
- `source/features/menus/` — a feature with several routes sharing support code
- `source/features/settings/` — a feature with many sub-screens

Each example demonstrates a different chrome/data pattern.

---

# Add Screen Checklist

Use this checklist to ensure you've completed all necessary steps when adding a new screen.

## Route Creation
- [ ] Created a kebab-case route file under `app/`, nested under its only opener or under `app/settings/` where that fits
- [ ] The route file's default export is the only exported component
- [ ] Chrome (`Stack.Title` / `Stack.Screen` / `Stack.Toolbar`) is in an outer component if the screen has early returns
- [ ] A third (`…Loader`) component is used if a `useState` initialiser is seeded from loaded data, or the screen has ungated queries
- [ ] Component follows React Native and project patterns
- [ ] Added proper TypeScript types
- [ ] No test files, helpers, or non-route files added under `app/`

## Support Code
- [ ] Non-route code (queries, types, row components, helpers) lives in `source/features/<feature>/`
- [ ] Route file imports support code by relative path

## Home Screen Integration (if applicable)
- [ ] Added an entry to `AllViews()` in `source/features/views.ts`
- [ ] The entry's `view` path matches the route file's path
- [ ] Chose appropriate SF Symbol for `icon`
- [ ] Selected appropriate `gradient` from `@frogpond/colors`

## Testing & Validation
- [ ] App builds without TypeScript errors
- [ ] Screen appears in home menu (if added)
- [ ] Navigation to screen works correctly
- [ ] Back navigation works properly
- [ ] Screen displays correctly on iOS
- [ ] No linting errors
- [ ] Follows accessibility guidelines

## Code Quality
- [ ] Component is focused and single-responsibility
- [ ] Uses proper hooks and state management
- [ ] Follows existing styling patterns
- [ ] Includes proper error handling
- [ ] Has appropriate loading states
- [ ] Includes meaningful comments for complex logic

## Common Issues to Check

### Routing Issues
- The route's `view` path in `source/features/views.ts` matches the file path under `app/`
- Dynamic segments (`[param].tsx`) match the params used in `useLocalSearchParams` and `router.navigate`
- Screen is nested under the screen that opens it, or under `app/settings/` for Settings

### TypeScript Issues
- All imports are correct and exist
- Route parameter types match usage
- Component props are properly typed

### Display Issues
- Screen title is user-friendly
- Toolbar actions are appropriate
- Colors and icons follow the design system
- Layout works on different screen sizes

### Integration Issues
- Screen follows established patterns
- No conflicts with existing screens
- Proper cleanup on unmount (if needed)
- Memory leaks avoided

---

# Screen Component Template

Use this template as a starting point for new route files. Replace placeholders with your specific implementation.

```tsx
import * as React from 'react'
import {Stack} from 'expo-router'
import {StyleSheet, Text, View} from 'react-native'

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
	},
	content: {
		flex: 1,
	},
})

export default function ScreenNamePage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Screen Title</Stack.Title>

			<View style={styles.container}>
				<View style={styles.content}>
					{/* Your screen content here */}
					<Text>Screen content goes here</Text>
				</View>
			</View>
		</>
	)
}
```

## Template Usage

1. Replace `ScreenName` with your actual screen name (e.g., `Profile`)
2. Replace `Screen Title` with the display title
3. Add your screen-specific content in place of the placeholder `Text`
4. Modify styles as needed following the project's patterns
5. If the screen loads data and has early returns, split it per Step 2 into an
   outer `…Page` (chrome) and an inner `…View` (or `…Loader` + `…View`)

## With Route Parameters

If your screen needs a dynamic segment, name the file accordingly and read
the parameter with `useLocalSearchParams`:

```tsx
// app/screen-name/[itemId].tsx
import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {Text} from 'react-native'

export default function ScreenNameDetailPage(): React.ReactNode {
	let {itemId} = useLocalSearchParams<{itemId: string}>()

	return (
		<>
			<Stack.Title>Item {itemId}</Stack.Title>
			<Text>Item ID: {itemId}</Text>
		</>
	)
}
```
