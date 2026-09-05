import * as React from 'react'
import {Stack} from 'expo-router'
import {Host, Image, Menu, Section, Toggle} from '@expo/ui/swift-ui'
import {foregroundStyle, menuActionDismissBehavior} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

/**
 * Category picker in the bottom toolbar. Uses @expo/ui's Menu with
 * menuActionDismissBehavior('disabled') so the menu stays open while
 * toggling multiple categories.
 */
type Props = {
	categories: string[]
	selectedCategories: string[]
	onToggleCategory: (category: string) => void
	onTodayPress?: () => void
}

const STAYS_OPEN = [menuActionDismissBehavior('disabled')]
const ACTIVE_ICON = [foregroundStyle(c.systemBlue)]
const INACTIVE_ICON = [foregroundStyle(c.label)]

export function CalendarPicker({
	categories,
	selectedCategories,
	onToggleCategory,
	onTodayPress,
}: Props): React.ReactNode {
	let isSelected = (cat: string) => selectedCategories.includes(cat)
	let isActive = selectedCategories.length > 0
	let iconModifiers = isActive ? ACTIVE_ICON : INACTIVE_ICON

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
					<Menu label={<Image modifiers={iconModifiers} systemName="calendar" />}>
						<Section modifiers={STAYS_OPEN} title="St. Olaf">
							{categories.map((cat) => (
								<Toggle
									isOn={isSelected(cat)}
									key={cat}
									label={cat}
									onIsOnChange={() => onToggleCategory(cat)}
								/>
							))}
						</Section>
					</Menu>
				</Host>
			</Stack.Toolbar.View>
		</Stack.Toolbar>
	)
}
