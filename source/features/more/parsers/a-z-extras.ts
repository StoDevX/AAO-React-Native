import {z} from 'zod'
import {LinkGroup, LinkValue} from '../types'

const STOLAF_BASE_URL = 'https://stolaf.edu'

const RawValueSchema = z.object({label: z.string(), url: z.string()})
const RawGroupSchema = z.object({letter: z.string(), values: z.array(RawValueSchema)})

const StolafAToZSchema = z.object({az_nav: z.object({menu_items: z.array(z.unknown())})})
const AToZExtrasSchema = z.object({data: z.array(z.unknown())})

const UrlSchema = z.url()

/// Upstream entries are hand-maintained and sometimes blank or malformed. A
/// single bad link must not blank the index, so bad entries are dropped rather
/// than thrown on.
function normalizeValues(values: {label: string; url: string}[]): LinkValue[] {
	return values.flatMap(({label, url}) => {
		let formattedLabel = label.trim()
		let formattedUrl = url.trim()

		if (!formattedLabel && !formattedUrl) return []
		if (formattedUrl.startsWith('/')) formattedUrl = `${STOLAF_BASE_URL}${formattedUrl}`

		let parsed = UrlSchema.safeParse(formattedUrl)
		if (!parsed.success || !formattedLabel) return []

		return [{label: formattedLabel, url: parsed.data}]
	})
}

/// The outer shape stays strict: a response missing `az_nav.menu_items` (or
/// `data`) entirely means the source is wrong, and that should throw. Each
/// group is then parsed on its own, so one letter group WordPress can't fully
/// describe doesn't blank the rest of the index the way an all-or-nothing
/// `z.array(...).parse()` would.
///
/// But a non-empty list that drops down to zero groups means the shape
/// changed out from under us, not that one entry was malformed — that must
/// throw rather than render a silently blank index. A genuinely empty list
/// is a legitimate response and stays empty.
///
/// `normalizeValues` drops individual values the same way, with no guard of
/// its own -- a payload where every group parses but every value inside it
/// fails validation would otherwise sail through as N groups of `data: []`,
/// which renders as a silent "No results found." rather than an error. The
/// same rule applies at the value level: input values present, output values
/// zero, throw.
function toGroups(raw: unknown[]): LinkGroup[] {
	let totalInputValues = 0

	let groups = raw.flatMap((item) => {
		let parsed = RawGroupSchema.safeParse(item)
		if (!parsed.success) return []

		let {letter, values} = parsed.data
		totalInputValues += values.length
		return [{title: letter[0] ?? '', data: normalizeValues(values)}]
	})

	if (raw.length > 0 && groups.length === 0) {
		throw new Error('every A–Z group was malformed')
	}

	let totalOutputValues = groups.reduce((sum, group) => sum + group.data.length, 0)
	if (totalInputValues > 0 && totalOutputValues === 0) {
		throw new Error('every A–Z value was malformed')
	}

	return groups
}

export function parseStolafAToZ(body: unknown): LinkGroup[] {
	return toGroups(StolafAToZSchema.parse(body).az_nav.menu_items)
}

export function parseAToZExtras(body: unknown): LinkGroup[] {
	return toGroups(AToZExtrasSchema.parse(body).data)
}
