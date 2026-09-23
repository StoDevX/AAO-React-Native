/// The three wage structures St. Olaf pays student workers under: Standard,
/// Non-Standard (food service, CURI, community-based work study, summer camps),
/// and the Office of Student Activities (Lion's Pause, SGA, Programming Board).
export type PayStructure = 'ST' | 'NST' | 'OSA'

/// Within a structure: 1 is entry-level, 2 needs experience, 3 leads.
export type PayTier = 1 | 2 | 3

export type JobCode = {structure: PayStructure; tier: PayTier}

/// A posting's pay code, as "(WS-ST2)". Some add a space before the tier, as
/// "(WS-OSA 1)", and some double the closing paren. `displayTitle` removes
/// exactly what this matches, so a code it cannot read stays in the title.
const JOB_CODE = /\s*\(WS-(ST|NST|OSA)\s*([123])\)+/u

/// What each tier means to a student looking for work.
export const LEVEL_LABELS: Record<PayTier, string> = {1: 'Entry-level', 2: 'Experienced', 3: 'Lead'}

export function jobCode(title: string): JobCode | undefined {
	let match = JOB_CODE.exec(title)
	if (!match) return undefined

	let [, structure, tier] = match
	return {structure: structure as PayStructure, tier: Number(tier) as PayTier}
}

export type JobTerm = 'Academic Year' | 'Fall' | 'Spring' | 'Summer'

/// A term word's optional year, as "Fall 26" or "Summer 2027".
const YEAR = String.raw`(?:\s+\d{2}(?:\d{2})?)?`

/// The term a title opens with, and what it means. Each is its own word, so
/// "Fallout" is not Fall. Spring's `S27` and `Sp27` are read by analogy with
/// fall's `F26`; no live posting has used either yet.
const TERM_PREFIXES: Array<[RegExp, JobTerm]> = [
	[/^AY(?:\s+(?:\d{2}|\d{4})-\d{2})?\s+/u, 'Academic Year'],
	[/^\d{4}-\d{2}\s+/u, 'Academic Year'],
	[new RegExp(String.raw`^(?:F\d{2}|Fall${YEAR})\s+`, 'u'), 'Fall'],
	[new RegExp(String.raw`^(?:Sp?\d{2}|Spring${YEAR})\s+`, 'u'), 'Spring'],
	[new RegExp(String.raw`^Summer${YEAR}\s+`, 'u'), 'Summer'],
]

/// CURI postings name the term in the middle of the title instead.
const ACADEMIC_YEAR = /\bAcademic Year\b/u

export function jobTerm(title: string): JobTerm | undefined {
	let prefixed = TERM_PREFIXES.find(([prefix]) => prefix.test(title))
	if (prefixed) return prefixed[1]

	return ACADEMIC_YEAR.test(title) ? 'Academic Year' : undefined
}

/// The title a student reads: no term prefix, which the Term filter carries,
/// and no pay code, which the row's wage replaces.
export function displayTitle(title: string): string {
	let prefixed = TERM_PREFIXES.find(([prefix]) => prefix.test(title))
	let withoutTerm = prefixed ? title.replace(prefixed[0], '') : title

	return withoutTerm.replace(JOB_CODE, '').trim()
}
