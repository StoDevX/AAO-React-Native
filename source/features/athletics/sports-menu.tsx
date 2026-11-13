import * as React from 'react'
import {Platform} from 'react-native'
import {Stack} from 'expo-router'
import * as c from '@frogpond/colors'
import {isFilterActive} from './store'
import type {SportSection} from './types'
import {shortSportName} from './utils'
import filterListIcon from '@expo/material-symbols/filter_list.xml'

type Props = {
	sections: SportSection[]
	selectedSports: string[]
	onToggleSport: (sport: string) => void
	onReset: () => void
}

/**
 * Where the filter sits: iOS's bottom toolbar, or on Android the top app
 * bar's trailing actions, where Material puts a screen's actions. Android has
 * no bottom toolbar, and one floated over the list hides its last row.
 */
const ON_ANDROID = Platform.OS === 'android'
// Mirrored by `TestIdentifiers.Athletics.sportsMenu` in the XCUITest target:
// it is the only handle those tests have on the toolbar menu.
const LABEL = 'Sports filter'

/**
 * The athletics bottom-toolbar menu: a toggle per sport, grouped as
 * `sportFilterSections` groups them, and Reset Filters once any is on.
 * Choosing none shows every game -- see `isFilterActive`.
 *
 * Every toggle keeps the menu up (`unstable_keepPresented`), so several
 * sports can be picked in one visit. The menu is tinted while it narrows the
 * list.
 */
export function SportsMenu({
	sections,
	selectedSports,
	onToggleSport,
	onReset,
}: Props): React.ReactNode {
	let isActive = isFilterActive(selectedSports)

	return (
		<Stack.Toolbar placement={ON_ANDROID ? 'right' : 'bottom'}>
			{ON_ANDROID ? null : <Stack.Toolbar.Spacer />}
			<Stack.Toolbar.Menu
				accessibilityLabel={LABEL}
				icon={process.env.EXPO_OS === 'ios' ? 'line.3.horizontal.decrease' : filterListIcon}
				tintColor={isActive ? c.systemBlue : undefined}
			>
				{sections.map((section) => (
					<Stack.Toolbar.Menu key={section.title} inline={true} title={section.title}>
						{section.data.map((sport) => (
							<Stack.Toolbar.MenuAction
								key={sport}
								isOn={selectedSports.includes(sport)}
								onPress={() => onToggleSport(sport)}
								unstable_keepPresented={true}
							>
								{shortSportName(sport)}
							</Stack.Toolbar.MenuAction>
						))}
					</Stack.Toolbar.Menu>
				))}
				{isActive ? (
					<Stack.Toolbar.Menu inline={true}>
						<Stack.Toolbar.MenuAction onPress={onReset}>Reset Filters</Stack.Toolbar.MenuAction>
					</Stack.Toolbar.Menu>
				) : null}
			</Stack.Toolbar.Menu>
		</Stack.Toolbar>
	)
}
