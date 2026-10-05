import type {ContactPersonType, StudentOrgDetailType, StudentOrgType} from './types'

export function showNameOrEmail(c: ContactPersonType): string {
	if (!c.firstName.trim() && !c.lastName.trim()) {
		return `${c.email}`
	}

	return `${c.firstName} ${c.lastName}`
}

/**
 * The org as its detail screen shows it: `/orgs`'s record, with whatever the
 * org's own `/orgs/uri/:uri` record added. Until that arrives, or when a
 * server without the route never sends it, the list's record stands alone.
 */
export function withDetail(
	org: StudentOrgType,
	detail: StudentOrgDetailType | null | undefined,
): StudentOrgDetailType {
	return detail?.organizationUri === org.organizationUri ? {...org, ...detail} : org
}

/** A meeting's place and time, labelled, for the rows that show them. */
export type MeetingRow = {label: string; value: string}

/**
 * Where and when an org meets, as rows. A server older than `meetingLocation`
 * and `meetingTime` sends only `meetings`, the two joined, which stands as one
 * row of its own.
 */
export function meetingRows(org: StudentOrgType): MeetingRow[] {
	let where = org.meetingLocation?.trim() ?? ''
	let when = org.meetingTime?.trim() ?? ''

	if (where || when) {
		return [
			...(where ? [{label: 'Where', value: where}] : []),
			...(when ? [{label: 'When', value: when}] : []),
		]
	}

	// Typed as always present, but a cached record from an older server can lack it.
	let meetings = org.meetings?.trim() ?? ''
	return meetings ? [{label: 'Meets', value: meetings}] : []
}

/** "https://www.instagram.com/stolafchess/" reads as "@stolafchess". */
export function instagramHandle(link: string): string {
	let handle = /instagram\.com\/([^/?#]+)/u.exec(link)?.[1]
	return handle ? `@${handle}` : link
}
