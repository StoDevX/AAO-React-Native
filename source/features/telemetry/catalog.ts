import type {AppIconName} from '../../../images/icons'
import type {CampusId} from '../../campuses'
import type {StationId} from '../streaming/radio/stations'
import type {PlaybackFailureMessage} from '../streaming/radio/playback-diagnostics'

/**
 * A route's file-system pattern, such as `/dictionary/[word]`. Only
 * `routePattern()` makes one. It is text, but text the app ships: route file
 * names, never a value someone typed or chose.
 */
export type RoutePattern = string & {readonly __brand: 'RoutePattern'}

/**
 * The first element of a React Query key, such as `'news'`. Only
 * `queryKeyHead()` makes one. By convention it names a feature, never a
 * parameter.
 */
export type QueryKeyHead = string & {readonly __brand: 'QueryKeyHead'}

/**
 * The title of a public campus calendar event. Only `addToCalendarEvents()`
 * makes one. It is free text, so it may appear only on an anonymous event:
 * one sent with no device ID and a trace of its own, so it can't be joined to
 * anything else a device did. `CatalogKeepsTextAnonymous` enforces that.
 */
export type PublicEventTitle = string & {readonly __brand: 'PublicEventTitle'}

/**
 * A radio show's title, as its station's published schedule names it. Only
 * `showTitle()` makes one. It is free text, so like `PublicEventTitle` it may
 * appear only on an anonymous event: a show is often named after its hosts.
 */
export type ShowTitle = string & {readonly __brand: 'ShowTitle'}

/** Brands a title from a station's schedule, for an anonymous event alone. */
export function showTitle(title: string): ShowTitle {
	return title as ShowTitle
}

/**
 * A map category group's label, such as `'Dining'`. Only `groupsFor()` makes
 * one. It is text the project publishes in data/map-categories.yaml, never
 * text someone typed.
 */
export type MapGroupLabel = string & {readonly __brand: 'MapGroupLabel'}

/**
 * A Home Screen quick action's id, such as `'Stav Menu'`: a tile's title or a
 * café's name, text the app ships. Only the quick-action store makes one, from
 * an id that names a destination.
 */
export type QuickActionId = string & {readonly __brand: 'QuickActionId'}

/** Where a show's bell or Remind Me button was pressed. */
export type ReminderSurface = 'player' | 'full_schedule' | 'show_sheet'

/** The calendar feeds an event can come from; `other` for anything unrecognized. */
export type CalendarSourceId =
	| 'stolaf'
	| 'presence'
	| 'carleton'
	| 'wiki-monkeys'
	| 'ksto-schedule'
	| 'krlx-schedule'
	| 'kmnk-schedule'
	| 'sumo-schedule'
	| 'upcoming-convos'
	| 'other'

/**
 * Marks an anonymous log or metric on its way to Sentry, so `beforeSendLog`
 * and `beforeSendMetric` know to strip the device ID and span link the SDK
 * adds. Removed before sending.
 */
export const ANONYMOUS_MARKER = 'telemetry.anonymous'

/**
 * Every telemetry event the app may send. Adding a question means adding a
 * member here and a `track()` call where it happens.
 *
 * Attribute types must be literal unions, numbers, or one of the branded
 * types above. `CatalogIsClosed` below fails to compile otherwise, which is
 * what keeps search text, names, and other free text out.
 */
export type TelemetryEvent =
	| {name: 'screen.view'; attributes: {route: RoutePattern}}
	| {name: 'calendar.filter.apply'; attributes: {axis: 'category' | 'organization' | 'none'}}
	| {name: 'map.search.empty'; attributes: Record<string, never>}
	| {name: 'map.group.open'; attributes: {group: MapGroupLabel; campus: CampusId}}
	| {name: 'campus.picked'; attributes: {campus: CampusId}}
	| {
			name: 'calendar.add_to_device'
			attributes: {result: 'saved' | 'cancelled' | 'error'; source: CalendarSourceId}
	  }
	| {
			name: 'calendar.event.added'
			anonymous: true
			attributes: {source: CalendarSourceId; title: PublicEventTitle}
	  }
	| {name: 'dictionary.edit.submit'; attributes: Record<string, never>}
	| {
			name: 'app.launch'
			attributes: {
				icon: AppIconName
				links: 'app' | 'safari'
				radio: 'on' | 'off'
				// How many radio shows are followed, and whether their reminders can arrive.
				followed_shows: number
				reminders: 'granted' | 'undetermined' | 'denied'
			}
	  }
	| {name: 'app_icon.change'; attributes: {icon: AppIconName}}
	| {name: 'open_links.change'; attributes: {links: 'app' | 'safari'}}
	| {name: 'radio_player.change'; attributes: {radio: 'on' | 'off'}}
	| {name: 'quick_action.toggle'; attributes: {action: QuickActionId; change: 'add' | 'remove'}}
	| {
			name: 'radio.control'
			attributes: {
				action: 'play' | 'pause' | 'stop'
				station: StationId
				// `system` is Control Center or the lock screen playing a paused station.
				surface: 'bar' | 'sheet' | 'system'
			}
	  }
	| {name: 'radio.station.browse'; attributes: {station: StationId}}
	| {
			name: 'radio.action'
			attributes: {
				action: 'call' | 'chat' | 'schedule' | 'full_schedule' | 'website'
				station: StationId
			}
	  }
	| {name: 'radio.play.error'; attributes: {station: StationId}}
	| {
			name: 'radio.play.failure'
			attributes: {
				station: StationId
				message: PlaybackFailureMessage
				source: 'published' | 'shipped'
				phase: 'startup' | 'after_playback'
				outcome: 'trying_fallback' | 'stopped'
			}
	  }
	// A published stream failed before any audio, and the shipped one was tried instead.
	| {name: 'radio.stream.fallback'; attributes: {station: StationId}}
	// Anonymous, as the show's title may name its hosts. `permission` is iOS's
	// at the follow: a follow without it reaches no one until it is granted.
	| {
			name: 'radio.reminder.follow'
			anonymous: true
			attributes: {
				station: StationId
				title: ShowTitle
				surface: ReminderSurface
				permission: 'granted' | 'undetermined' | 'denied'
			}
	  }
	| {
			name: 'radio.reminder.unfollow'
			anonymous: true
			attributes: {station: StationId; title: ShowTitle; surface: ReminderSurface}
	  }
	// The player opened from a reminder: tapped, or its Listen button, which also plays.
	| {name: 'radio.reminder.open'; attributes: {station: StationId; action: 'tap' | 'listen'}}
	// What the person did with the sheet asking for notifications.
	| {
			name: 'radio.reminder.permission'
			attributes: {outcome: 'granted' | 'denied' | 'not_now' | 'settings'}
	  }
	| {
			name: 'api.failure'
			attributes: {
				source: QueryKeyHead
				kind: 'http' | 'network' | 'timeout' | 'other'
				status: number
			}
	  }

/**
 * Where each event goes. Metrics for anything counted or charted; logs for
 * rare events whose details matter. Each event goes to exactly one.
 */
export const DESTINATIONS: {readonly [N in TelemetryEvent['name']]: 'metric' | 'log'} = {
	'screen.view': 'metric',
	'calendar.filter.apply': 'metric',
	'map.search.empty': 'metric',
	'map.group.open': 'metric',
	'campus.picked': 'metric',
	'calendar.add_to_device': 'metric',
	'calendar.event.added': 'log',
	'dictionary.edit.submit': 'metric',
	'app.launch': 'metric',
	'app_icon.change': 'metric',
	'open_links.change': 'metric',
	'radio_player.change': 'metric',
	'quick_action.toggle': 'metric',
	'radio.control': 'metric',
	'radio.station.browse': 'metric',
	'radio.action': 'metric',
	'radio.play.error': 'metric',
	'radio.play.failure': 'log',
	'radio.stream.fallback': 'metric',
	'radio.reminder.follow': 'metric',
	'radio.reminder.unfollow': 'metric',
	'radio.reminder.open': 'metric',
	'radio.reminder.permission': 'metric',
	'api.failure': 'log',
}

/** The attribute keys of an event whose type accepts any string at all. */
type OpenStringKeys<E> = E extends {attributes: infer A}
	? {[K in keyof A]-?: string extends A[K] ? K : never}[keyof A]
	: never

/** `true` when no event in `E` has an attribute that accepts any string. */
export type IsClosed<E> = [OpenStringKeys<E>] extends [never] ? true : false

/** Compiles only when given `true`. */
export type Expect<T extends true> = T

/**
 * Fails `tsc` if any catalog attribute widens to `string`, with "Type 'false'
 * does not satisfy the constraint 'true'".
 */
export type CatalogIsClosed = Expect<IsClosed<TelemetryEvent>>

/**
 * The attribute keys of an event that hold public free text. The first test
 * keeps `Record<string, never>` out: `never` extends every type.
 */
type PublicTextKeys<E> = E extends {attributes: infer A}
	? {
			[K in keyof A]-?: [A[K]] extends [never]
				? never
				: A[K] extends PublicEventTitle | ShowTitle
					? K
					: never
		}[keyof A]
	: never

/** `true` when every event carrying public free text is marked anonymous. */
export type PublicTextIsAnonymous<E> = [PublicTextKeys<Exclude<E, {anonymous: true}>>] extends [
	never,
]
	? true
	: false

/** Fails `tsc` if an event carries public free text without being anonymous. */
export type CatalogKeepsTextAnonymous = Expect<PublicTextIsAnonymous<TelemetryEvent>>
