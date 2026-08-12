# expo-router checkpoint 2, group PR 12: Communities (Reddit)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the "Communities" home-grid tile: a 2-tab screen
(r/stolaf, r/carletoncollege) plus one shared `RedditPostDetail` screen.
Twelfth group PR in checkpoint 2's stack, and the fifth tab-bar group —
same proven `NativeTabs` flat-structure pattern as Menus/Streaming
Media/News/Transportation. `devOnly: true` on this tile is untouched by
this plan (this group stays dev-only after migration, per the design
doc's own stated decision) — only `disabled: true` comes off.

**Three navigation entry points into `RedditPostDetail`, converging on
one simple query.** The original screen received all of a post's data
(13 fields) through navigation params, from THREE different call sites:
the two feed screens (`index.tsx`, tapping a post row) and
`useRedditLinkHandler.ts` (tapping a Reddit link embedded inside a post's
own body or a comment, which can point to a post in an arbitrary,
untracked subreddit — not necessarily r/stolaf or r/carletoncollege).
Passing a 13-field object through a URL isn't viable, but this group
doesn't need Contacts/Student-Orgs-style "select one item from a cached
list" either: `reddit-api.ts` already has `fetchRedditPost(postUrl,
signal)`, a genuine single-post-by-URL fetch that isn't scoped to any
particular subreddit's list query. **This plan builds one
`redditPostByUrlOptions(postUrl)` query around that function** — not a
`select` derived from `redditPostsOptions`, since a body-link tap's
target post was never in either feed's cache to begin with. All three
call sites converge on the same two-field push:
`router.push({pathname: '/RedditPostDetail', params: {postUrl,
communityName}})` — `communityName` is just a plain display string (`'St.
Olaf'`, `'Carleton'`, or `` `r/${subreddit}` `` for an arbitrary
body-link target), cheap to pass directly, no lookup needed. A feed-tap
now costs one extra network round-trip on the detail screen versus the
original object-passing approach (which avoided a refetch); this is a
deliberate, accepted simplification — the alternative (chaining two
different lookup strategies depending on which screen navigated) is
real, ongoing complexity for a one-time redundant fetch.

**`PostDetailView` keeps owning its own dynamic header.** Unlike every
other detail screen in this migration, the original component already
computed its header (`title: communityName`, plus a `headerRight` menu
depending on `postUrl` and in-component handlers) via
`navigation.setOptions()` inside a `useLayoutEffect`, not through a
static `NavigationOptions` export — the same "list screen sets its own
search-bar header dynamically" mechanism Student Orgs/Directory/More
already established for expo-router (`useNavigation()`'s `.setOptions()`
still works under expo-router's Stack). This plan preserves that
mechanism as-is (only swapping the hook's import source to
`expo-router`), rather than moving the header into the `app/` wrapper
like every prior group's detail screen — the menu logic genuinely
belongs with the component that owns `postUrl`/`handleMenuAction`. The
`app/` wrapper's own `<Stack.Screen>` only sets a fallback `title`
(`communityName`, available synchronously from the URL params) for the
brief loading/error/not-found window before `PostDetailView` mounts and
takes over.

**The tab bar's own header-right (a feed-style picker menu) has no
route-data dependency, so it's set statically.** `VariantPickerButton`
(a Zustand-backed, purely presentational SwiftUI menu — unrelated to
navigation, untouched by this plan) is exported and set directly as
`app/(home)/_layout.tsx`'s new `Communities` entry's `headerRight` —
unlike Building Hours' per-item favorite button, this one needs no data
from the currently-active screen, so there's no reason to route it
through a dynamic per-page `<Stack.Screen>`.

## Global Constraints

- Branch `expo-router-home-reddit`, stacked on
  `expo-router-home-building-hours` (PR #7683).
- iOS only. Never bypass the pre-commit hook. No `any`.
- Don't clean up the SDD workspace/screenshots until they're uploaded via
  `attach-github-assets` and posted as a PR comment.
- Independently mergeable and independently functional.
- `devOnly: true` on the `reddit` entry in `views.ts` stays — this tile
  remains dev-build-only after migration, same as before.

---

### Task 1: Wire the Communities tab bar and RedditPostDetail into expo-router

**Files:**
- Modify: `source/views/reddit/index.tsx`
- Modify: `source/views/reddit/post-detail.tsx`
- Modify: `source/views/reddit/useRedditLinkHandler.ts`
- Modify: `source/views/reddit/query.ts`
- Modify: `source/navigation/routes.tsx`
- Modify: `source/navigation/types.tsx`
- Modify: `source/views/views.ts`
- Modify: `app/(home)/_layout.tsx`
- Create: `app/(home)/Communities/_layout.tsx`
- Create: `app/(home)/Communities/index.tsx`
- Create: `app/(home)/Communities/carleton.tsx`
- Create: `app/(home)/RedditPostDetail.tsx`

**Interfaces:**
- Consumes: `StOlafFeedScreen`, `CarletonFeedScreen`, `VariantPickerButton`,
  `PostDetailView` (new prop shape: `{post: RedditPostType; communityName:
  string}`) from `source/views/reddit`; `redditPostByUrlOptions` from
  `source/views/reddit/query.ts`.
- Produces: `/Communities` (tab group, default tab r/stolaf),
  `/Communities/carleton` (both within the tab bar, no per-tab header);
  `/RedditPostDetail` (flat sibling of `Communities/` at the `(home)/`
  level, dynamic header owned by `PostDetailView` itself, tab bar
  hidden).

- [ ] **Step 1: Add the shared single-post query**

In `source/views/reddit/query.ts`, replace the whole file with:

```typescript
import {queryOptions} from '@tanstack/react-query'
import type {RedditCommentType, RedditPostType} from './types'
import {
	fetchRedditComments,
	fetchRedditPost,
	fetchRedditPosts,
} from './reddit-api'

export const keys = {
	posts: (subreddit: string) => ['reddit', 'posts', subreddit] as const,
	post: (postUrl: string) => ['reddit', 'post', postUrl] as const,
	comments: (postUrl: string) => ['reddit', 'comments', postUrl] as const,
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const redditPostsOptions = (subreddit: string) =>
	queryOptions({
		queryKey: keys.posts(subreddit),
		queryFn: ({queryKey, signal}): Promise<RedditPostType[]> => {
			return fetchRedditPosts(queryKey[2], signal)
		},
	})

export const redditPostByUrlOptions = (
	postUrl: string,
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: keys.post(postUrl),
		queryFn: ({queryKey, signal}) => fetchRedditPost(queryKey[2], signal),
	})

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const redditCommentsOptions = (postUrl: string) =>
	queryOptions({
		queryKey: keys.comments(postUrl),
		queryFn: ({queryKey, signal}): Promise<RedditCommentType[]> => {
			return fetchRedditComments(queryKey[2], signal)
		},
	})
```

(`redditPostsOptions`/`redditCommentsOptions` are unchanged in behavior —
only `redditPostByUrlOptions` and its `keys.post` entry are new, built
directly on `fetchRedditPost`, not derived from either feed's list
query.)

- [ ] **Step 2: Change `PostDetailView` to accept `post`/`communityName` as props**

In `source/views/reddit/post-detail.tsx`, replace:

```typescript
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native'
```

with:

```typescript
import {useNavigation} from 'expo-router'
```

Replace:

```typescript
import type {
	RedditCommentType,
	FlatComment,
	RedditPostDetailParams,
} from './types'
```

with:

```typescript
import type {RedditCommentType, FlatComment, RedditPostType} from './types'
```

Delete:

```typescript
type RouteType = RouteProp<
	{RedditPostDetail: RedditPostDetailParams},
	'RedditPostDetail'
>
```

Replace:

```typescript
export function PostDetailView(): React.ReactNode {
	const navigation = useNavigation()
	const route = useRoute<RouteType>()
	const {
		postUrl,
		title,
		author,
		publishedAt,
		contentHtml,
		thumbnail,
		communityName,
		postAuthor,
		postType,
		imageUrl,
		images = [],
		linkUrl,
		linkDomain,
		crosspostParent,
		pollData,
	} = route.params
```

with:

```typescript
type Props = {
	post: RedditPostType
	communityName: string
}

export function PostDetailView({
	post,
	communityName,
}: Props): React.ReactNode {
	const navigation = useNavigation()
	const {
		permalink: postUrl,
		title,
		author,
		publishedAt,
		contentHtml,
		thumbnail,
		postType,
		imageUrl,
		images = [],
		linkUrl,
		linkDomain,
		crosspostParent,
		pollData,
	} = post
```

Find the one place this file uses `postAuthor` (comparing a comment's
author against the post's author, to mark it as the original poster):

```typescript
					isOP={item.comment.author === postAuthor}
```

Replace with:

```typescript
					isOP={item.comment.author === author}
```

(`postAuthor` was always just `post.author`, passed a second time under
a different name so it survived the trip through navigation params
alongside the rest — no longer needed now that `author` is destructured
directly from the same `post` prop.)

Delete the trailing exports (dead code once `routes.tsx` no longer
references them, Step 5, and once `app/(home)/RedditPostDetail.tsx`
supplies a fallback title, Step 12 — `PostDetailView`'s own
`useLayoutEffect` still sets the real title/headerRight dynamically once
mounted, unchanged from before):

```typescript
export const NavigationKey = 'RedditPostDetail'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: '',
}
```

Everything else in the file (the comment-flattening logic, the
`useLayoutEffect`/`navigation.setOptions()` header-right menu, the image
gallery/poll/crosspost rendering, `handleMenuAction`, the `FlatList`) is
unchanged — `navigation.setOptions()` still works the same way under
expo-router's own `useNavigation()`, same precedent Student
Orgs/Directory/More already established for dynamic per-screen headers.

- [ ] **Step 3: Swap `useRedditLinkHandler`'s navigation**

In `source/views/reddit/useRedditLinkHandler.ts`, replace:

```typescript
import {useNavigation} from '@react-navigation/native'
import type {NativeStackNavigationProp} from '@react-navigation/native-stack'
import {openUrl} from '@frogpond/open-url'
import type {RootStackParamList} from '../../navigation/types'
import {fetchRedditPost} from './reddit-api'
```

with:

```typescript
import {useRouter} from 'expo-router'
import {openUrl} from '@frogpond/open-url'
import {fetchRedditPost} from './reddit-api'
```

Replace:

```typescript
export function useRedditLinkHandler(): (url: string) => void {
	const navigation =
		useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const controllerRef = React.useRef<AbortController | null>(null)
```

with:

```typescript
export function useRedditLinkHandler(): (url: string) => void {
	const router = useRouter()
	const controllerRef = React.useRef<AbortController | null>(null)
```

Replace:

```typescript
				navigation.push('RedditPostDetail', {
					postUrl: post.permalink,
					title: post.title,
					author: post.author,
					publishedAt: post.publishedAt,
					contentHtml: post.contentHtml,
					thumbnail: post.thumbnail,
					communityName: `r/${redditMatch.subreddit}`,
					postAuthor: post.author,
					postType: post.postType,
					imageUrl: post.imageUrl,
					images: post.images,
					linkUrl: post.linkUrl,
					linkDomain: post.linkDomain,
					crosspostParent: post.crosspostParent,
					pollData: post.pollData,
				})
```

with:

```typescript
				router.push({
					pathname: '/RedditPostDetail',
					params: {
						postUrl: post.permalink,
						communityName: `r/${redditMatch.subreddit}`,
					},
				})
```

Update the trailing `useCallback` dependency array from `[navigation]`
to `[router]`. Everything else in the file (`parseRedditPostUrl`, the
abort-controller double-tap guard, the existence-check-then-navigate
flow) is unchanged. This still does its own `fetchRedditPost` call
before navigating (to decide whether to open the detail screen or fall
back to `openUrl`) — the detail screen's own `redditPostByUrlOptions`
query (Step 1) will do a second fetch for the same URL once it mounts;
this redundant fetch is a deliberate, accepted simplification (see this
plan's opening notes), not an oversight.

- [ ] **Step 4: Turn `source/views/reddit/index.tsx` into a plain re-export, wire up `router.push`**

Replace the whole file with:

```typescript
import * as React from 'react'
import {useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import IoniconGlyphs from '@react-native-vector-icons/ionicons/glyphmaps/Ionicons.json'
import {
	Host,
	Menu,
	Section,
	Text as SwiftUIText,
	Toggle,
} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	contentShape,
	font,
	foregroundColor,
	padding,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

/// The Ionicons glyphs come from the app-wide font registered through
/// `UIAppFonts` in Info.plist; SwiftUI addresses it by its family name.
const ICON_FONT_FAMILY = 'Ionicons'
const VARIANT_ICON_SIZE = 22
/// Matches TestIdentifiers.Reddit in the XCUITest target.
const VARIANT_PICKER_TEST_ID = 'reddit-variant-picker'

import type {RedditPostType} from './types'
import {redditPostsOptions} from './query'
import {PostList, type PostListVariant} from './post-list'
import {useRedditPreferences} from './store'

export {PostDetailView} from './post-detail'

const VARIANT_LABELS: Record<PostListVariant, string> = {
	A: 'Compact List',
	C: 'Card Feed',
}
const LABEL_TO_VARIANT: Record<string, PostListVariant> = {
	'Compact List': 'A',
	'Card Feed': 'C',
}
const VARIANT_ACTIONS = Object.keys(LABEL_TO_VARIANT)

export function StOlafFeedScreen(): React.ReactNode {
	const router = useRouter()
	const {variant} = useRedditPreferences()
	const query = useQuery(redditPostsOptions('stolaf'))

	const handlePressPost = React.useCallback(
		(post: RedditPostType) => {
			router.push({
				pathname: '/RedditPostDetail',
				params: {postUrl: post.permalink, communityName: 'St. Olaf'},
			})
		},
		[router],
	)

	return (
		<PostList onPressPost={handlePressPost} query={query} variant={variant} />
	)
}

export function CarletonFeedScreen(): React.ReactNode {
	const router = useRouter()
	const {variant} = useRedditPreferences()
	const query = useQuery(redditPostsOptions('carletoncollege'))

	const handlePressPost = React.useCallback(
		(post: RedditPostType) => {
			router.push({
				pathname: '/RedditPostDetail',
				params: {postUrl: post.permalink, communityName: 'Carleton'},
			})
		},
		[router],
	)

	return (
		<PostList onPressPost={handlePressPost} query={query} variant={variant} />
	)
}

export function VariantPickerButton(): React.ReactNode {
	const {variant, setVariant} = useRedditPreferences()

	return (
		// SwiftUI all the way down: hosting the React Native icon here would put
		// the trigger behind a boundary the UI tests cannot address.
		<Host matchContents={true}>
			<Menu
				label={
					<SwiftUIText
						modifiers={[
							padding({horizontal: 8, vertical: 4}),
							contentShape(shapes.rectangle()),
							font({family: ICON_FONT_FAMILY, size: VARIANT_ICON_SIZE}),
							foregroundColor(c.link),
							accessibilityIdentifier(VARIANT_PICKER_TEST_ID),
						]}
					>
						{String.fromCodePoint(IoniconGlyphs['grid-outline'])}
					</SwiftUIText>
				}
			>
				<Section title="Feed Style">
					{VARIANT_ACTIONS.map((label) => (
						<Toggle
							key={label}
							isOn={label === VARIANT_LABELS[variant]}
							label={label}
							onIsOnChange={() => {
								const next = LABEL_TO_VARIANT[label]
								if (next) setVariant(next)
							}}
						/>
					))}
				</Section>
			</Menu>
		</Host>
	)
}
```

(`createNativeBottomTabNavigator`, `Tab`, `TabParams`, `View`, the outer
`useLayoutEffect`/`useNavigation()` header-right wiring,
`NavigationParams`, `NavigationKey`, `NavigationOptions` are all deleted —
dead once `routes.tsx` no longer references them, Step 5, and once
expo-router's file-based `NativeTabs` layout owns tab routing plus
`(home)/_layout.tsx` owns the header-right, Step 8. `StOlafFeedScreen`/
`CarletonFeedScreen`/`VariantPickerButton` are now exported directly —
`VariantPickerButton` was previously unexported, needed now since
`(home)/_layout.tsx` imports it. `VariantPickerButton`'s own body is
byte-for-byte unchanged — it has no navigation dependency at all, purely
Zustand + SwiftUI.)

- [ ] **Step 5: Remove the dead registration from routes.tsx**

In `source/navigation/routes.tsx`, remove the import:

```typescript
import * as reddit from '../views/reddit'
```

and remove the Communities `Stack.Group` block:

```typescript
			<Stack.Group>
				<Stack.Screen
					component={reddit.View}
					name={reddit.NavigationKey}
					options={reddit.NavigationOptions}
				/>
				<Stack.Screen
					component={reddit.PostDetailView}
					name={reddit.PostDetailNavigationKey}
					options={reddit.PostDetailNavigationOptions}
				/>
			</Stack.Group>
```

Leave every other group's registration untouched.

- [ ] **Step 6: Update `source/navigation/types.tsx`**

Replace:

```typescript
import * as reddit from '../views/reddit'
```

with nothing (delete the line — `reddit.NavigationKey`/
`reddit.NavigationParams` no longer exist after Step 4).

Replace:

```typescript
	[reddit.NavigationKey]: reddit.NavigationParams
```

with:

```typescript
	Communities: undefined
```

(same pattern already used for `Menus`/`'Streaming Media'`/`News`/
`Transportation`/`BuildingHours` on the surrounding lines. Leave
`RedditPostDetail: RedditPostDetailParams` and its
`import type {RedditPostDetailParams} from '../views/reddit/types'`
completely untouched — that type still exists in `reddit/types.ts`
(this plan doesn't delete it) and this line becomes exactly the same
kind of dead-but-documented leftover every other migrated group's detail
type already is in this file.)

- [ ] **Step 7: Restore the group's home-grid entry**

In `source/views/views.ts`, remove the `disabled: true` line from the
`reddit` entry. Leave `devOnly: true` in place, untouched.

- [ ] **Step 8: Give the outer "Communities" entry its title and header-right**

In `app/(home)/_layout.tsx`, add a sixth entry to the existing `<Stack>`
(alongside the `Menus`, `Streaming Media`, `News`, `Transportation`, and
`BuildingHours` entries prior groups' plans already added):

```typescript
import {VariantPickerButton} from '../../source/views/reddit'
```

```typescript
<Stack.Screen
	name="Communities"
	options={{title: 'Communities', headerRight: () => <VariantPickerButton />}}
/>
```

(unlike Building Hours' favorite button, `VariantPickerButton` needs no
per-screen data — it's safe to set statically here rather than via a
per-page dynamic `<Stack.Screen>`.)

- [ ] **Step 9: Create the native tab bar layout**

Create `app/(home)/Communities/_layout.tsx` — this is the *entire* file,
not a wrapper around anything else, exactly like every prior tab-bar
group's `_layout.tsx`:

```typescript
import * as React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'

export default function CommunitiesLayout(): React.ReactNode {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<NativeTabs.Trigger.Icon sf="person.2.fill" />
				<NativeTabs.Trigger.Label>r/stolaf</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="carleton">
				<NativeTabs.Trigger.Icon sf="building.columns.fill" />
				<NativeTabs.Trigger.Label>r/carletoncollege</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
```

- [ ] **Step 10: Create the 2 tab route files**

Create `app/(home)/Communities/index.tsx`:

```typescript
import * as React from 'react'
import {StOlafFeedScreen} from '../../../source/views/reddit'

export default function StOlafFeedPage(): React.ReactNode {
	return <StOlafFeedScreen />
}
```

Create `app/(home)/Communities/carleton.tsx`:

```typescript
import * as React from 'react'
import {CarletonFeedScreen} from '../../../source/views/reddit'

export default function CarletonFeedPage(): React.ReactNode {
	return <CarletonFeedScreen />
}
```

(neither needs its own `<Stack.Screen options={...}>` — `NativeTabs`
draws the tab bar and each leaf screen renders full-bleed below it with
no per-tab header, matching the original
`Tab.Navigator screenOptions={{headerShown: false}}` behavior exactly.)

- [ ] **Step 11: Create the RedditPostDetail route**

Create `app/(home)/RedditPostDetail.tsx`:

```typescript
import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {PostDetailView} from '../../source/views/reddit'
import {redditPostByUrlOptions} from '../../source/views/reddit/query'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function RedditPostDetailPage(): React.ReactNode {
	let {postUrl, communityName} = useLocalSearchParams<{
		postUrl: string
		communityName: string
	}>()

	let {
		data: post,
		isLoading,
		error,
		refetch,
	} = useQuery(redditPostByUrlOptions(postUrl))

	let screen = <Stack.Screen options={{title: communityName}} />

	if (isLoading) {
		return (
			<>
				{screen}
				<LoadingView />
			</>
		)
	}

	if (error) {
		return (
			<>
				{screen}
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occured while loading: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`}
				/>
			</>
		)
	}

	if (!post) {
		return (
			<>
				{screen}
				<NoticeView text="Could not find this post." />
			</>
		)
	}

	return (
		<>
			{screen}
			<PostDetailView communityName={communityName} post={post} />
		</>
	)
}
```

(this wrapper's `<Stack.Screen>` only covers the brief loading/error/
not-found window — once `PostDetailView` mounts on success, its own
`useLayoutEffect`/`navigation.setOptions()` immediately overrides both
`title` and `headerRight` with the real menu, unchanged from the
original architecture.)

- [ ] **Step 12: Verify**

Run: `mise run tsc` — expect 0 errors.
Run: `mise run lint` — expect clean.
Run: `mise run test` — expect the same pass/fail counts as before this
task (rerun once if a failure looks like a flake; confirm via a clean
rerun before treating a failure as real).

- [ ] **Step 13: Manual boot verification**

This tile is `devOnly: true` — confirm you're running the development
variant (`APP_VARIANT=development`) so it's actually visible on the home
grid; the production variant will not show it, which is expected, not a
bug.

Run: `APP_VARIANT=development mise run prebuild` then
`APP_VARIANT=development mise run ios`, in the FOREGROUND, genuinely
waited on to completion.

Expected: home screen shows the "Communities" tile (dev variant only).
Tapping it shows a header reading "‹ All About Olaf | Communities" with
a working back button and a header-right grid-icon menu (tap it: a "Feed
Style" menu with "Compact List"/"Card Feed" toggles should appear,
switching `PostListVariant` — confirm the feed's visual style actually
changes), and below the header a native tab bar with 2 tabs (r/stolaf,
r/carletoncollege), each with the correct SF Symbol icon, r/stolaf
selected by default. Tapping between tabs switches content without
losing the tab bar or the header. Tapping a post row hides the tab bar
and pushes to the post detail screen, showing the real post title/body/
comments, with a header reading the community name and a working
"..." menu (Open in Browser / Share). If a post's body contains a link
to another Reddit post, tapping it should also open a detail screen (via
`useRedditLinkHandler`), separate from tapping a feed row — try this if a
suitable post is available; otherwise note in the report that this path
wasn't exercised live and why. No crash anywhere in this flow.

Both feeds and the detail screen hit live network endpoints — note in
the report whether real data was reachable in this sandboxed
environment, and if not, confirm the loading/error states at minimum
render correctly and non-crashing.

Screenshot: home screen showing the Communities tile, the Communities
tab bar (r/stolaf selected, showing the header with back button and the
feed-style menu button), the r/carletoncollege tab, and a post detail
screen (showing the community-name header and the "..." menu) — look at
each yourself.

**Keep these screenshots until they're uploaded via `attach-github-assets`
and posted as a PR comment — don't clean up the SDD workspace first.**

- [ ] **Step 14: Commit**

```bash
git add source/views/reddit/index.tsx source/views/reddit/post-detail.tsx source/views/reddit/useRedditLinkHandler.ts source/views/reddit/query.ts source/navigation/routes.tsx source/navigation/types.tsx source/views/views.ts app/\(home\)/_layout.tsx app/\(home\)/Communities/ app/\(home\)/RedditPostDetail.tsx
git commit -m "Restore the Communities home-grid tile

Twelfth group PR in checkpoint 2's stack, and the fifth tab-bar
group -- applies the proven NativeTabs flat-structure pattern. Stays
devOnly: true, unchanged from before this migration.

RedditPostDetail has three navigation entry points (two feed
screens, plus useRedditLinkHandler for links found inside a post's
own body/comments, which can point at an arbitrary, untracked
subreddit). Rather than passing a 13-field object through
navigation params -- impossible under expo-router's URL-based
routing -- or juggling two different lookup strategies depending on
which screen navigated, all three now converge on one
redditPostByUrlOptions(postUrl) query built directly on
fetchRedditPost, reddit-api.ts's existing single-post-by-URL fetch.
communityName travels as a plain string param, no lookup needed.

PostDetailView keeps owning its own dynamic header
(navigation.setOptions() inside a useLayoutEffect, unchanged in
mechanism) rather than moving it into the app/ wrapper like every
prior group's detail screen -- the header-right menu genuinely
depends on state the component itself already computes. The
Communities tab group's own header-right (a feed-style picker with
no per-screen data dependency) is set statically in
app/(home)/_layout.tsx instead.

source/navigation/routes.tsx's Communities registration (both
screens, dead code, still type-checked) is removed in the same
commit."
```

- [ ] **Step 15: Attach screenshots to the PR**

Once the PR is open (via `gh stack submit`), use `attach-github-assets` to
upload each screenshot and post them as one PR comment.
