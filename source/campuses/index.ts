import type {CampusDefinition} from './definition'
import {carleton} from './edu-carleton'
import {stolaf} from './edu-stolaf'
import {CAMPUS_IDS, type CampusId} from './ids'

export type {CampusDefinition, CampusId}
export {CAMPUS_IDS}

/** Every campus this build knows, in CAMPUS_IDS' order. */
export const CAMPUSES: ReadonlyArray<CampusDefinition> = [stolaf, carleton]

/** A campus id this build doesn't have. */
export class UnknownCampusError extends Error {}

/** Whether `value` is the id of a campus in this build. */
export function isCampusId(value: unknown): value is CampusId {
	return (CAMPUS_IDS as ReadonlyArray<unknown>).includes(value)
}

/** The campus `id` names. */
export function campusById(id: CampusId): CampusDefinition {
	let campus = CAMPUSES.find((candidate) => candidate.id === id)
	if (!campus) {
		throw new UnknownCampusError(`No campus has the id ${id}`)
	}
	return campus
}

/** `value` as a campus id; throws, naming `origin` and the known ids, for any other. */
export function requireCampusId(value: string, origin: string): CampusId {
	if (isCampusId(value)) {
		return value
	}
	let known = CAMPUSES.map((campus) => campus.id).join(', ')
	throw new UnknownCampusError(`${origin} names ${value}, but the campuses are ${known}`)
}

/**
 * The campus a key in published data names: a campus id, or the id the 2.9
 * release candidates published it under (`publishedAs`), which the manifest
 * and map-categories still use until those builds expire. Undefined for any
 * other key, which a reader skips rather than failing on.
 */
export function campusIdFromPublished(key: string): CampusId | undefined {
	return CAMPUSES.find(
		(campus) => campus.id === key || ('publishedAs' in campus && campus.publishedAs === key),
	)?.id
}
