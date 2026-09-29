/**
 * A route's file-system pattern, such as `/(home)/Dictionary/[word]`. Only
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
 * A map category group's label, such as `'Dining'`. Only `groupsFor()` makes
 * one. It is text the project publishes in data/map-categories.yaml, never
 * text someone typed.
 */
export type MapGroupLabel = string & {readonly __brand: 'MapGroupLabel'}

/** The calendar feeds an event can come from; `other` for anything unrecognized. */
export type CalendarSourceId = 'stolaf' | 'presence' | 'ksto-schedule' | 'krlx-schedule' | 'other'

/**
 * Marks an anonymous log on its way to Sentry, so `beforeSendLog` knows to
 * strip the device ID and span link the SDK adds. Removed before sending.
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
	| {name: 'map.group.open'; attributes: {group: MapGroupLabel; campus: 'stolaf' | 'carleton'}}
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
	'calendar.add_to_device': 'metric',
	'calendar.event.added': 'log',
	'dictionary.edit.submit': 'metric',
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
			[K in keyof A]-?: [A[K]] extends [never] ? never : A[K] extends PublicEventTitle ? K : never
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
