// Clean a timestring segment by uppercasing and trimming it.
export function cleanTimestringSegment(segment) {
	const uppercased = segment.toUpperCase()
	const trimmed = uppercased.trim()
	return trimmed
}

const amPmRegex = /([AP])\.?M\.?/i

// Takes a timestring  and turns it into an object with 24-hour time.
// "800-925" => {start: 800, end: 925}
export function findTime(timestring) {
	const cleanedTimestring = timestring.replace(/:/g, '') // 8:00-9:25 => 800-925

	let endsInPM = false
	let startsInAM = false

	// Split the string apart and clean it up.
	let [start, end] = cleanedTimestring
		.split('-')
		.map(cleanTimestringSegment)

	// There are a few courses that both start and end at 00.
	// I've decided that they mean that it's an all-day course.
	if (start === '00' && end === '00') {
		return {start: 0, end: 2359}
	}

	// Grab the AM/PM indicator, if present, and strip it off.
	const am = amPmRegex.exec(start)
	const pm = amPmRegex.exec(end)

	if (am) {
		startsInAM = true
		start = start.substring(0, am.index)
	}

	if (pm) {
		endsInPM = true
		end = end.substring(0, pm.index)
	}

	// Turn the string into integers
	let startTime = parseInt(start, 10)
	let endTime = parseInt(end, 10)

	// ASSERT: There are no courses that end at or before 8am.
	if (endTime <= 800) {
		// 'M 0100-0400'
		endsInPM = true
	}

	// ASSERT: Courses cannot end before they start.
	// Therefore, it must end in the afternoon.
	if (endTime < startTime) {
		// cannot end before it starts
		endsInPM = true
		endTime += 1200
	}

	// ASSERT: In 24-hour time, PM is > 1200.
	if (endsInPM && endTime < 1200) {
		endTime += 1200
	}

	// ASSERT: There are no courses that end in the afternoon,
	// start before 700 hours, and don't start in the morning.
	// COMMENT: uh, what?
	if (endsInPM && startTime < 700 && !startsInAM) {
		startTime += 1200
	}

	// ASSERT: There are no courses that take longer than 10 hours
	// and don't start in the morning.
	if ((endTime - startTime) > 1000 && !startsInAM) {
		// There are no courses that take this long.
		// There are some 6-hour ones in interim, though.
		startTime += 1200
	}

	return {
		start: startTime,
		end: endTime,
	}
}
