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
 * Category picker for one feed. Deselecting a category shows every story.
 */
type Props = {
	/** The feed's categories, sorted A-Z */
	categories: string[]
	selectedCategory: string | null
	onSelect: (category: string | null) => void
}

const STAYS_OPEN = [menuActionDismissBehavior('disabled')]
const LABEL = accessibilityLabel('News filter')

export function NewsPicker({categories, selectedCategory, onSelect}: Props): React.ReactNode {
	let isActive = selectedCategory !== null
	// Keep the modifier list structurally identical every render — only the
	// colour value changes. Swapping modifier types/count rebuilds the native
	// Menu and closes it mid-interaction.
	let menuModifiers = [LABEL, foregroundStyle(isActive ? c.systemBlue : c.label)]

	// Tapping the selected category deselects it → shows every story
	let handleToggle = (category: string) => {
		onSelect(category === selectedCategory ? null : category)
	}

	// Sorted A-Z, and the Menu renders bottom-to-top
	let reversed = [...categories].reverse()

	return (
		<Stack.Toolbar placement="bottom">
			<Stack.Toolbar.Spacer />
			<Stack.Toolbar.View>
				<Host matchContents={true}>
					<Menu label={<Image systemName="line.3.horizontal.decrease" />} modifiers={menuModifiers}>
						<Section modifiers={STAYS_OPEN}>
							{reversed.map((category) => (
								<Toggle
									isOn={selectedCategory === category}
									key={category}
									label={category}
									onIsOnChange={() => handleToggle(category)}
								/>
							))}
							<Toggle
								isOn={selectedCategory === null}
								label="All Stories"
								onIsOnChange={() => onSelect(null)}
							/>
						</Section>
					</Menu>
				</Host>
			</Stack.Toolbar.View>
		</Stack.Toolbar>
	)
}
