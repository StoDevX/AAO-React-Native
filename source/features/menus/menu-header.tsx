import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {Stack} from 'expo-router'
import * as c from '@frogpond/colors'
import type {MealMenuSelection} from '@frogpond/food-menu'

/**
 * What a menu screen puts in its navigation bar: the cafe it is showing, the
 * day it is showing, and the meal picker -- or `null` for a cafe that serves
 * one meal.
 *
 * The date arrives already formatted. `now` is a fresh `Moment` on every render
 * of the screens that publish this, so a `Moment` here would republish on every
 * render and loop through the provider's state.
 */
type MenuHeader = {
	name: string
	date: string
	meals: MealMenuSelection | null
}

type ContextValue = {
	header: MenuHeader | null
	publish: (header: MenuHeader) => void
}

const MenuHeaderContext = React.createContext<ContextValue | null>(null)

/**
 * Holds the header for whichever menu is on screen.
 *
 * The four St. Olaf cafes are tabs of one stack route, so they share a single
 * navigation bar and cannot each own it. A cafe publishes into this while it
 * holds focus, and the host below draws whatever was published last.
 */
export function MenuHeaderProvider(props: {children: React.ReactNode}): React.ReactNode {
	let [header, setHeader] = React.useState<MenuHeader | null>(null)

	let value = React.useMemo((): ContextValue => ({header, publish: setHeader}), [header])

	return <MenuHeaderContext.Provider value={value}>{props.children}</MenuHeaderContext.Provider>
}

/**
 * Publishes a menu's header while `active`, which is the screen's own focus.
 *
 * `NativeTabs` mounts every tab as soon as Menus opens, so three cafes the
 * reader never asked for are live at any moment; without the gate they would
 * take turns titling the screen.
 *
 * `header` must be memoized by the caller -- it is compared by identity.
 */
export function usePublishMenuHeader(header: MenuHeader, active: boolean): void {
	let publish = React.useContext(MenuHeaderContext)?.publish

	React.useEffect(() => {
		if (active) {
			publish?.(header)
		}
	}, [active, header, publish])
}

/**
 * Draws the published header.
 *
 * Must be mounted as a direct child of the stack -- `app/(home)/Menus/_layout.tsx`
 * for the tabs, or a Carleton page for its own screen. Expo Router keys these
 * options by the nearest route, so the same components inside a tab register
 * against the tab's route and are dropped without a word.
 */
export function MenuHeaderHost(): React.ReactNode {
	let header = React.useContext(MenuHeaderContext)?.header

	if (!header) {
		return null
	}

	return (
		<>
			{/* `Stack.Title asChild` sets only `headerTitle`; the plain string
			    is what the back button and VoiceOver's fallback read. */}
			<Stack.Screen options={{title: header.name}} />
			<Stack.Title asChild={true}>
				<MenuHeaderTitle date={header.date} name={header.name} />
			</Stack.Title>
			{header.meals ? <MealPicker meals={header.meals} /> : null}
		</>
	)
}

function MenuHeaderTitle(props: {name: string; date: string}): React.ReactNode {
	let {name, date} = props

	return (
		<View accessibilityLabel={`${name}, ${date}`} accessible={true} style={styles.title}>
			<Text style={styles.name}>{name}</Text>
			<Text style={styles.date}>{date}</Text>
		</View>
	)
}

function MealPicker(props: {meals: MealMenuSelection}): React.ReactNode {
	let {meals} = props

	return (
		<Stack.Toolbar placement="right">
			<Stack.Toolbar.Menu
				accessibilityLabel={`${meals.title}, ${meals.selected}`}
				title={meals.title}
			>
				<Stack.Toolbar.Label>{meals.selected}</Stack.Toolbar.Label>
				{meals.options.map((label) => (
					<Stack.Toolbar.MenuAction
						key={label}
						isOn={label === meals.selected}
						onPress={() => {
							meals.select(label)
						}}
					>
						{label}
					</Stack.Toolbar.MenuAction>
				))}
			</Stack.Toolbar.Menu>
		</Stack.Toolbar>
	)
}

const styles = StyleSheet.create({
	title: {
		alignItems: 'center',
	},
	// The metrics UIKit gives an inline navigation title, since this replaces
	// one rather than sitting beside it.
	name: {
		color: c.label,
		fontSize: 17,
		fontWeight: '600',
	},
	date: {
		color: c.secondaryLabel,
		fontSize: 12,
	},
})
