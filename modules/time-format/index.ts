import type {Moment} from 'moment-timezone'
import * as Localization from 'expo-localization'

/**
 * `Intl` accepts a Unicode locale extension that forces the hour cycle
 * independent of the locale's own default -- `en-US-u-hc-h23` renders
 * 24-hour, `ja-JP-u-hc-h12` renders 12-hour. `uses24hourClock` is the one
 * signal `Intl` itself cannot see: on iOS, `Intl.DateTimeFormat(undefined,
 * ...)` resolves its default locale from the preferred-language list, not
 * from the OS's 24-Hour Time switch, so that switch never reaches it on its
 * own -- confirmed on device before this module existed.
 */
export function localeWithHourCycle(languageTag: string, uses24hourClock: boolean | null): string {
	if (uses24hourClock === null) {
		return languageTag
	}
	return `${languageTag}-u-hc-${uses24hourClock ? 'h23' : 'h12'}`
}

/**
 * The device's own locale doesn't change mid-session, so this is computed
 * once and kept -- matching what the formatter cache below already assumes.
 */
let cachedDeviceLocale: string | undefined

function deviceLocale(): string {
	if (cachedDeviceLocale === undefined) {
		let [locale] = Localization.getLocales()
		let [calendar] = Localization.getCalendars()
		cachedDeviceLocale = localeWithHourCycle(locale.languageTag, calendar.uses24hourClock)
	}
	return cachedDeviceLocale
}

/**
 * `Intl.DateTimeFormat` is far more expensive to build than to use, and these
 * are called once per row -- a day of events builds dozens before anything
 * reaches the screen. The set of shapes asked for is tiny and fixed, so they
 * are built once and kept.
 */
const FORMATTERS = new Map<string, Intl.DateTimeFormat>()

function formatterFor(
	shape: string,
	locale: string,
	zone: string | undefined,
	options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
	// Keyed on a name the call site gives rather than on the options object.
	// Stringifying the options would allocate on every lookup, which is the
	// cost this cache exists to avoid.
	let key = `${shape}|${locale}|${zone ?? ''}`
	let cached = FORMATTERS.get(key)

	if (!cached) {
		cached = new Intl.DateTimeFormat(locale, {...options, timeZone: zone})
		FORMATTERS.set(key, cached)
	}

	return cached
}

/**
 * Whether the locale writes a meridiem is a property of the locale, so it is
 * asked once per locale rather than once per time rendered.
 */
const MERIDIEM = new Map<string, boolean>()

/**
 * Whether the locale writes a meridiem, which is also what makes an
 * hour-only time readable: `6 PM` stands on its own, `18` does not.
 */
function hasMeridiem(locale: string): boolean {
	let cached = MERIDIEM.get(locale)

	if (cached === undefined) {
		cached = formatterFor('hour-probe', locale, undefined, {hour: 'numeric'})
			.formatToParts(new Date(0))
			.some((part) => part.type === 'dayPeriod')
		MERIDIEM.set(locale, cached)
	}

	return cached
}

/**
 * `Intl` formats an instant in whatever zone it is told, so a campus-zoned
 * moment must carry its zone across or an off-campus reader sees it shifted.
 * A plain moment has no zone and formats in the device's. A moment converted
 * to UTC with `.utc()` has no explicit zone but offset 0; detect and label it.
 */
function zoneOf(m: Moment): string | undefined {
	let tz = m.tz()
	if (!tz && m.utcOffset() === 0) {
		return 'UTC'
	}
	return tz
}

/**
 * `6 PM`, not `6:00 PM` -- Calendar.app drops `:00` on the hour.
 *
 * Only where there is a meridiem, though. Dropping the minutes in a 24-hour
 * locale leaves a bare `15`, and `From 15 Wednesday, 19 August` does not read
 * as a time at all; those locales keep `15:00`.
 */
export function formatTime(m: Moment, locale: string = deviceLocale()): string {
	let meridiem = hasMeridiem(locale)

	// A 24-hour clock pads the hour -- `06:00`, not `6:00` -- while a 12-hour
	// one does not: `06 AM` is wrong wherever `6 AM` is right.
	let hour = meridiem ? ('numeric' as const) : ('2-digit' as const)
	let bare = m.minutes() === 0 && meridiem
	let options: Intl.DateTimeFormatOptions = bare ? {hour} : {hour, minute: '2-digit'}

	return formatterFor(`time-${hour}-${bare}`, locale, zoneOf(m), options).format(m.toDate())
}

/**
 * A timeline's hour label, e.g. `9 AM` or `09:00`. An hour label is always
 * on the hour, so a 12-hour locale needs no minutes at all -- unlike
 * `formatTime`, which keeps them for a time that might not be.
 */
export function formatHourLabel(m: Moment, locale: string = deviceLocale()): string {
	let meridiem = hasMeridiem(locale)
	let hour = meridiem ? ('numeric' as const) : ('2-digit' as const)
	let options: Intl.DateTimeFormatOptions = meridiem ? {hour} : {hour, minute: '2-digit'}

	return formatterFor(`hour-label-${hour}`, locale, zoneOf(m), options).format(m.toDate())
}

const SHORT_DATE: Intl.DateTimeFormatOptions = {month: 'short', day: 'numeric'}
const LONG_DATE: Intl.DateTimeFormatOptions = {
	weekday: 'long',
	month: 'long',
	day: 'numeric',
	year: 'numeric',
}

/** `Aug 20` or `20 Aug`; `Thursday, August 20, 2026` or `2026年8月20日木曜日`. */
export function formatDate(
	m: Moment,
	style: 'short' | 'long',
	locale: string = deviceLocale(),
): string {
	let options = style === 'long' ? LONG_DATE : SHORT_DATE
	return formatterFor(`date-${style}`, locale, zoneOf(m), options).format(m.toDate())
}

const DATE_TIME: Intl.DateTimeFormatOptions = {dateStyle: 'medium', timeStyle: 'short'}

/**
 * `Aug 20, 2026, 5:30 PM` or `2026/08/20 17:30`. `Intl` owns the order and the
 * punctuation between the two halves, which differ per locale.
 */
export function formatDateTime(m: Moment, locale: string = deviceLocale()): string {
	return formatterFor('date-time', locale, zoneOf(m), DATE_TIME).format(m.toDate())
}

/** `T`, `Thu`, or `Thursday`; `木`, `木`, or `木曜日`. */
export function formatWeekday(
	m: Moment,
	style: 'narrow' | 'short' | 'long',
	locale: string = deviceLocale(),
): string {
	return formatterFor(`weekday-${style}`, locale, zoneOf(m), {weekday: style}).format(m.toDate())
}

const NUMBER_FORMATTERS = new Map<string, Intl.NumberFormat>()

function numberFormatterFor(locale: string): Intl.NumberFormat {
	let cached = NUMBER_FORMATTERS.get(locale)

	if (!cached) {
		cached = new Intl.NumberFormat(locale)
		NUMBER_FORMATTERS.set(locale, cached)
	}

	return cached
}

/**
 * The day of the month in the locale's own digits: `20`, or `٢٠`.
 *
 * Just the number, which is why this counts it rather than formatting a date.
 * A date formatted down to its day writes a marker after the number in several
 * locales -- `20日`, `20일` -- and the day-picker strip has no room for one: it
 * draws the number in a fixed-width circle under a weekday letter that already
 * says what kind of thing it is. Picking the `day` part back out of
 * `formatToParts` looks like the cleaner answer and is not one: it fixes this
 * under Jest and changes nothing on a device, which suggests Hermes hands the
 * marker back inside the `day` part itself rather than as a `literal` beside
 * it. Counting sidesteps the question either way -- a day of the month is a
 * number, and `Intl.NumberFormat` writes a number in the locale's digits and
 * nothing else.
 */
export function formatDayOfMonth(m: Moment, locale: string = deviceLocale()): string {
	return numberFormatterFor(locale).format(m.date())
}
