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
import {background, font, foregroundStyle, padding} from '@expo/ui/swift-ui/modifiers'
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
			    cor-icons are remote URLs SwiftUI's Image cannot load. */}
			<RNHostView matchContents={true}>
				<DietaryTags corIcons={corIcons} dietary={item.cor_icon} />
			</RNHostView>
		</HStack>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})
