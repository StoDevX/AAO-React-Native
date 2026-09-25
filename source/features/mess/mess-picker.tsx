import * as React from 'react'
import {Stack} from 'expo-router'
import {Host, Image, Menu, Section, Toggle} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	foregroundStyle,
	menuActionDismissBehavior,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import type {FilterBranch} from './lib/filter'

/**
 * The Mess's filter: every story, a whole section, or one column. Deselecting
 * the choice shows every story.
 */
type Props = {
	/** The sections in the paper's order, each with its columns A–Z */
	tree: FilterBranch[]
	/** The chosen section or column name, or null for every story */
	selected: string | null
	onSelect: (name: string | null) => void
}

const STAYS_OPEN = [menuActionDismissBehavior('disabled')]
const LABEL = accessibilityLabel('News filter')

export function MessPicker({tree, selected, onSelect}: Props): React.ReactNode {
	let isActive = selected !== null
	// Keep the modifier list structurally identical every render — only the
	// colour value changes. Swapping modifier types/count rebuilds the native
	// Menu and closes it mid-interaction.
	let menuModifiers = [LABEL, foregroundStyle(isActive ? c.systemBlue : c.label)]

	// Tapping the chosen section or column deselects it → shows every story
	let choice = (name: string, label = name) => (
		<Toggle
			isOn={selected === name}
			key={name}
			label={label}
			onIsOnChange={() => onSelect(name === selected ? null : name)}
		/>
	)

	// The Menu renders bottom-to-top, so each list is reversed to read top-down
	let reversed = [...tree].reverse()

	return (
		<Stack.Toolbar placement="bottom">
			<Stack.Toolbar.Spacer />
			<Stack.Toolbar.View>
				<Host matchContents={true}>
					<Menu label={<Image systemName="line.3.horizontal.decrease" />} modifiers={menuModifiers}>
						<Section modifiers={STAYS_OPEN}>
							{reversed.map(({section, columns}) =>
								columns.length === 0 ? (
									choice(section.name)
								) : (
									<Menu key={section.name} label={section.name}>
										<Section modifiers={STAYS_OPEN}>
											{[...columns].reverse().map((column) => choice(column.name))}
											{choice(section.name, `All ${section.name}`)}
										</Section>
									</Menu>
								),
							)}
							<Toggle
								isOn={selected === null}
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
