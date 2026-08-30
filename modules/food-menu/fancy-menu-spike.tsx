import * as React from 'react'
import {StyleSheet} from 'react-native'
import {
	Host,
	HStack,
	LazyVStack,
	RNHostView,
	ScrollView as SwiftUIScrollView,
	Spacer,
	Text,
	VStack,
} from '@expo/ui/swift-ui'
import {background, font, foregroundStyle, frame, padding} from '@expo/ui/swift-ui/modifiers'
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
 * The single variable under test. `false` renders rows as pure SwiftUI, with no
 * dietary icons; `true` adds the per-row `RNHostView` that hosts `DietaryTags`.
 *
 * Flipping this is how we tell "the prototype is wrong" apart from
 * "`RNHostView`-per-row does not lay out inside a `LazyVStack`".
 */
const HOST_DIETARY_TAGS = true

/**
 * `DietaryTags` draws each icon 15pt square with 3pt of margin either side, so
 * a row of them is a known size before SwiftUI lays anything out.
 *
 * That matters because `RNHostView` cannot size itself here. With
 * `matchContents`, it KVO-observes the hosted view's bounds
 * (`ApplySizeFromYogaNode`) -- and a `DietaryTags` view given no constraints
 * has no bounds worth observing, which is what collapsed the first attempt.
 * `matchContents={false}` instead takes the size of the parent SwiftUI view,
 * so stating that parent's frame is what gives the RN subtree something
 * definite to lay out into.
 */
const ICON_SIDE = 15
const ICON_SLOT = ICON_SIDE + 3 * 2

/** How many of the cafe's cor-icons this item carries, matching `DietaryTags`'s own filter. */
function dietaryIconCount(
	corIcons: MasterCorIconMapType,
	dietary: MenuItemType['cor_icon'],
): number {
	let itemKeys = new Set(Object.keys(dietary))
	return Object.keys(corIcons).filter((key) => itemKeys.has(key)).length
}

/**
 * Throwaway. Exists only to measure the cost of one `RNHostView` per row,
 * which `DietaryTags` needs because `@expo/ui`'s `Image` cannot load the
 * remote cor-icon URLs. Delete once the spike has an answer.
 *
 * Deliberately omits filters, pull-to-refresh, empty states, station notes,
 * and row taps: none of them change what is being measured, and each one
 * would be noise in the trace.
 */
export function SpikeMenu({foodItems, meals, menuCorIcons}: Props): React.ReactNode {
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
								<SpikeRow key={item.id} corIcons={menuCorIcons} item={item} />
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
}: {
	item: MenuItemType
	corIcons: MasterCorIconMapType
}): React.ReactNode {
	let iconCount = dietaryIconCount(corIcons, item.cor_icon)

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
			{/* The thing being measured: an RN subtree per row, because the
			    cor-icons are remote URLs SwiftUI's Image cannot load.

			    An item with no dietary icons hosts nothing at all -- a zero-sized
			    host is still a host, and most rows would otherwise pay for one. */}
			{HOST_DIETARY_TAGS && iconCount > 0 ? (
				<VStack modifiers={[frame({width: iconCount * ICON_SLOT, height: ICON_SIDE})]}>
					<RNHostView matchContents={false}>
						<DietaryTags corIcons={corIcons} dietary={item.cor_icon} />
					</RNHostView>
				</VStack>
			) : null}
		</HStack>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})
