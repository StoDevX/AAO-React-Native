import * as React from 'react'
import {useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import * as c from '@frogpond/colors'
import {
	SegmentedSwitcher,
	SwitcherSegment,
} from '../../components/segmented-switcher'
import {BonAppHostedMenu} from './menu-bonapp'
import {GitHubHostedMenu} from './menu-github'
import {CarletonCafeIndex} from './carleton-menus'

export {
	CarletonBurtonMenuScreen,
	CarletonLDCMenuScreen,
	CarletonWeitzMenuScreen,
	CarletonSaylesMenuScreen,
} from './carleton-menus'

const StavHallMenuView = () => (
	<BonAppHostedMenu
		cafe="stav-hall"
		loadingMessage={[
			'Hunting Ferndale Turkey…',
			'Tracking wild vegan burgers…',
			'"Cooking" some lutefisk…',
			'Finding more mugs…',
			'Waiting for omelets…',
			'Putting out more cookies…',
		]}
		name="Stav Hall"
	/>
)

const TheCageMenuView = () => (
	<BonAppHostedMenu
		cafe="the-cage"
		ignoreProvidedMenus={true}
		loadingMessage={[
			'Checking for vegan cookies…',
			'Serving up some shakes…',
			'Waiting for menu screens to change…',
			'Frying chicken…',
			'Brewing coffee…',
		]}
		name="The Cage"
	/>
)

const ThePauseMenuView = () => (
	<GitHubHostedMenu
		loadingMessage={[
			'Mixing up a shake…',
			'Spinning up pizzas…',
			'Turning up the music…',
			'Putting ice cream on the cookies…',
			'Fixing the oven…',
		]}
		name="The Pause"
	/>
)

type MenuSource = 'stav-hall' | 'the-cage' | 'the-pause' | 'carleton'

const SEGMENTS: ReadonlyArray<SwitcherSegment<MenuSource>> = [
	{value: 'stav-hall', label: 'Stav Hall'},
	{value: 'the-cage', label: 'The Cage'},
	{value: 'the-pause', label: 'The Pause'},
	{value: 'carleton', label: 'Carleton'},
]

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: c.systemBackground,
	},
	menu: {
		flex: 1,
	},
})

function SelectedMenu({source}: {source: MenuSource}): React.ReactNode {
	switch (source) {
		case 'stav-hall':
			return <StavHallMenuView />
		case 'the-cage':
			return <TheCageMenuView />
		case 'the-pause':
			return <ThePauseMenuView />
		case 'carleton':
		default:
			return <CarletonCafeIndex />
	}
}

function MenusView(): React.ReactNode {
	let [source, setSource] = useState<MenuSource>('stav-hall')

	return (
		<View style={styles.container}>
			<SegmentedSwitcher
				onChange={setSource}
				segments={SEGMENTS}
				value={source}
			/>
			<View style={styles.menu}>
				<SelectedMenu source={source} />
			</View>
		</View>
	)
}

export {MenusView as View}

export type NavigationParams = undefined
export const NavigationKey = 'Menus'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Menus',
}
