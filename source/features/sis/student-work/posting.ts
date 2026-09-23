/// The three wage structures St. Olaf pays student workers under: Standard,
/// Non-Standard (food service, CURI, community-based work study, summer camps),
/// and the Office of Student Activities (Lion's Pause, SGA, Programming Board).
export type PayStructure = 'ST' | 'NST' | 'OSA'

/// Within a structure: 1 is entry-level, 2 needs experience, 3 leads.
export type PayTier = 1 | 2 | 3

export type JobCode = {structure: PayStructure; tier: PayTier}

/// A posting's title ends with its pay code, as "(WS-ST2)". Some add a space
/// before the tier, as "(WS-OSA 1)".
const JOB_CODE = /\(WS-(ST|NST|OSA)\s*([123])\)/u

export function jobCode(title: string): JobCode | undefined {
	let match = JOB_CODE.exec(title)
	if (!match) return undefined

	let [, structure, tier] = match
	return {structure: structure as PayStructure, tier: Number(tier) as PayTier}
}

export type JobTerm = 'Academic Year' | 'Fall' | 'Spring' | 'Summer'

/// The term a title opens with, and what it means. Each is its own word, so
/// "Fallout" is not Fall.
const TERM_PREFIXES: Array<[RegExp, JobTerm]> = [
	[/^AY(?:\s+\d{2}-\d{2})?\s+/u, 'Academic Year'],
	[/^\d{4}-\d{2}\s+/u, 'Academic Year'],
	[/^(?:F\d{2}|Fall)\s+/u, 'Fall'],
	[/^Spring\s+/u, 'Spring'],
	[/^Summer\s+/u, 'Summer'],
]

/// CURI postings name the term in the middle of the title instead.
const ACADEMIC_YEAR = /\bAcademic Year\b/u

export function jobTerm(title: string): JobTerm | undefined {
	let prefixed = TERM_PREFIXES.find(([prefix]) => prefix.test(title))
	if (prefixed) return prefixed[1]

	return ACADEMIC_YEAR.test(title) ? 'Academic Year' : undefined
}

/// A doubled closing paren is a typo some postings carry, and goes too.
const JOB_CODE_SUFFIX = /\s*\(WS-[^)]*\)+\s*$/u

/// The title a student reads: no term prefix, which the Term filter carries,
/// and no pay code, which the row's wage replaces.
export function displayTitle(title: string): string {
	let prefixed = TERM_PREFIXES.find(([prefix]) => prefix.test(title))
	let withoutTerm = prefixed ? title.replace(prefixed[0], '') : title

	return withoutTerm.replace(JOB_CODE_SUFFIX, '')
}
