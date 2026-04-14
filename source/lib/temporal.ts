import {Temporal} from 'temporal-polyfill'
export {Temporal}

// ─── Names ───────────────────────────────────────────────────────────────────

const FULL_DAYS = [
	'',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
	'Sunday',
]
const SHORT_DAYS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const TWO_LETTER_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const FULL_MONTHS = [
	'',
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
]
const SHORT_MONTHS = [
	'',
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec',
]

// ─── Now ─────────────────────────────────────────────────────────────────────

export function now(tz?: string): Temporal.ZonedDateTime {
	return Temporal.Now.zonedDateTimeISO(tz)
}

// ─── Format ──────────────────────────────────────────────────────────────────

function ordinal(n: number): string {
	const s = ['th', 'st', 'nd', 'rd']
	const v = n % 100
	return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

function hour12(h: number): number {
	if (h === 0) return 12
	if (h > 12) return h - 12
	return h
}

// Token order: longest first to prevent partial matches
const TOKEN_PATTERN =
	/LLLL|LLL|LL|LTS|LT|YYYY|dddd|MMMM|MMM|ddd|HH|hh|mm|ss|MM|DD|YY|dd|Do|H|h|m|s|M|D|A|a/gu

export function format(dt: Temporal.ZonedDateTime, token: string): string {
	return token.replace(TOKEN_PATTERN, (match) => {
		switch (match) {
			case 'YYYY':
				return String(dt.year).padStart(4, '0')
			case 'YY':
				return String(dt.year % 100).padStart(2, '0')
			case 'MM':
				return String(dt.month).padStart(2, '0')
			case 'M':
				return String(dt.month)
			case 'DD':
				return String(dt.day).padStart(2, '0')
			case 'D':
				return String(dt.day)
			case 'Do':
				return ordinal(dt.day)
			case 'HH':
				return String(dt.hour).padStart(2, '0')
			case 'H':
				return String(dt.hour)
			case 'hh':
				return String(hour12(dt.hour)).padStart(2, '0')
			case 'h':
				return String(hour12(dt.hour))
			case 'mm':
				return String(dt.minute).padStart(2, '0')
			case 'm':
				return String(dt.minute)
			case 'ss':
				return String(dt.second).padStart(2, '0')
			case 's':
				return String(dt.second)
			case 'A':
				return dt.hour < 12 ? 'AM' : 'PM'
			case 'a':
				return dt.hour < 12 ? 'am' : 'pm'
			case 'dddd':
				return FULL_DAYS[dt.dayOfWeek] ?? ''
			case 'ddd':
				return SHORT_DAYS[dt.dayOfWeek] ?? ''
			case 'dd':
				return TWO_LETTER_DAYS[dt.dayOfWeek] ?? ''
			case 'MMMM':
				return FULL_MONTHS[dt.month] ?? ''
			case 'MMM':
				return SHORT_MONTHS[dt.month] ?? ''
			case 'LT': {
				const h = String(hour12(dt.hour))
				const mm = String(dt.minute).padStart(2, '0')
				const ampm = dt.hour < 12 ? 'AM' : 'PM'
				return `${h}:${mm} ${ampm}`
			}
			case 'LTS': {
				const h = String(hour12(dt.hour))
				const mm = String(dt.minute).padStart(2, '0')
				const ss = String(dt.second).padStart(2, '0')
				const ampm = dt.hour < 12 ? 'AM' : 'PM'
				return `${h}:${mm}:${ss} ${ampm}`
			}
			case 'LL':
				return `${FULL_MONTHS[dt.month]} ${dt.day}, ${dt.year}`
			case 'LLL': {
				const h = String(hour12(dt.hour))
				const mm = String(dt.minute).padStart(2, '0')
				const ampm = dt.hour < 12 ? 'AM' : 'PM'
				return `${FULL_MONTHS[dt.month]} ${dt.day}, ${dt.year} ${h}:${mm} ${ampm}`
			}
			case 'LLLL': {
				const h = String(hour12(dt.hour))
				const mm = String(dt.minute).padStart(2, '0')
				const ampm = dt.hour < 12 ? 'AM' : 'PM'
				return `${FULL_DAYS[dt.dayOfWeek]}, ${FULL_MONTHS[dt.month]} ${dt.day}, ${dt.year} ${h}:${mm} ${ampm}`
			}
			default:
				return match
		}
	})
}

// ─── Parsing ─────────────────────────────────────────────────────────────────

/** Parse an ISO date string "YYYY-MM-DD" and return midnight in the given timezone. */
export function parseDate(dateStr: string, tz: string): Temporal.ZonedDateTime {
	return Temporal.PlainDate.from(dateStr).toZonedDateTime({
		timeZone: tz,
		plainTime: Temporal.PlainTime.from('00:00:00'),
	})
}

/** Parse a date string using a moment-compatible format into a ZonedDateTime. */
export function parseDateFormat(
	dateStr: string,
	fmt: string,
	tz: string,
): Temporal.ZonedDateTime {
	// Build a regex from the format tokens
	const PARSE_TOKENS = [
		'YYYY',
		'MMMM',
		'MMM',
		'MM',
		'M',
		'DD',
		'D',
		'HH',
		'H',
		'hh',
		'h',
		'mm',
		'ss',
		'YY',
		'A',
		'a',
	]
	const TOKEN_RE = new RegExp(PARSE_TOKENS.join('|'), 'gu')
	const tokenRegexMap: Record<string, string> = {
		YYYY: '(\\d{4})',
		YY: '(\\d{2})',
		MMMM: '([A-Za-z]+)',
		MMM: '([A-Za-z]+)',
		MM: '(\\d{1,2})',
		M: '(\\d{1,2})',
		DD: '(\\d{1,2})',
		D: '(\\d{1,2})',
		HH: '(\\d{1,2})',
		H: '(\\d{1,2})',
		hh: '(\\d{1,2})',
		h: '(\\d{1,2})',
		mm: '(\\d{1,2})',
		ss: '(\\d{1,2})',
		A: '(AM|PM)',
		a: '(am|pm)',
	}

	// Pre-process: replace [...] literal escapes (like [T]) with escaped literal chars
	const processedFmt = fmt.replace(
		/\[([^\]]*)\]/gu,
		(_match, literal: string) => literal.split('').map(escapeRegex).join(''),
	)

	const capturedTokens: string[] = []
	const regexStr =
		'^' +
		processedFmt
			.replace(TOKEN_RE, (tok) => {
				capturedTokens.push(tok)
				return tokenRegexMap[tok] ?? escapeRegex(tok)
			})
			.replace(/[^()\\[\]{}?*+|^$]/gu, (c) =>
				/[.,\-/ :]/u.test(c) ? escapeRegex(c) : c,
			) +
		'$'

	const match = new RegExp(regexStr, 'u').exec(dateStr)
	if (!match) {
		throw new Error(`parseDateFormat: "${dateStr}" does not match "${fmt}"`)
	}

	let year = 1970,
		month = 1,
		day = 1,
		hour = 0,
		minute = 0,
		second = 0
	let ampm = ''

	capturedTokens.forEach((tok, i) => {
		const val = match[i + 1]
		switch (tok) {
			case 'YYYY':
				year = parseInt(val, 10)
				break
			case 'YY':
				year = 2000 + parseInt(val, 10)
				break
			case 'MMMM': {
				const idx = FULL_MONTHS.indexOf(val)
				if (idx > 0) month = idx
				break
			}
			case 'MMM': {
				const idx = SHORT_MONTHS.indexOf(val)
				if (idx > 0) month = idx
				break
			}
			case 'MM':
			case 'M':
				month = parseInt(val, 10)
				break
			case 'DD':
			case 'D':
				day = parseInt(val, 10)
				break
			case 'HH':
			case 'H':
				hour = parseInt(val, 10)
				break
			case 'hh':
			case 'h':
				hour = parseInt(val, 10)
				break
			case 'mm':
				minute = parseInt(val, 10)
				break
			case 'ss':
				second = parseInt(val, 10)
				break
			case 'A':
			case 'a':
				ampm = val.toLowerCase()
				break
			default:
				break
		}
	})

	// Adjust 12-hour clock
	if (ampm === 'pm' && hour < 12) hour += 12
	if (ampm === 'am' && hour === 12) hour = 0

	return Temporal.PlainDateTime.from({
		year,
		month,
		day,
		hour,
		minute,
		second,
	}).toZonedDateTime(tz)
}

function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
}

/**
 * Parse a time string like "10:30am", "10:30 AM", "1:30pm", "13:30"
 * and set it on the same calendar date as `base` (or today in tz).
 */
export function parseTimeToday(
	timeStr: string,
	tz: string,
	base?: Temporal.ZonedDateTime,
): Temporal.ZonedDateTime {
	const refDate = base ?? Temporal.Now.zonedDateTimeISO(tz)

	// Normalize: "10:30am" / "10:30 AM" / "10:30" / "H:mm" (24h)
	const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/iu.exec(
		timeStr.trim(),
	)
	if (!match) {
		throw new Error(`parseTimeToday: cannot parse time "${timeStr}"`)
	}

	let hour = parseInt(match[1], 10)
	const minute = parseInt(match[2], 10)
	const second = match[3] ? parseInt(match[3], 10) : 0
	const suffix = match[4]?.toLowerCase()

	if (suffix === 'pm' && hour < 12) hour += 12
	if (suffix === 'am' && hour === 12) hour = 0

	return refDate.with({hour, minute, second, millisecond: 0})
}

/** Parse hour/minute components onto today's date in tz. */
export function parseTimeComponents(
	hour: number,
	minute: number,
	tz: string,
	base?: Temporal.ZonedDateTime,
): Temporal.ZonedDateTime {
	const refDate = base ?? Temporal.Now.zonedDateTimeISO(tz)
	return refDate.with({hour, minute, second: 0, millisecond: 0})
}

// ─── Comparison ──────────────────────────────────────────────────────────────

type CompareUnit = 'minute' | 'day' | 'second'

function truncate(dt: Temporal.ZonedDateTime, unit?: CompareUnit) {
	if (!unit) return dt
	if (unit === 'second')
		return dt.with({millisecond: 0, microsecond: 0, nanosecond: 0})
	if (unit === 'minute')
		return dt.with({second: 0, millisecond: 0, microsecond: 0, nanosecond: 0})
	if (unit === 'day')
		return dt.with({
			hour: 0,
			minute: 0,
			second: 0,
			millisecond: 0,
			microsecond: 0,
			nanosecond: 0,
		})
	return dt
}

export function isBefore(
	a: Temporal.ZonedDateTime,
	b: Temporal.ZonedDateTime,
	unit?: CompareUnit,
): boolean {
	return (
		Temporal.ZonedDateTime.compare(truncate(a, unit), truncate(b, unit)) < 0
	)
}

export function isAfter(
	a: Temporal.ZonedDateTime,
	b: Temporal.ZonedDateTime,
	unit?: CompareUnit,
): boolean {
	return (
		Temporal.ZonedDateTime.compare(truncate(a, unit), truncate(b, unit)) > 0
	)
}

export function isSame(
	a: Temporal.ZonedDateTime,
	b: Temporal.ZonedDateTime,
	unit?: CompareUnit,
): boolean {
	return (
		Temporal.ZonedDateTime.compare(truncate(a, unit), truncate(b, unit)) === 0
	)
}

export function isSameOrBefore(
	a: Temporal.ZonedDateTime,
	b: Temporal.ZonedDateTime,
	unit?: CompareUnit,
): boolean {
	return (
		Temporal.ZonedDateTime.compare(truncate(a, unit), truncate(b, unit)) <= 0
	)
}

export function isSameOrAfter(
	a: Temporal.ZonedDateTime,
	b: Temporal.ZonedDateTime,
	unit?: CompareUnit,
): boolean {
	return (
		Temporal.ZonedDateTime.compare(truncate(a, unit), truncate(b, unit)) >= 0
	)
}

/**
 * Check if `dt` is between `start` and `end`.
 * inclusivity: '()' = exclusive, '[)' = inclusive start exclusive end (default),
 * '(]' = exclusive start inclusive end, '[]' = inclusive.
 */
export function isBetween(
	dt: Temporal.ZonedDateTime,
	start: Temporal.ZonedDateTime,
	end: Temporal.ZonedDateTime,
	unit?: CompareUnit,
	inclusivity = '()',
): boolean {
	const [leftInclusive, rightInclusive] = [
		inclusivity[0] === '[',
		inclusivity[1] === ']',
	]
	const afterStart = leftInclusive
		? isSameOrAfter(dt, start, unit)
		: isAfter(dt, start, unit)
	const beforeEnd = rightInclusive
		? isSameOrBefore(dt, end, unit)
		: isBefore(dt, end, unit)
	return afterStart && beforeEnd
}

// ─── Diff ─────────────────────────────────────────────────────────────────────

export function diffInMs(
	a: Temporal.ZonedDateTime,
	b: Temporal.ZonedDateTime,
): number {
	return a.toInstant().epochMilliseconds - b.toInstant().epochMilliseconds
}

export function diffInHours(
	a: Temporal.ZonedDateTime,
	b: Temporal.ZonedDateTime,
): number {
	return diffInMs(a, b) / (1000 * 3600)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function dayOfYear(dt: Temporal.ZonedDateTime): number {
	const jan1 = dt.with({month: 1, day: 1, hour: 0, minute: 0, second: 0})
	return (
		dt
			.toPlainDate()
			.since(jan1.toPlainDate(), {largestUnit: 'day'})
			.total('day') + 1
	)
}

/** Returns 0=Sunday, 1=Monday, …, 6=Saturday (moment-compatible). */
export function dayOfWeekNumber(dt: Temporal.ZonedDateTime): number {
	return dt.dayOfWeek % 7 // Temporal: 1=Mon..7=Sun; 7%7=0
}

/** Returns 'Su','Mo','Tu','We','Th','Fr','Sa' */
export function twoLetterDay(dt: Temporal.ZonedDateTime): string {
	return TWO_LETTER_DAYS[dayOfWeekNumber(dt)] ?? 'Su'
}

// ─── Relative time ───────────────────────────────────────────────────────────

export function relativeTo(
	from: Temporal.ZonedDateTime,
	to: Temporal.ZonedDateTime,
): string {
	const diffMs =
		to.toInstant().epochMilliseconds - from.toInstant().epochMilliseconds
	const absMs = Math.abs(diffMs)
	const future = diffMs > 0

	const absSec = absMs / 1000
	const absMin = absMs / (1000 * 60)
	const absHr = absMs / (1000 * 3600)
	const absDay = absMs / (1000 * 3600 * 24)
	const absMon = absDay / 30.4375

	let label: string
	if (absSec < 45) {
		label = 'a few seconds'
	} else if (absSec < 90) {
		label = 'a minute'
	} else if (absMin < 44.5) {
		label = `${Math.ceil(absMin)} minutes`
	} else if (absMin < 89.5) {
		label = 'an hour'
	} else if (absHr < 21.5) {
		label = `${Math.ceil(absHr)} hours`
	} else if (absHr < 35.5) {
		label = 'a day'
	} else if (absDay < 25.5) {
		label = `${Math.ceil(absDay)} days`
	} else if (absDay < 45) {
		label = 'a month'
	} else if (absDay < 345) {
		label = `${Math.min(11, Math.ceil(absMon))} months`
	} else if (absDay < 547) {
		label = 'a year'
	} else {
		label = `${Math.ceil(absDay / 365)} years`
	}

	return future ? `in ${label}` : `${label} ago`
}

export function fromNow(dt: Temporal.ZonedDateTime): string {
	return relativeTo(Temporal.Now.zonedDateTimeISO(dt.timeZoneId), dt)
}

// ─── Calendar ────────────────────────────────────────────────────────────────

export function calendar(
	dt: Temporal.ZonedDateTime,
	base?: Temporal.ZonedDateTime,
): string {
	const ref = base ?? Temporal.Now.zonedDateTimeISO(dt.timeZoneId)
	const dtDate = dt.toPlainDate()
	const refDate = ref.toPlainDate()
	const diff = dtDate.since(refDate, {largestUnit: 'day'}).total('day')
	const timeStr = format(dt, 'LT')

	if (diff === 0) return `Today at ${timeStr}`
	if (diff === -1) return `Yesterday at ${timeStr}`
	if (diff === 1) return `Tomorrow at ${timeStr}`
	if (diff > -7 && diff < 0) return `${format(dt, 'dddd')} at ${timeStr}`
	return `${dt.month}/${dt.day}/${dt.year}`
}

// ─── Conversion ──────────────────────────────────────────────────────────────

export function toDate(dt: Temporal.ZonedDateTime): Date {
	return new Date(dt.toInstant().epochMilliseconds)
}

export function fromDate(date: Date, tz: string): Temporal.ZonedDateTime {
	return Temporal.Instant.fromEpochMilliseconds(
		date.getTime(),
	).toZonedDateTimeISO(tz)
}

export function fromEpochMs(ms: number, tz: string): Temporal.ZonedDateTime {
	return Temporal.Instant.fromEpochMilliseconds(ms).toZonedDateTimeISO(tz)
}

export function fromTimestamp(
	ts: string | number,
	tz: string,
): Temporal.ZonedDateTime {
	if (typeof ts === 'number') {
		return fromEpochMs(ts, tz)
	}
	// Try ISO string
	try {
		return Temporal.Instant.from(ts).toZonedDateTimeISO(tz)
	} catch {
		// Fall back to Date parsing
		return fromDate(new Date(ts), tz)
	}
}

/** Returns the timezone offset in minutes (positive = west of UTC, matching Date behavior). */
export function getTimezoneOffsetMinutes(dt: Temporal.ZonedDateTime): number {
	return -dt.offsetNanoseconds / (1e9 * 60)
}
