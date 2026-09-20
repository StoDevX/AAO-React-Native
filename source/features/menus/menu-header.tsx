import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {Stack} from 'expo-router'
import * as c from '@frogpond/colors'
import {Host, HStack, Image, Menu, Section, Text as UIText, Toggle, VStack} from '@expo/ui/swift-ui'
import {background, font, foregroundStyle, frame, shapes} from '@expo/ui/swift-ui/modifiers'
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
	/** The filter row's own control, or `null` for a screen with no filters. */
	filters: {visible: boolean; toggle: () => void} | null
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
	let {name, date, meals, filters} = header

	// `filters` is read apart too: a caller building it inline hands over a new
	// object each render, and depending on that object would publish on each
	// one.
	let filtersVisible = filters?.visible ?? null
	let toggleFilters = filters?.toggle ?? null

	React.useEffect(() => {
		if (focused) {
			publish?.({
				name,
				date,
				meals,
				filters:
					toggleFilters && filtersVisible !== null
						? {visible: filtersVisible, toggle: toggleFilters}
						: null,
			})
		}
	}, [focused, name, date, meals, filtersVisible, toggleFilters, publish])
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
				{header.meals ? (
					<MealMenuTitle date={header.date} meals={header.meals} name={header.name} />
				) : (
					<MenuHeaderTitle date={header.date} name={header.name} />
				)}
			</Stack.Title>
			{header.filters ? (
				<Stack.Toolbar placement="right">
					<Stack.Toolbar.Button
						accessibilityLabel="Filters"
						icon="line.3.horizontal.decrease"
						onPress={header.filters.toggle}
						selected={header.filters.visible}
					/>
				</Stack.Toolbar>
			) : null}
		</>
	)
}

/**
 * The title as the meal picker: the cafe, the day and meal it is showing, and
 * the chevron that says the whole thing is a button. Shortcuts titles a screen
 * this way when the thing the title names is what the reader can change.
 *
 * A navigation bar cannot draw a button carrying both a label and an image --
 * `UIBarButtonItem` takes one or the other -- so a picker that names its meal
 * *and* shows a chevron has to be a custom view, and the title is the slot
 * that takes one.
 */
function MealMenuTitle(props: {
	name: string
	date: string | null
	meals: MealMenuSelection
}): React.ReactNode {
	let {name, date, meals} = props

	return (
		// An explicit size rather than `matchContents`: a navigation bar gives
		// its title view no size to match, so a self-sizing host collapses and
		// takes the title with it.
		<Host style={styles.menuHost}>
			<Menu
				label={
					<HStack spacing={6}>
						<VStack spacing={0}>
							<UIText modifiers={TITLE_MODIFIERS}>{name}</UIText>
							<UIText modifiers={SUBTITLE_MODIFIERS}>
								{[date, meals.selected].filter(Boolean).join(' • ')}
							</UIText>
						</VStack>
						<Image modifiers={CHEVRON_MODIFIERS} systemName="chevron.down" />
					</HStack>
				}
			>
				<Section title={meals.title.toUpperCase()}>
					{meals.options.map((label) => (
						<Toggle
							key={label}
							isOn={label === meals.selected}
							label={label}
							onIsOnChange={(isOn) => {
								if (isOn) {
									meals.select(label)
								}
							}}
						/>
					))}
				</Section>
			</Menu>
		</Host>
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

/**
 * How far the title may grow with Dynamic Type. A navigation bar keeps its
 * height whatever the text inside it asks for, so past this the two lines
 * would clip rather than scale.
 */
const TITLE_SCALE_LIMIT = 1.4

// A navigation title reads as the screen's name, not as a link, so the name
// keeps the label colour a plain title would have. Only the chevron is tinted.
const TITLE_MODIFIERS = [font({textStyle: 'headline'}), foregroundStyle(c.label)]
const SUBTITLE_MODIFIERS = [font({textStyle: 'caption'}), foregroundStyle(c.secondaryLabel)]

// The disc Shortcuts puts behind its title's chevron, which is what says the
// title is a button rather than a label.
const CHEVRON_MODIFIERS = [
	font({textStyle: 'caption2', weight: 'bold'}),
	foregroundStyle(c.secondaryLabel),
	frame({width: 18, height: 18}),
	background(c.tertiarySystemFill, shapes.circle()),
]

const styles = StyleSheet.create({
	// The host needs a size of its own -- see `MealMenuTitle` -- and this is
	// the widest the bar can give it without crowding the back button and the
	// filter button either side.
	//
	// The longest header the app can draw is Sayles Hill over `Late Night`,
	// which measures 197pt at the largest accessibility type size. A cafe
	// named much longer than that would clip rather than shrink, since a
	// navigation bar keeps its height whatever it is asked to hold.
	menuHost: {
		width: 220,
		height: 44,
	},
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
