import * as React from 'react'
import {Platform} from 'react-native'
import {Stack} from 'expo-router'
import * as c from '@frogpond/colors'
import filterListIcon from '@expo/material-symbols/filter_list.xml'

/**
 * Category picker for one feed: All Stories, then each category. Deselecting a
 * category shows every story.
 *
 * Every entry keeps the menu up (`unstable_keepPresented`), as the filters
 * elsewhere do. The menu is tinted while it narrows the feed.
 */
type Props = {
	/** The feed's categories, in the order the menu lists them */
	categories: string[]
	selectedCategory: string | null
	onSelect: (category: string | null) => void
}

/**
 * Where the filter sits: iOS's bottom toolbar, or on Android the top app
 * bar's trailing actions, where Material puts a screen's actions. Android has
 * no bottom toolbar, and one floated over the list hides its last row.
 */
const ON_ANDROID = Platform.OS === 'android'
const LABEL = 'News filter'

export function NewsPicker({categories, selectedCategory, onSelect}: Props): React.ReactNode {
	// Tapping the selected category deselects it → shows every story
	let handleToggle = (category: string) => {
		onSelect(category === selectedCategory ? null : category)
	}

	return (
		<Stack.Toolbar placement={ON_ANDROID ? 'right' : 'bottom'}>
			{ON_ANDROID ? null : <Stack.Toolbar.Spacer />}
			<Stack.Toolbar.Menu
				accessibilityLabel={LABEL}
				icon={process.env.EXPO_OS === 'ios' ? 'line.3.horizontal.decrease' : filterListIcon}
				tintColor={selectedCategory !== null ? c.systemBlue : undefined}
			>
				<Stack.Toolbar.MenuAction
					isOn={selectedCategory === null}
					onPress={() => onSelect(null)}
					unstable_keepPresented={true}
				>
					All Stories
				</Stack.Toolbar.MenuAction>
				{categories.map((category) => (
					<Stack.Toolbar.MenuAction
						key={category}
						isOn={selectedCategory === category}
						onPress={() => handleToggle(category)}
						unstable_keepPresented={true}
					>
						{category}
					</Stack.Toolbar.MenuAction>
				))}
			</Stack.Toolbar.Menu>
		</Stack.Toolbar>
	)
}
