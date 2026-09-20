import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {Stack} from 'expo-router'
import * as c from '@frogpond/colors'
import {Host, HStack, Image, Menu, Section, Text as UIText, Toggle, VStack} from '@expo/ui/swift-ui'
import {
	background,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	minimumScaleFactor,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import type {MealHeaderOption, MealMenuSelection} from '@frogpond/food-menu'

/**
 * What a menu screen puts in its navigation bar: the cafe it is showing, the
 * day it is showing, and the meal picker.
 *
 * `date` is `null` for a screen that shows no single day, and `meals` is `null`
 * for a cafe that serves one meal -- or for a screen with no menu on it at all,
 * like the Carleton chooser.
 *
 * `time` is the window the meal on screen is served, e.g. `11AM–1:30PM`, and is
 * `null` for a cafe whose menu carries no hours. It rides beside `meals` rather
 * than inside it because a cafe serving one meal has no picker and hours all
 * the same.
 *
 * The date arrives already formatted. `now` is a fresh `Moment` on every render
 * of the screens that publish this, so a `Moment` here would republish on every
 * render and loop through the provider's state.
 */
type MenuHeader = {
	name: string
	date: string | null
	time: string | null
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
	let {name, date, time, meals, filters} = header

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
				time,
				meals,
				filters:
					toggleFilters && filtersVisible !== null
						? {visible: filtersVisible, toggle: toggleFilters}
						: null,
			})
		}
	}, [focused, name, date, time, meals, filtersVisible, toggleFilters, publish])
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
					<MealMenuTitle
						date={header.date}
						meals={header.meals}
						name={header.name}
						time={header.time}
					/>
				) : (
					<MenuHeaderTitle date={header.date} name={header.name} time={header.time} />
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
	time: string | null
	meals: MealMenuSelection
}): React.ReactNode {
	let {name, date, time, meals} = props

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
							<UIText modifiers={SUBTITLE_MODIFIERS}>{subtitle(date, meals.selected, time)}</UIText>
						</VStack>
						<Image modifiers={CHEVRON_MODIFIERS} systemName="chevron.down" />
					</HStack>
				}
			>
				<Section title={meals.title.toUpperCase()}>
					{meals.options.map((option) => (
						<MealOption
							key={option.label}
							onSelect={meals.select}
							option={option}
							selected={option.label === meals.selected}
						/>
					))}
				</Section>
			</Menu>
		</Host>
	)
}

/**
 * One meal in the picker, over the window the cafe serves it in.
 *
 * A `Toggle`'s own `label` draws a single line, so a meal carrying a window
 * hands the control its two lines as children instead -- the first is the
 * title and the second the subtitle, which is how a pull-down row shows a
 * detail. A meal with no window keeps the plain `label`, since an empty
 * second line is a row the menu spaces for and nothing fills.
 */
function MealOption(props: {
	option: MealHeaderOption
	selected: boolean
	onSelect: (label: string) => void
}): React.ReactNode {
	let {option, selected, onSelect} = props

	let onIsOnChange = (isOn: boolean) => {
		if (isOn) {
			onSelect(option.label)
		}
	}

	if (!option.time) {
		return <Toggle isOn={selected} label={option.label} onIsOnChange={onIsOnChange} />
	}

	return (
		<Toggle isOn={selected} onIsOnChange={onIsOnChange}>
			<UIText>{option.label}</UIText>
			<UIText>{option.time}</UIText>
		</Toggle>
	)
}

function MenuHeaderTitle(props: {
	name: string
	date: string | null
	time: string | null
}): React.ReactNode {
	let {name, date, time} = props
	let detail = subtitle(date, time)

	return (
		<View
			accessibilityLabel={[name, date, time && spokenTime(time)].filter(Boolean).join(', ')}
			accessibilityRole="header"
			accessible={true}
			style={styles.title}
		>
			<Text maxFontSizeMultiplier={TITLE_SCALE_LIMIT} numberOfLines={1} style={styles.name}>
				{name}
			</Text>
			{detail ? (
				<Text maxFontSizeMultiplier={TITLE_SCALE_LIMIT} numberOfLines={1} style={styles.date}>
					{detail}
				</Text>
			) : null}
		</View>
	)
}

/** The line under the cafe's name, e.g. `Thu, Sep 20 • Lunch • 11AM–1:30PM`. */
function subtitle(...parts: (string | null)[]): string {
	return parts.filter(Boolean).join(' • ')
}

/**
 * The window as VoiceOver should hear it. Read aloud, the dash in
 * `11AM–1:30PM` is either silence or the word "dash".
 */
function spokenTime(time: string): string {
	return time.replace('–', ' to ')
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
// The subtitle shrinks rather than truncates: it carries three facts at the
// largest accessibility type sizes, and a clipped one reads as a different
// time rather than as a missing one.
const SUBTITLE_MODIFIERS = [
	font({textStyle: 'caption'}),
	foregroundStyle(c.secondaryLabel),
	lineLimit(1),
	minimumScaleFactor(0.7),
]

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
	// The subtitle now carries the day, the meal and the window it is served
	// in -- `Thu, Sep 20 • Lunch • 11AM–1:30PM` -- which is the longest line
	// the bar has to hold, and wider than the longest cafe name above it.
	// Past this the back button and the filter button either side start to
	// crowd, so the subtitle scales itself down instead (see
	// `SUBTITLE_MODIFIERS`); the name still clips rather than shrinks, since a
	// navigation bar keeps its height whatever it is asked to hold.
	menuHost: {
		width: 260,
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
