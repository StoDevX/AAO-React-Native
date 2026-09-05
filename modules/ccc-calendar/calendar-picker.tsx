import * as React from 'react'
import {Stack} from 'expo-router'
import {Host, Image, Menu, Section, Toggle} from '@expo/ui/swift-ui'
import {
	buttonStyle,
	foregroundStyle,
	menuActionDismissBehavior,
	tint,
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
const ACTIVE_STYLE = [
	buttonStyle('borderedProminent'),
	tint(c.systemBlue),
	foregroundStyle(c.white),
]
const INACTIVE_STYLE = [foregroundStyle(c.label)]

export function CalendarPicker({
	categories,
	selectedCategory,
	onSelectCategory,
	onTodayPress,
}: Props): React.ReactNode {
	let isActive = selectedCategory !== null
	let menuModifiers = isActive ? ACTIVE_STYLE : INACTIVE_STYLE

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
						</Section>
					</Menu>
				</Host>
			</Stack.Toolbar.View>
		</Stack.Toolbar>
	)
}
