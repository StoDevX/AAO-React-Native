import type {Moment} from 'moment-timezone'
import {AppState} from 'react-native'
import * as Localization from 'expo-localization'

/**
 * `Intl` accepts a Unicode locale extension that forces the hour cycle
 * independent of the locale's own default -- `en-US-u-hc-h23` renders
 * 24-hour, `ja-JP-u-hc-h12` renders 12-hour. `uses24hourClock` is the one
 * signal `Intl` itself cannot see: on iOS, `Intl.DateTimeFormat(undefined,
 * ...)` resolves its default locale from the preferred-language list, not
 * from the OS's 24-Hour Time switch, so that switch never reaches it on its
 * own -- confirmed on device before this module existed.
 *
 * A BCP47 tag allows only one `-u-` extension, holding as many keywords as
 * it likes -- `expo-localization` can report one already attached (e.g.
 * `ja-JP-u-ca-japanese`, from Settings → Language & Region → Calendar), and
 * appending a second `-u-` block produces an invalid tag that crashes every
 * `Intl.DateTimeFormat` call using it. Extending the existing block instead
 * keeps it valid.
 */
export function localeWithHourCycle(languageTag: string, uses24hourClock: boolean | null): string {
	if (uses24hourClock === null) {
		return languageTag
	}
	let keyword = `hc-${uses24hourClock ? 'h23' : 'h12'}`
	return `${languageTag}-${languageTag.includes('-u-') ? '' : 'u-'}${keyword}`
}

/**
 * `noUncheckedIndexedAccess` is off, so tsc won't flag an empty array here --
 * shouldn't happen on a real device, but a thrown error would poison the
 * memoized result for every future call, so fall back instead of trusting
 * the array has an element.
 */
function computeDeviceLocale(): string {
	let locale = Localization.getLocales()[0]
	let calendar = Localization.getCalendars()[0]
	return localeWithHourCycle(locale?.languageTag ?? 'en-US', calendar?.uses24hourClock ?? null)
}

/** The device's own current zone, e.g. `America/Chicago`. */
function currentDeviceZone(): string {
	return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * The device's own locale doesn't change mid-session, so this is computed
 * once and kept -- matching what `FORMATTERS` below already assumes for
 * everything except zone (see `cachedFormatterZone`).
 */
let cachedDeviceLocale: string | undefined

function deviceLocale(): string {
	if (cachedDeviceLocale === undefined) {
		cachedDeviceLocale = computeDeviceLocale()
	}
	return cachedDeviceLocale
}

/**
 * `Intl.DateTimeFormat` is far more expensive to build than to use, and these
 * are called once per row -- a day of events builds dozens before anything
 * reaches the screen. The set of shapes asked for is tiny and fixed, so they
 * are built once and kept, until `refreshFormattersIfZoneChanged()` below
 * finds the zone has moved out from under them.
 */
const FORMATTERS = new Map<string, Intl.DateTimeFormat>()

/**
 * The zone `FORMATTERS` was actually built against, set on every real cache
 * miss rather than tied to `deviceLocale()` -- a caller that always supplies
 * an explicit locale never touches `deviceLocale()` at all, and this still
 * needs to notice that caller's formatters going stale.
 */
let cachedFormatterZone: string | undefined

function formatterFor(
	shape: string,
	locale: string,
	options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
	// Keyed on a name the call site gives rather than on the options object.
	// Stringifying the options would allocate on every lookup, which is the
	// cost this cache exists to avoid.
	let key = `${shape}|${locale}`
	let cached = FORMATTERS.get(key)

	if (!cached) {
		cachedFormatterZone = currentDeviceZone()
		cached = new Intl.DateTimeFormat(locale, options)
		FORMATTERS.set(key, cached)
	}

	return cached
}

/**
 * `NUMBER_FORMATTERS` and `MERIDIEM` below are both keyed purely by locale,
 * so a locale change is self-correcting for them: a new `deviceLocale()`
 * result makes every lookup start using a new key, and the stale entries
 * just sit unused. `FORMATTERS` is the one exception, since it bakes in
 * whatever zone was active at construction and that is not part of its own
 * key -- zone is the one thing actually worth checking for on resume, and
 * only clearing `FORMATTERS` when it has actually moved, rather than
 * emptying every cache on every resume regardless.
 */
function refreshFormattersIfZoneChanged(): void {
	if (cachedFormatterZone === undefined) {
		// Nothing zone-sensitive has been built yet this session -- no
		// baseline to check against, and nothing cached to invalidate.
		return
	}

	if (currentDeviceZone() === cachedFormatterZone) {
		return
	}

	FORMATTERS.clear()
	cachedFormatterZone = undefined
}

AppState.addEventListener('change', (status) => {
	if (status === 'active') refreshFormattersIfZoneChanged()
})

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
		cached = formatterFor('hour-probe', locale, {hour: 'numeric'})
			.formatToParts(new Date(0))
			.some((part) => part.type === 'dayPeriod')
		MERIDIEM.set(locale, cached)
	}

	return cached
}

/**
 * `6 PM`, not `6:00 PM` -- Calendar.app drops `:00` on the hour.
 *
 * Only where there is a meridiem, though. Dropping the minutes in a 24-hour
 * locale leaves a bare `15`, and `From 15 Wednesday, 19 August` does not read
 * as a time at all; those locales keep `15:00`.
 *
 * `timeZone` renders in a zone other than the device's, for a screen showing
 * a time that belongs somewhere else rather than to the reader. Pass a moment
 * already in that zone: the on-the-hour check below reads the moment's own
 * minutes, and a half-hour-offset zone would disagree with it.
 */
export function formatTime(m: Moment, locale: string = deviceLocale(), timeZone?: string): string {
	let meridiem = hasMeridiem(locale)

	// A 24-hour clock pads the hour -- `06:00`, not `6:00` -- while a 12-hour
	// one does not: `06 AM` is wrong wherever `6 AM` is right.
	let hour = meridiem ? ('numeric' as const) : ('2-digit' as const)
	let bare = m.minutes() === 0 && meridiem
	let shape: Intl.DateTimeFormatOptions = bare ? {hour} : {hour, minute: '2-digit'}
	let options = timeZone ? {...shape, timeZone} : shape

	// The zone joins the cache key: it is baked into the formatter and, unlike
	// the device's own zone, is not what `refreshFormattersIfZoneChanged`
	// watches.
	return formatterFor(`time-${hour}-${bare}-${timeZone ?? 'device'}`, locale, options).format(
		m.toDate(),
	)
}

/**
 * The same time with nothing between the digits and the meridiem: `5:30PM`,
 * `9AM`. For a navigation bar and a pull-down row, where the gap is width
 * there is none of.
 *
 * Squeezed out of `formatTime`'s answer rather than assembled from parts:
 * every locale that writes a meridiem sets it off with a space on one side or
 * the other, and closing that space is the whole of the difference. A
 * 24-hour locale has no space to close and comes back as it went in.
 *
 * `\s` covers the narrow no-break space `Intl` writes in some ICU builds as
 * well as the plain one it writes in others.
 */
export function formatCompactTime(
	m: Moment,
	locale: string = deviceLocale(),
	timeZone?: string,
): string {
	return formatTime(m, locale, timeZone).replaceAll(/\s/gu, '')
}

/** The dash between the ends of a range, spaced so neither end runs into it. */
const RANGE_SEPARATOR = ' – '

/**
 * A span of one day's clock, e.g. `8:30AM – 11:30AM`, `7AM – 6PM` or
 * `08:30 – 11:30`.
 *
 * Each end is written in full. A reader glancing at one is reading one end,
 * not the pair, and an end that borrows its meridiem from the other is an end
 * that cannot be read on its own.
 */
export function formatCompactTimeRange(
	start: Moment,
	end: Moment,
	locale: string = deviceLocale(),
	timeZone?: string,
): string {
	let from = formatCompactTime(start, locale, timeZone)
	let to = formatCompactTime(end, locale, timeZone)

	return `${from}${RANGE_SEPARATOR}${to}`
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

	return formatterFor(`hour-label-${hour}`, locale, options).format(m.toDate())
}

const SHORT_DATE: Intl.DateTimeFormatOptions = {month: 'short', day: 'numeric'}
const MEDIUM_DATE: Intl.DateTimeFormatOptions = {
	weekday: 'short',
	month: 'short',
	day: 'numeric',
}
const LONG_DATE: Intl.DateTimeFormatOptions = {
	weekday: 'long',
	month: 'long',
	day: 'numeric',
	year: 'numeric',
}

const DATE_STYLES: Record<DateStyle, Intl.DateTimeFormatOptions> = {
	short: SHORT_DATE,
	medium: MEDIUM_DATE,
	long: LONG_DATE,
}

type DateStyle = 'short' | 'medium' | 'long'

/**
 * `Aug 20` or `20 Aug`; `Thu, Aug 20` or `8月20日(木)`; `Thursday, August 20,
 * 2026` or `2026年8月20日木曜日`.
 *
 * `Intl` owns the order of the parts and the punctuation between them, which
 * differ per locale -- a weekday joined on by hand would read wrong in half of
 * them.
 */
export function formatDate(m: Moment, style: DateStyle, locale: string = deviceLocale()): string {
	return formatterFor(`date-${style}`, locale, DATE_STYLES[style]).format(m.toDate())
}

const DATE_TIME: Intl.DateTimeFormatOptions = {dateStyle: 'medium', timeStyle: 'short'}

/**
 * `Aug 20, 2026, 5:30 PM` or `2026/08/20 17:30`. `Intl` owns the order and the
 * punctuation between the two halves, which differ per locale.
 */
export function formatDateTime(m: Moment, locale: string = deviceLocale()): string {
	return formatterFor('date-time', locale, DATE_TIME).format(m.toDate())
}

/** `T`, `Thu`, or `Thursday`; `木`, `木`, or `木曜日`. */
export function formatWeekday(
	m: Moment,
	style: 'narrow' | 'short' | 'long',
	locale: string = deviceLocale(),
): string {
	return formatterFor(`weekday-${style}`, locale, {weekday: style}).format(m.toDate())
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
 *
 * Unlike every other export here, this reads the moment's own zone via
 * `.date()` rather than converting to the device's -- harmless today, since
 * its only caller never passes a zoned moment, but worth knowing if that ever
 * changes.
 */
export function formatDayOfMonth(m: Moment, locale: string = deviceLocale()): string {
	return numberFormatterFor(locale).format(m.date())
}
