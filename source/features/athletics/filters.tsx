import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Button, Host, HStack, List, Section, Spacer, Text} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	buttonStyle,
	contentShape,
	environment,
	font,
	foregroundStyle,
	frame,
	listStyle,
	shapes,
	tag,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {useFilterStore} from './store'
import {SportSection} from './types'
import {isSectionFullySelected, shortSportName, toggleSectionSelection} from './utils'

// An active edit mode is what turns `List(selection:)`'s selected state into
// the circular checkboxes iOS draws while a list is being edited -- the same
// arrangement `modules/filter/filter-sheet.tsx` uses for its options.
const LIST_MODIFIERS = [listStyle('insetGrouped'), environment({key: 'editMode', value: 'active'})]
const ROW_MODIFIERS = [contentShape(shapes.rectangle())]
const FILL_LEADING = [frame({maxWidth: Infinity, alignment: 'leading'})]

const MIN_TOUCH_TARGET = 44
// "All" draws as a few characters of text, well under the 44x44pt minimum this
// project requires, so it gets `contentShape` -- making the whole frame
// tappable rather than the drawn glyphs -- and a frame floor to match.
const ALL_BUTTON_MODIFIERS = [
	buttonStyle('plain'),
	contentShape(shapes.rectangle()),
	frame({minHeight: MIN_TOUCH_TARGET}),
]
const HEADER_TITLE_MODIFIERS = [font({textStyle: 'footnote'}), foregroundStyle(c.secondaryLabel)]

interface AthleticsFiltersProps {
	sports: SportSection[]
}

export function AthleticsFilters({sports}: AthleticsFiltersProps): React.ReactNode {
	const selectedSports = useFilterStore((s) => s.selectedSports)
	const setSelectedSports = useFilterStore((s) => s.setSelectedSports)

	const handleSelectAll = (sectionTitle: string) => {
		const sectionSports = sports.find((s) => s.title === sectionTitle)?.data ?? []
		setSelectedSports(toggleSectionSelection(sectionSports, selectedSports))
	}

	return (
		<Host style={styles.host}>
			{/* Selection belongs to SwiftUI: `List(selection:)` under an active
			    edit mode owns each row's tap, so a row is plain content carrying a
			    tag rather than a `Button` -- a button would take the tap back and
			    the selection would never change. The section headers sit outside
			    that, so "All" stays an ordinary button. */}
			<List
				modifiers={LIST_MODIFIERS}
				onSelectionChange={(selection) => setSelectedSports(selection.map(String))}
				selection={selectedSports}
			>
				{sports.map((section, index) => (
					<Section
						key={section.title}
						footer={
							index === sports.length - 1 ? (
								<Text modifiers={HEADER_TITLE_MODIFIERS}>
									Filter preferences are saved locally to your device.
								</Text>
							) : undefined
						}
						header={
							<HStack>
								<Text modifiers={HEADER_TITLE_MODIFIERS}>{section.title}</Text>
								<Spacer />
								<Button
									modifiers={[...ALL_BUTTON_MODIFIERS, accessibilityLabel(`All ${section.title}`)]}
									onPress={() => handleSelectAll(section.title)}
								>
									<Text
										modifiers={[
											font({textStyle: 'footnote'}),
											foregroundStyle(
												isSectionFullySelected(section.data, selectedSports)
													? c.systemBlue
													: c.secondaryLabel,
											),
										]}
									>
										All
									</Text>
								</Button>
							</HStack>
						}
					>
						{section.data.map((sport) => (
							<Text key={sport} modifiers={[...ROW_MODIFIERS, ...FILL_LEADING, tag(sport)]}>
								{shortSportName(sport)}
							</Text>
						))}
					</Section>
				))}
			</List>
		</Host>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})
