import type {StudentWorkArea} from './areas'
import type {ChosenJobFilters} from './filters'
import {LEVEL_LABELS} from './posting'
import {POSTED_NEW, POSTED_RECENT} from './presets'

const POSTED: Record<string, string> = {recent: POSTED_RECENT, new: POSTED_NEW}
const LEVEL: Record<string, string> = {
	entry: LEVEL_LABELS[1],
	experienced: LEVEL_LABELS[2],
	lead: LEVEL_LABELS[3],
}
const TERM: Record<string, string> = {
	'academic-year': 'Academic Year',
	fall: 'Fall',
	spring: 'Spring',
	summer: 'Summer',
}

function one(value: string | string[] | undefined): string | undefined {
	return Array.isArray(value) ? value[0] : value
}

function pick(table: Record<string, string>, value: string | undefined): string[] | null {
	let title = value === undefined ? undefined : table[value]
	return title === undefined ? null : [title]
}

/// The filters a postings list opens with, from its route. A value it does
/// not know leaves that filter at rest, so a stale link opens the list
/// unfiltered on that axis rather than empty.
export function prefillFromParams(
	params: Record<string, string | string[] | undefined>,
	areas: StudentWorkArea[],
): ChosenJobFilters {
	let areaNames = Object.fromEntries(areas.map((area) => [area.slug, area.name]))
	return {
		area: pick(areaNames, one(params['area'])),
		posted: pick(POSTED, one(params['posted'])),
		level: pick(LEVEL, one(params['level'])),
		term: pick(TERM, one(params['term'])),
	}
}
