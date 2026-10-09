import {clientFor} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import bundledFaqs from '../../../docs/faqs.json'
import type {CampusDefinition, CampusId} from '../../campuses'
import {defaultConditionContext, evaluateConditions} from './conditions'
import {parseFaqMetadata} from './schema'
import type {Faq, FaqQueryData, FaqTarget} from './types'

export const keys = {
	/** One list per server; the campuses that read the same server share it. */
	forServer: (server: CampusId) => [server, 'faqs'] as const,
}

/** The server `campus`'s notices come from. */
function serverFor(campus: CampusDefinition): CampusId {
	return campus.faqs?.server ?? campus.id
}

/**
 * Both apps' notices are one list, the one `data/faqs.yaml` publishes; each
 * campus keeps those whose conditions name it, or no campus.
 */
const optionsFor = (campus: CampusDefinition) =>
	queryOptions<unknown, unknown, FaqQueryData>({
		queryKey: keys.forServer(serverFor(campus)),
		queryFn: ({signal}) => clientFor(serverFor(campus)).get('faqs', {signal}).json(),
		select: (raw) => faqsFor(raw, campus),
		enabled: campus.faqs !== undefined,
	})

// Built once per campus, so `select` keeps its identity and runs only when the data changes.
const OPTIONS = new Map<CampusId, ReturnType<typeof optionsFor>>()

/** The FAQs and notices `campus`'s app shows. */
export function faqsOptionsFor(campus: CampusDefinition): ReturnType<typeof optionsFor> {
	let options = OPTIONS.get(campus.id)
	if (!options) {
		options = optionsFor(campus)
		OPTIONS.set(campus.id, options)
	}
	return options
}

/** What `campus`'s FAQ screen shows before its data arrives: the copy bundled with the app. */
export function emptyFaqDataFor(campus: CampusDefinition): FaqQueryData {
	return faqsFor(bundledFaqs, campus)
}

/** The notices in `raw` that `campus`'s app shows, falling back on the bundled copy's. */
export function faqsFor(raw: unknown, campus: CampusDefinition): FaqQueryData {
	if (!campus.faqs) {
		return {faqs: [], legacyText: ''}
	}
	if (!isRecord(raw)) {
		return emptyFaqDataFor(campus)
	}

	let context = {...defaultConditionContext(), campus: campus.id}
	let faqs = Array.isArray(raw.faqs)
		? (raw.faqs as unknown[])
				.map(normalizeFaq)
				.filter(isFaq)
				.filter((faq) => evaluateConditions(faq.conditions, context))
		: []

	if (faqs.length === 0 && raw !== bundledFaqs) {
		faqs = emptyFaqDataFor(campus).faqs
	}

	// The free-form text predates the list, and only a campus that asks shows it.
	let legacyText = ''
	if (campus.faqs.showsLegacyText) {
		legacyText = typeof raw.text === 'string' ? raw.text : bundledFaqs.text
	}

	return {faqs, legacyText}
}

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === 'object' && value !== null
}

function isFaq(value: Faq | null): value is Faq {
	return value !== null
}

function normalizeFaq(value: unknown, index: number): Faq | null {
	if (!isRecord(value)) {
		return null
	}

	let answer = readString(value, ['answer', 'body', 'text'])
	let question = readString(value, ['question', 'title'])

	if (!answer || !question) {
		return null
	}

	let id = readString(value, ['id', 'slug']) ?? slugify(question) ?? `faq-${index.toString()}`

	let metadata = parseFaqMetadata(value)
	let bannerTitle = metadata.bannerTitle || question
	let summary = metadata.bannerText || readString(value, ['summary'])
	let bannerText = summary ?? buildSummary(answer)
	let updatedAt = readString(value, ['updatedAt'])
	let targets = normalizeTargets(value)

	return {
		id,
		question,
		answer,
		targets,
		bannerTitle,
		bannerText,
		severity: metadata.severity,
		icon: metadata.icon,
		backgroundColor: metadata.backgroundColor,
		foregroundColor: metadata.foregroundColor,
		dismissable: metadata.dismissable,
		repeatRule: metadata.repeatRule,
		conditions: metadata.conditions,
		bannerCta: metadata.bannerCta,
		updatedAt,
	}
}

function readString(record: UnknownRecord, fields: string[]): string | undefined {
	for (let key of fields) {
		let raw = record[key]

		if (typeof raw === 'string' && raw.trim().length > 0) {
			return raw
		}
	}

	return undefined
}

function normalizeTargets(record: UnknownRecord): FaqTarget[] {
	let targets: string[] = []

	let arrayTargets = record.targets
	if (Array.isArray(arrayTargets)) {
		for (let value of arrayTargets) {
			if (typeof value === 'string') {
				targets.push(value)
			}
		}
	}

	let screenTargets = record.screens
	if (Array.isArray(screenTargets)) {
		for (let value of screenTargets) {
			if (typeof value === 'string') {
				targets.push(value)
			}
		}
	}

	let singleTarget = record.target
	if (typeof singleTarget === 'string') {
		targets.push(singleTarget)
	}

	return Array.from(new Set(targets)).filter(
		(value): value is FaqTarget => typeof value === 'string',
	)
}

function slugify(value: string): string | undefined {
	let slug = value
		.toLowerCase()
		// oxlint-disable-next-line require-unicode-regexp
		.replaceAll(/[^a-z0-9]+/g, '-')
		// oxlint-disable-next-line require-unicode-regexp
		.replaceAll(/(^-|-$)+/g, '')

	return slug || undefined
}

function stripMarkdown(value: string): string {
	return value
		.replaceAll(/!\[[^\]]*\]\([^)]*\)/gu, '')
		.replaceAll(/\[([^\]]+)\]\(([^)]+)\)/gu, '$1')
		.replaceAll(/[`*_>#]/gu, '')
}

function buildSummary(value: string): string {
	let plain = stripMarkdown(value).replaceAll(/\s+/gu, ' ').trim()

	if (plain.length <= 140) {
		return plain
	}

	return `${plain.slice(0, 137).trimEnd()}…`
}
