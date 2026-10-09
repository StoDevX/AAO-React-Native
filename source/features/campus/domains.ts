import type {Campus} from './store'

/** Each campus by its domain, which names it outside the app's own code. */
export const CAMPUS_DOMAINS: Readonly<Record<Campus, string>> = {
	stolaf: 'stolaf.edu',
	carleton: 'carleton.edu',
}

/** A domain no campus here has. */
export class UnknownCampusError extends Error {}

/** The campus `domain` names, or undefined for one no campus here has. */
export function campusForDomain(domain: string): Campus | undefined {
	return (Object.entries(CAMPUS_DOMAINS) as Array<[Campus, string]>).find(
		([, known]) => known === domain,
	)?.[0]
}

/** The campus `domain` names; throws for one no campus here has. */
export function campusFromDomain(domain: string): Campus {
	let campus = campusForDomain(domain)
	if (!campus) {
		let known = Object.values(CAMPUS_DOMAINS).join(', ')
		throw new UnknownCampusError(`No campus has the domain ${domain}; the campuses are ${known}`)
	}
	return campus
}
