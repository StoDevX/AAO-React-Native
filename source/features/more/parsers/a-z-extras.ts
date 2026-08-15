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
function toGroups(raw: unknown[]): LinkGroup[] {
	return raw.flatMap((item) => {
		let parsed = RawGroupSchema.safeParse(item)
		if (!parsed.success) return []

		let {letter, values} = parsed.data
		return [{title: letter[0] ?? '', data: normalizeValues(values)}]
	})
}

export function parseStolafAToZ(body: unknown): LinkGroup[] {
	return toGroups(StolafAToZSchema.parse(body).az_nav.menu_items)
}

export function parseAToZExtras(body: unknown): LinkGroup[] {
	return toGroups(AToZExtrasSchema.parse(body).data)
}
