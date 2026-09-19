import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {Stack} from 'expo-router'
import * as c from '@frogpond/colors'
import type {MealMenuSelection} from '@frogpond/food-menu'

/**
 * What a menu screen puts in its navigation bar: the cafe it is showing, the
 * day it is showing, and the meal picker.
 *
 * `date` is `null` for a screen that shows no single day, and `meals` is `null`
 * for a cafe that serves one meal -- or for a screen with no menu on it at all,
 * like the Carleton chooser.
 *
 * The date arrives already formatted. `now` is a fresh `Moment` on every render
 * of the screens that publish this, so a `Moment` here would republish on every
 * render and loop through the provider's state.
 */
type MenuHeader = {
	name: string
	date: string | null
	meals: MealMenuSelection | null
}

/**
 * The published header, read by the host alone.
 *
 * Separate from the publisher below so that a publish re-renders only the host.
 * Every cafe tab stays mounted once visited, each hosting a SwiftUI list, and
 * one context carrying both would re-render all of them whenever any one of
 * them published.
 */
const MenuHeaderContext = React.createContext<MenuHeader | null>(null)

/** Writes into the context above. A `useState` setter, so its identity holds. */
const PublishMenuHeaderContext = React.createContext<((header: MenuHeader) => void) | null>(null)

/**
 * Holds the header for whichever menu is on screen.
 *
 * The four St. Olaf cafes are tabs of one stack route, so they share a single
 * navigation bar and cannot each own it. A cafe publishes into this while it
 * holds focus, and the host below draws whatever was published last.
 */
export function MenuHeaderProvider(props: {children: React.ReactNode}): React.ReactNode {
	let [header, setHeader] = React.useState<MenuHeader | null>(null)

	return (
		<PublishMenuHeaderContext.Provider value={setHeader}>
			<MenuHeaderContext.Provider value={header}>{props.children}</MenuHeaderContext.Provider>
		</PublishMenuHeaderContext.Provider>
	)
}

/**
 * Publishes a menu's header while its screen holds focus.
 *
 * `NativeTabs` mounts every tab as soon as Menus opens, so three cafes the
 * reader never asked for are live at any moment; without the gate they would
 * take turns titling the screen.
 *
 * The header is read field by field rather than by identity, so a caller may
 * build it inline. Depending on the object would make an unmemoized caller
 * publish on every render, and publishing sets state that re-renders the
 * caller.
 */
export function usePublishMenuHeader(header: MenuHeader, focused: boolean): void {
	let publish = React.useContext(PublishMenuHeaderContext)
	let {name, date, meals} = header

	React.useEffect(() => {
		if (focused) {
			publish?.({name, date, meals})
		}
	}, [focused, name, date, meals, publish])
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
	let header = React.useContext(MenuHeaderContext)

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

function MenuHeaderTitle(props: {name: string; date: string | null}): React.ReactNode {
	let {name, date} = props

	return (
		<View
			accessibilityLabel={date ? `${name}, ${date}` : name}
			accessibilityRole="header"
			accessible={true}
			style={styles.title}
		>
			<Text maxFontSizeMultiplier={TITLE_SCALE_LIMIT} numberOfLines={1} style={styles.name}>
				{name}
			</Text>
			{date ? (
				<Text maxFontSizeMultiplier={TITLE_SCALE_LIMIT} numberOfLines={1} style={styles.date}>
					{date}
				</Text>
			) : null}
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

/**
 * How far the title may grow with Dynamic Type. A navigation bar keeps its
 * height whatever the text inside it asks for, so past this the two lines
 * would clip rather than scale.
 */
const TITLE_SCALE_LIMIT = 1.4

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
