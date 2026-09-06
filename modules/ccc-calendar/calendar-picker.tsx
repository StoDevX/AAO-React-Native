import * as React from 'react'
import {Stack} from 'expo-router'
import {Host, Image, Menu, Section, Toggle} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	foregroundStyle,
	menuActionDismissBehavior,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

/**
 * Category picker in the bottom toolbar. Single-select with menu staying open:
 * tapping a category filters to it, tapping again clears the filter.
 */
type Props = {
	categories: string[]
	selectedCategory: string | null
	onSelectCategory: (category: string | null) => void
	onTodayPress?: () => void
}

const STAYS_OPEN = [menuActionDismissBehavior('disabled')]
const LABEL = accessibilityLabel('Category filter')

export function CalendarPicker({
	categories,
	selectedCategory,
	onSelectCategory,
	onTodayPress,
}: Props): React.ReactNode {
	let isActive = selectedCategory !== null
	// Keep the modifier list structurally identical every render — only the
	// colour value changes. Swapping modifier types/count rebuilds the native
	// Menu and closes it mid-interaction.
	let menuModifiers = [LABEL, foregroundStyle(isActive ? c.systemBlue : c.label)]

	let handleToggle = (cat: string) => {
		onSelectCategory(selectedCategory === cat ? null : cat)
	}

	return (
		<Stack.Toolbar placement="bottom">
			{onTodayPress ? (
				<Stack.Toolbar.Button accessibilityLabel="Today" onPress={onTodayPress}>
					Today
				</Stack.Toolbar.Button>
			) : null}
			<Stack.Toolbar.Spacer />
			<Stack.Toolbar.View>
				<Host matchContents={true}>
					<Menu label={<Image systemName="calendar" />} modifiers={menuModifiers}>
						<Section modifiers={STAYS_OPEN} title="ST. OLAF">
							{categories.map((cat) => (
								<Toggle
									isOn={selectedCategory === cat}
									key={cat}
									label={cat}
									onIsOnChange={() => handleToggle(cat)}
								/>
							))}
							{/* Rendered last so it sits at the visual top of the section */}
							<Toggle
								isOn={selectedCategory === null}
								key="__all__"
								label="All Events"
								onIsOnChange={() => onSelectCategory(null)}
							/>
						</Section>
					</Menu>
				</Host>
			</Stack.Toolbar.View>
		</Stack.Toolbar>
	)
}
