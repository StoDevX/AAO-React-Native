import * as React from 'react'
import {StyleSheet} from 'react-native'
import {
	Host,
	HStack,
	Image,
	LazyVStack,
	RNHostView,
	ScrollView as SwiftUIScrollView,
	Spacer,
	Text,
	VStack,
} from '@expo/ui/swift-ui'
import {
	aspectRatio,
	background,
	font,
	foregroundStyle,
	frame,
	padding,
	resizable,
} from '@expo/ui/swift-ui/modifiers'
import {Asset} from 'expo-asset'
import * as c from '@frogpond/colors'
import type {Moment} from 'moment'

import {DietaryTags} from './dietary-tags'
import type {
	MasterCorIconMapType,
	MenuItemContainerType,
	MenuItemType,
	ProcessedMealType,
	StationMenuType,
} from './types'

/**
 * Accepts everything `FancyMenu` does so `menu-bonapp.tsx` needs no changes,
 * but reads only what the measurement needs. The rest are named to keep the
 * JSX excess-property check quiet.
 */
type Props = {
	cafeMessage?: string | null
	foodItems: MenuItemContainerType
	meals: ProcessedMealType[]
	menuCorIcons: MasterCorIconMapType
	name: string
	now: Moment
	onItemPress: (item: MenuItemType) => void
	onRefresh?: () => void
	refreshing?: boolean
}

type Section = {title: string; data: MenuItemType[]}

/**
 * How the dietary icons get on screen -- the whole point of the spike, since
 * `@expo/ui`'s `Image` cannot load the remote URLs BonApp gives us.
 *
 * - `none`: no icons. The control, used to prove the list itself lays out.
 * - `rnhost`: one `RNHostView` per row hosting the existing RN `DietaryTags`.
 *   Works, but keeps `PublishContentOriginModifier` writing `setContentOrigin`
 *   once per row per frame while scrolling.
 * - `uiimage`: download each icon once with `expo-asset` and hand SwiftUI the
 *   local `file://` path. Rows become pure SwiftUI with no bridging at all --
 *   at the cost of a synchronous read and decode inside `ImageView.body`,
 *   which has no cache of any kind (`node_modules/@expo/ui/ios/ImageView.swift:44-51`).
 */
type IconMode = 'none' | 'rnhost' | 'uiimage'
const ICON_MODE: IconMode = 'uiimage'

/**
 * `DietaryTags` draws each icon 15pt square with 3pt of margin either side, so
 * a row of them is a known size before SwiftUI lays anything out.
 *
 * That matters in `rnhost` mode because `RNHostView` cannot size itself here.
 * With `matchContents`, it KVO-observes the hosted view's bounds
 * (`ApplySizeFromYogaNode`) -- and a `DietaryTags` view given no constraints
 * has no bounds worth observing, which collapsed the list to a single header.
 * `matchContents={false}` instead takes the size of the parent SwiftUI view,
 * so stating that parent's frame is what gives the RN subtree something
 * definite to lay out into.
 */
const ICON_SIDE = 15
const ICON_GAP = 3
const ICON_SLOT = ICON_SIDE + ICON_GAP * 2

/** The cafe's cor-icon keys that this item carries, matching `DietaryTags`'s own filter. */
function dietaryIconKeys(
	corIcons: MasterCorIconMapType,
	dietary: MenuItemType['cor_icon'],
): string[] {
	let itemKeys = new Set(Object.keys(dietary))
	return Object.keys(corIcons).filter((key) => itemKeys.has(key))
}

/**
 * Downloads each of the cafe's cor-icons once and hands back its local
 * `file://` path, keyed the same way `corIcons` is.
 *
 * There are only ever a handful of these -- they are the cafe's dietary
 * *categories*, not one per food item -- so this is a small fixed cost paid
 * once per cafe, not per row. `downloadAsync` reuses an already-downloaded
 * file, though it keeps them in the OS cache directory and does not promise
 * they survive between sessions.
 */
function useLocalCorIcons(corIcons: MasterCorIconMapType): Record<string, string> {
	let [localByKey, setLocalByKey] = React.useState<Record<string, string>>({})

	React.useEffect(() => {
		let cancelled = false

		let downloads = Object.entries(corIcons)
			.filter(([, icon]) => Boolean(icon.image))
			.map(async ([key, icon]) => {
				try {
					let asset = await Asset.fromURI(icon.image).downloadAsync()
					return asset.localUri ? ([key, asset.localUri] as const) : null
				} catch {
					// An icon that will not download is not worth failing a menu
					// over -- that row simply shows one fewer icon.
					return null
				}
			})

		void Promise.all(downloads).then((pairs) => {
			if (cancelled) {
				return
			}
			let resolved = pairs.filter((pair): pair is readonly [string, string] => pair !== null)
			setLocalByKey(Object.fromEntries(resolved))
		})

		return () => {
			cancelled = true
		}
	}, [corIcons])

	return localByKey
}

/**
 * Throwaway. Exists only to measure what it costs to show the dietary icons in
 * a SwiftUI list, which `@expo/ui`'s `Image` cannot do directly. Delete once
 * the spike has an answer.
 *
 * Deliberately omits filters, pull-to-refresh, empty states, station notes,
 * and row taps: none of them change what is being measured, and each one
 * would be noise in the trace.
 */
export function SpikeMenu({foodItems, meals, menuCorIcons}: Props): React.ReactNode {
	let localIcons = useLocalCorIcons(menuCorIcons)

	// No filters -- the first meal is simply the longest thing available to
	// scroll, which is all the measurement wants.
	let stations: StationMenuType[] = meals[0]?.stations ?? []

	let sections: Section[] = stations
		.map((station) => ({
			title: station.label,
			// `.filter(Boolean)` would not narrow away the undefined that a
			// dangling id produces, so the predicate is spelled out.
			data: station.items
				.map((id) => foodItems[id])
				.filter((item): item is MenuItemType => Boolean(item)),
		}))
		.filter((section) => section.data.length > 0)

	return (
		<Host style={styles.host}>
			<SwiftUIScrollView modifiers={[background(c.systemBackground)]}>
				<LazyVStack alignment="leading">
					{sections.map((section) => (
						<VStack
							key={section.title}
							alignment="leading"
							modifiers={[padding({leading: 16, trailing: 16, top: 12, bottom: 8})]}
						>
							<Text modifiers={[font({textStyle: 'headline'})]}>{section.title}</Text>
							{section.data.map((item) => (
								<SpikeRow
									key={item.id}
									corIcons={menuCorIcons}
									item={item}
									localIcons={localIcons}
								/>
							))}
						</VStack>
					))}
				</LazyVStack>
			</SwiftUIScrollView>
		</Host>
	)
}

function SpikeRow({
	item,
	corIcons,
	localIcons,
}: {
	item: MenuItemType
	corIcons: MasterCorIconMapType
	localIcons: Record<string, string>
}): React.ReactNode {
	let iconKeys = dietaryIconKeys(corIcons, item.cor_icon)

	return (
		<HStack spacing={8}>
			<VStack alignment="leading" spacing={2}>
				<Text>{item.label}</Text>
				{item.description ? (
					<Text modifiers={[font({textStyle: 'footnote'}), foregroundStyle(c.secondaryLabel)]}>
						{item.description}
					</Text>
				) : null}
			</VStack>
			<Spacer />
			<RowIcons corIcons={corIcons} item={item} keys={iconKeys} localIcons={localIcons} />
		</HStack>
	)
}

/**
 * An item with no icons renders nothing at all in either mode -- a zero-sized
 * host is still a host, and most rows would otherwise pay for one.
 */
function RowIcons({
	item,
	corIcons,
	keys,
	localIcons,
}: {
	item: MenuItemType
	corIcons: MasterCorIconMapType
	keys: string[]
	localIcons: Record<string, string>
}): React.ReactNode {
	if (ICON_MODE === 'none' || keys.length === 0) {
		return null
	}

	if (ICON_MODE === 'rnhost') {
		return (
			<VStack modifiers={[frame({width: keys.length * ICON_SLOT, height: ICON_SIDE})]}>
				<RNHostView matchContents={false}>
					<DietaryTags corIcons={corIcons} dietary={item.cor_icon} />
				</RNHostView>
			</VStack>
		)
	}

	// `uiimage`: pure SwiftUI, no bridging. An icon whose download has not
	// landed yet is skipped rather than drawn as a gap, so the row settles
	// into place once and does not reflow per icon.
	let downloaded = keys.filter((key) => localIcons[key])
	if (downloaded.length === 0) {
		return null
	}

	return (
		<HStack spacing={ICON_GAP * 2}>
			{downloaded.map((key) => (
				/* `resizable` first, and it is not optional: without it SwiftUI draws
				   the image at its intrinsic pixel size and simply overflows the
				   frame, which is what had the icons colliding with each other and
				   running off the trailing edge. `aspectRatio` keeps a non-square
				   icon from stretching once it is resizable. */
				<Image
					key={key}
					modifiers={[
						resizable(),
						aspectRatio({contentMode: 'fit'}),
						frame({width: ICON_SIDE, height: ICON_SIDE}),
					]}
					uiImage={localIcons[key]}
				/>
			))}
		</HStack>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})
