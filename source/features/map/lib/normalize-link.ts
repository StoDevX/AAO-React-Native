import {parseLinkString} from './parse-link-string'
import type {LabelLink, LabelLinkString} from '../types'

export type NormalizedLink = {label: string; href: string}

/**
 * Normalises one department/office/floor/link entry to `{label, href}`.
 *
 * Carleton's ccc-server serves these as `LabelLinkString`s ("Label <url>");
 * St. Olaf's serves the same fields as `LabelLink` objects already split
 * apart. `building-info` renders both campuses through one code path, so this
 * is the boundary where the two shapes become one.
 */
export function normalizeLink(item: LabelLinkString | LabelLink): NormalizedLink {
	return typeof item === 'string' ? parseLinkString(item) : item
}

/** `normalizeLink`, mapped over a field that may be entirely absent. */
export function normalizeLinks(
	items: Array<LabelLinkString | LabelLink> | undefined,
): Array<NormalizedLink> {
	return (items ?? []).map(normalizeLink)
}
