import * as React from 'react'
import {Stack} from 'expo-router'
import {Button, Divider, Host, Image, Menu, Section, Toggle} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	foregroundStyle,
	menuActionDismissBehavior,
	menuOrder,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {isFilterActive} from './store'
import type {SportSection} from './types'
import {shortSportName} from './utils'

type Props = {
	sections: SportSection[]
	selectedSports: string[]
	onToggleSport: (sport: string) => void
	onReset: () => void
}

const STAYS_OPEN = [menuActionDismissBehavior('disabled')]
// Mirrored by `TestIdentifiers.Athletics.sportsMenu` in the XCUITest target:
// it is the only handle those tests have on the toolbar menu.
const LABEL = accessibilityLabel('Sports filter')

/**
 * The athletics bottom-toolbar menu: a toggle per sport, grouped as
 * `sportFilterSections` groups them, and Reset Filters once any is on.
 * Choosing none shows every game -- see `isFilterActive`.
 *
 * `menuOrder('fixed')` keeps the rows in the order they are written here; a
 * menu opened from the bottom bar otherwise draws its contents bottom to top.
 */
export function SportsMenu({
	sections,
	selectedSports,
	onToggleSport,
	onReset,
}: Props): React.ReactNode {
	let isActive = isFilterActive(selectedSports)
	// The same modifiers every render, only the colour changing: a change in
	// their types or count rebuilds the native Menu and closes it mid-toggle.
	let menuModifiers = [
		LABEL,
		menuOrder('fixed'),
		foregroundStyle(isActive ? c.systemBlue : c.label),
	]

	return (
		<Stack.Toolbar placement="bottom">
			<Stack.Toolbar.Spacer />
			<Stack.Toolbar.View>
				<Host matchContents={true}>
					<Menu label={<Image systemName="line.3.horizontal.decrease" />} modifiers={menuModifiers}>
						{sections.map((section) => (
							<Section key={section.title} modifiers={STAYS_OPEN} title={section.title}>
								{section.data.map((sport) => (
									<Toggle
										isOn={selectedSports.includes(sport)}
										key={sport}
										label={shortSportName(sport)}
										onIsOnChange={() => onToggleSport(sport)}
									/>
								))}
							</Section>
						))}
						{isActive ? (
							<>
								<Divider />
								<Button label="Reset Filters" onPress={onReset} />
							</>
						) : null}
					</Menu>
				</Host>
			</Stack.Toolbar.View>
		</Stack.Toolbar>
	)
}
