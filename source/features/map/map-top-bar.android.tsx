import * as React from 'react'
import {ScrollView, StyleSheet, TextInput, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {
	DropdownMenu,
	DropdownMenuItem,
	FilterChip,
	Host,
	Icon,
	IconButton,
	Text,
} from '@expo/ui/jetpack-compose'
import * as c from '@frogpond/colors'

import type {MapTopBarProps} from './map-top-bar'
import arrowBackIcon from '@expo/material-symbols/arrow_back.xml'
import checkIcon from '@expo/material-symbols/check.xml'
import closeIcon from '@expo/material-symbols/close.xml'
import infoIcon from '@expo/material-symbols/info.xml'

export type {MapTopBarProps}

const SEARCH_PLACEHOLDER = 'Search campus'
const CHIP_ICON_SIZE = 18

/**
 * Android's map's top: a Material search bar floating over the map with Back
 * at its start, and under it a row of filter chips, one per category, as
 * Google Maps draws them. The map runs under both; there is no app bar.
 * Choosing a chip opens its category in the sheet, and choosing it again
 * closes it.
 */
export function MapTopBar({
	query,
	onQueryChange,
	onSearchFocusChange,
	groups,
	opened,
	onOpen,
	credits,
	onOpenCredit,
	onBack,
}: MapTopBarProps): React.ReactNode {
	let insets = useSafeAreaInsets()
	let input = React.useRef<React.ComponentRef<typeof TextInput>>(null)

	return (
		<View pointerEvents="box-none" style={[styles.top, {paddingTop: insets.top + 8}]}>
			<View style={styles.bar}>
				<Host matchContents={true}>
					<IconButton onClick={onBack}>
						<Icon contentDescription="Back" source={arrowBackIcon} />
					</IconButton>
				</Host>
				<TextInput
					ref={input}
					accessibilityLabel={SEARCH_PLACEHOLDER}
					onBlur={() => onSearchFocusChange(false, query.trim() !== '')}
					onChangeText={onQueryChange}
					onFocus={() => onSearchFocusChange(true, query.trim() !== '')}
					placeholder={SEARCH_PLACEHOLDER}
					placeholderTextColor={c.secondaryLabel}
					returnKeyType="search"
					style={styles.field}
					testID={SEARCH_PLACEHOLDER}
					value={query}
				/>
				{query ? (
					<Host matchContents={true}>
						<IconButton
							onClick={() => {
								onQueryChange('')
								input.current?.blur()
							}}
						>
							<Icon contentDescription="Clear search" source={closeIcon} />
						</IconButton>
					</Host>
				) : (
					<CreditsMenu credits={credits} onOpenCredit={onOpenCredit} />
				)}
			</View>
			{groups.length > 0 && !query ? (
				<ScrollView
					contentContainerStyle={styles.chips}
					horizontal={true}
					keyboardShouldPersistTaps="handled"
					showsHorizontalScrollIndicator={false}
				>
					{groups.map((label) => (
						<Host key={label} matchContents={true}>
							<FilterChip
								colors={{containerColor: c.secondarySystemGroupedBackground}}
								elevation={2}
								onClick={() => onOpen(opened === label ? null : label)}
								selected={opened === label}
							>
								<FilterChip.Label>
									<Text>{label}</Text>
								</FilterChip.Label>
								{opened === label ? (
									<FilterChip.LeadingIcon>
										<Icon size={CHIP_ICON_SIZE} source={checkIcon} />
									</FilterChip.LeadingIcon>
								) : null}
							</FilterChip>
						</Host>
					))}
				</ScrollView>
			) : null}
		</View>
	)
}

/** The tiles' credits, which their licence requires, behind the bar's info button. */
function CreditsMenu({
	credits,
	onOpenCredit,
}: Pick<MapTopBarProps, 'credits' | 'onOpenCredit'>): React.ReactNode {
	let [expanded, setExpanded] = React.useState(false)
	return (
		<Host matchContents={true}>
			<DropdownMenu expanded={expanded} onDismissRequest={() => setExpanded(false)}>
				<DropdownMenu.Trigger>
					<IconButton onClick={() => setExpanded(true)}>
						<Icon contentDescription="About this map" source={infoIcon} />
					</IconButton>
				</DropdownMenu.Trigger>
				<DropdownMenu.Items>
					{credits.map((credit) => (
						<DropdownMenuItem
							key={credit.url}
							onClick={() => {
								setExpanded(false)
								onOpenCredit(credit)
							}}
						>
							<DropdownMenuItem.Text>
								<Text>{credit.label}</Text>
							</DropdownMenuItem.Text>
						</DropdownMenuItem>
					))}
				</DropdownMenu.Items>
			</DropdownMenu>
		</Host>
	)
}

const styles = StyleSheet.create({
	top: {position: 'absolute', left: 0, right: 0, top: 0, gap: 12},
	bar: {
		marginHorizontal: 16,
		height: 56,
		borderRadius: 28,
		backgroundColor: c.tertiarySystemGroupedBackground,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 4,
		elevation: 3,
	},
	field: {flex: 1, fontSize: 16, color: c.label, paddingHorizontal: 4},
	chips: {paddingHorizontal: 16, gap: 8},
})
