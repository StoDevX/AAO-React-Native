import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Stack} from 'expo-router'
import * as c from '@frogpond/colors'
import {Host, HStack, Image, Menu, Section, Text as UIText, Toggle, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityElement,
	accessibilityLabel,
	background,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	minimumScaleFactor,
	redacted,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import type {ModifierConfig} from '@expo/ui/swift-ui/modifiers'
import type {MealHeaderOption, MealMenuSelection} from '@frogpond/food-menu'
import {menuSubtitle, spokenTime} from './lib/header-title'

/**
 * What a menu screen puts in its navigation bar: the cafe it is showing, the
 * day it is showing, and the meal picker.
 *
 * `meals` is `null` for a cafe serving one meal today -- or for a screen with
 * no menu on it at all, like the Carleton chooser.
 *
 * `time` is the window the meal on screen is served, e.g. `11AM – 1:30PM`, and is
 * `null` for a cafe whose menu carries no hours. It rides beside `meals` rather
 * than inside it because a cafe serving one meal has no picker and hours all
 * the same.
 *
 * `closed` is the cafe saying it is not serving. Nothing under the name is
 * true of a cafe that is shut -- not the meal, not a window, not even the day
 * it is shut on -- so the name stands alone.
 *
 * `loading` is the menu still on its way. The clock is ours and the day is
 * already known, so the day is drawn and the rest of the line stands in for
 * itself until it arrives.
 *
 * The day is carried three times because it is drawn at three different
 * lengths: abbreviated under the cafe's name when a meal shares that line,
 * written out when nothing does, and the whole date over the meal picker,
 * which has room for all of it. A screen showing a menu that is not any
 * particular day's -- the Pause, whose menu is a file we keep rather than a
 * day's service -- publishes none of them.
 *
 * All arrive already formatted. `now` is a fresh `Moment` on every render of
 * the screens that publish this, so a `Moment` here would republish on every
 * render and loop through the provider's state.
 */
type MenuHeader = {
	name: string
	weekdayShort: string | null
	weekdayLong: string | null
	date: string | null
	time: string | null
	closed: boolean
	loading: boolean
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
	let {name, weekdayShort, weekdayLong, date, time, closed, loading, meals, filters} = header

	// `filters` is read apart too: a caller building it inline hands over a new
	// object each render, and depending on that object would publish on each
	// one.
	let filtersVisible = filters?.visible ?? null
	let toggleFilters = filters?.toggle ?? null

	React.useEffect(() => {
		if (focused) {
			publish?.({
				name,
				weekdayShort,
				weekdayLong,
				date,
				time,
				closed,
				loading,
				meals,
				filters:
					toggleFilters && filtersVisible !== null
						? {visible: filtersVisible, toggle: toggleFilters}
						: null,
			})
		}
	}, [
		focused,
		name,
		weekdayShort,
		weekdayLong,
		date,
		time,
		closed,
		loading,
		meals,
		filtersVisible,
		toggleFilters,
		publish,
	])
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

	// A cafe that is shut has no day's service to describe, so the name stands
	// alone rather than over a line that has nothing true to put in it.
	let loading = header.loading && !header.closed
	let weekdayLong = header.closed ? null : header.weekdayLong
	let mealName = header.meals?.selected ?? null

	let detail = loading
		? null
		: menuSubtitle({
				weekdayShort: header.closed ? null : header.weekdayShort,
				weekdayLong,
				cafeName: header.name,
				mealName,
				time: header.closed ? null : header.time,
			})

	let subtitle = loading ? <LoadingSubtitle weekday={weekdayLong} /> : <Subtitle detail={detail} />

	// Read as one thing rather than as a name and a line of shorthand. The
	// window is respelled because a dash between two times is read as silence.
	let spoken = [
		header.name,
		loading ? weekdayLong : detail && spokenDetail(detail, header.time),
		loading ? 'Loading' : null,
	]
		.filter(Boolean)
		.join(', ')

	return (
		<>
			{/* `Stack.Title asChild` sets only `headerTitle`; the plain string
			    is what the back button and VoiceOver's fallback read. */}
			<Stack.Screen options={{title: header.name}} />
			<Stack.Title asChild={true}>
				{/* An explicit size rather than `matchContents`: a navigation bar
				    gives its title view no size to match, so a self-sizing host
				    collapses and takes the title with it. */}
				<Host style={styles.menuHost}>
					{header.meals ? (
						<MealMenu date={header.date} meals={header.meals} spoken={spoken}>
							<TitleStack name={header.name} subtitle={subtitle} />
						</MealMenu>
					) : (
						<VStack modifiers={readAsOneTitle(spoken, {isButton: false})}>
							<TitleStack name={header.name} subtitle={subtitle} />
						</VStack>
					)}
				</Host>
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
 * The cafe's name over whatever the screen has to say about the day, which is
 * the whole of the title whether or not it is also a button.
 */
function TitleStack(props: {name: string; subtitle: React.ReactNode}): React.ReactNode {
	return (
		<VStack spacing={0}>
			<UIText modifiers={TITLE_MODIFIERS}>{props.name}</UIText>
			{props.subtitle}
		</VStack>
	)
}

function Subtitle(props: {detail: string | null}): React.ReactNode {
	if (!props.detail) {
		return null
	}

	return <UIText modifiers={SUBTITLE_MODIFIERS}>{props.detail}</UIText>
}

/**
 * The day, and a stand-in for the meal and the window still being fetched.
 *
 * The day is ours -- it comes off the clock rather than off the wire -- so it
 * is drawn for real, and only the part that is actually missing is redacted.
 * `redacted` replaces the text with a capsule the size of the text it was
 * given, so `PENDING_DETAIL` is there to be measured rather than to be read;
 * nothing renders its glyphs.
 *
 * The day is written out in full here for the same reason it is written out
 * whenever no meal shares its line: nothing is named yet.
 */
function LoadingSubtitle(props: {weekday: string | null}): React.ReactNode {
	return (
		<HStack spacing={0}>
			{props.weekday ? (
				<UIText modifiers={SUBTITLE_MODIFIERS}>{`${props.weekday} • `}</UIText>
			) : null}
			<UIText modifiers={PENDING_SUBTITLE_MODIFIERS}>{PENDING_DETAIL}</UIText>
		</HStack>
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
function MealMenu(props: {
	date: string | null
	meals: MealMenuSelection
	spoken: string
	children: React.ReactNode
}): React.ReactNode {
	let {date, meals, spoken, children} = props

	return (
		<Menu
			label={
				<HStack modifiers={readAsOneTitle(spoken, {isButton: true})} spacing={6}>
					{children}
					<Image modifiers={CHEVRON_MODIFIERS} systemName="chevron.down" />
				</HStack>
			}
		>
			{/* The day named in full. The line under the cafe's name carries
			    the weekday alone, so this is where the whole date fits; a
			    screen naming no day falls back to the picker's own title. */}
			<Section title={date ?? meals.title}>
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

/**
 * The subtitle as VoiceOver should hear it: the window respelled, and the
 * bullets the eye reads as separators turned into the pauses the ear needs.
 */
function spokenDetail(detail: string, time: string | null): string {
	let spoken = time ? detail.replace(time, spokenTime(time)) : detail
	return spoken.replaceAll(' • ', ', ')
}

/**
 * The width the missing half of the subtitle stands in for while it loads.
 * Redacted, so this is measured rather than read -- a window is the one thing
 * every loaded subtitle carries, and this is about as wide as one gets.
 */
const PENDING_DETAIL = '00:00AM – 00:00PM'

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
const PENDING_SUBTITLE_MODIFIERS = [...SUBTITLE_MODIFIERS, redacted('placeholder')]

/**
 * The title as VoiceOver meets it: one element reading the name and the line
 * under it together, rather than two the reader has to swipe between.
 *
 * A picker already announces itself as a button, and a control announced as a
 * button *and* a heading is a control VoiceOver describes inconsistently -- so
 * the heading trait goes only on a title that cannot be tapped.
 */
function readAsOneTitle(spoken: string, opts: {isButton: boolean}): ModifierConfig[] {
	return [
		accessibilityElement('combine'),
		accessibilityLabel(spoken),
		...(opts.isButton ? [] : [accessibilityAddTraits(['isHeader'])]),
	]
}

// The disc Shortcuts puts behind its title's chevron, which is what says the
// title is a button rather than a label.
const CHEVRON_MODIFIERS = [
	font({textStyle: 'caption2', weight: 'bold'}),
	foregroundStyle(c.secondaryLabel),
	frame({width: 18, height: 18}),
	background(c.tertiarySystemFill, shapes.circle()),
]

const styles = StyleSheet.create({
	// The host needs a size of its own -- see the comment where it is drawn --
	// and this is the widest the bar can give it without crowding the back
	// button and the filter button either side.
	//
	// The subtitle carries the day, the meal and the window it is served in --
	// `Sun • Lunch • 11AM – 1:30PM` -- which is the longest line the bar has to
	// hold, and wider than the longest cafe name above it. Past this the back
	// button and the filter button either side start to crowd, so the subtitle
	// scales itself down instead (see `SUBTITLE_MODIFIERS`); the name still
	// clips rather than shrinks, since a navigation bar keeps its height
	// whatever it is asked to hold.
	menuHost: {
		width: 260,
		height: 44,
	},
})
