import {client} from '@frogpond/api'
import {useQuery, UseQueryResult} from '@tanstack/react-query'
import {fallbackFaqs, fallbackLegacyText} from './local-faqs'
import {evaluateConditions} from './conditions'
import {parseFaqMetadata} from './schema'
import type {Faq, FaqQueryData, FaqTarget} from './types'

export const keys = {
	all: ['faqs'] as const,
}

const emptyData: FaqQueryData = {
	faqs: fallbackFaqs,
	legacyText: fallbackLegacyText,
}

export function useFaqs(): UseQueryResult<FaqQueryData, unknown> {
	return useQuery<unknown, unknown, FaqQueryData>({
		queryKey: keys.all,
		queryFn: ({signal}) => client.get('faqs', {signal}).json(),
		select: normalizeFaqResponse,
	})
}

function normalizeFaqResponse(raw: unknown): FaqQueryData {
	if (!isRecord(raw)) {
		return emptyData
	}

	let faqs = Array.isArray(raw.faqs)
		? (raw.faqs as unknown[])
				.map(normalizeFaq)
				.filter(isFaq)
				.filter((faq) => evaluateConditions(faq.conditions))
		: []

	if (!faqs.length) {
		faqs = fallbackFaqs
	}

	return {
		faqs,
		legacyText: typeof raw.text === 'string' ? raw.text : fallbackLegacyText,
	}
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

	let id =
		readString(value, ['id', 'slug']) ??
		slugify(question) ??
		`faq-${index.toString()}`

	let metadata = parseFaqMetadata(value)
	let bannerTitle = metadata.bannerTitle ?? question
	let summary = metadata.bannerText ?? readString(value, ['summary'])
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
		severity: metadata.severity ?? 'notice',
		icon: metadata.icon,
		backgroundColor: metadata.backgroundColor,
		foregroundColor: metadata.foregroundColor,
		dismissable: metadata.dismissable ?? true,
		repeatRule: metadata.repeatRule,
		conditions: metadata.conditions,
		bannerCta: metadata.bannerCta,
		updatedAt,
	}
}

function readString(
	record: UnknownRecord,
	fields: string[],
): string | undefined {
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
		// eslint-disable-next-line require-unicode-regexp
		.replace(/[^a-z0-9]+/g, '-')
		// eslint-disable-next-line require-unicode-regexp
		.replace(/(^-|-$)+/g, '')

	return slug || undefined
}

function stripMarkdown(value: string): string {
	return (
		value
			// eslint-disable-next-line require-unicode-regexp
			.replace(/!\[[^\]]*]\([^)]*\)/g, '')
			// eslint-disable-next-line require-unicode-regexp
			.replace(/\[([^\]]+)]\(([^)]+)\)/g, '$1')
			// eslint-disable-next-line require-unicode-regexp
			.replace(/[`*_>#]/g, '')
	)
}

function buildSummary(value: string): string {
	// eslint-disable-next-line require-unicode-regexp
	let plain = stripMarkdown(value).replace(/\s+/g, ' ').trim()

	if (plain.length <= 140) {
		return plain
	}

	return `${plain.slice(0, 137).trimEnd()}…`
}

export {emptyData as emptyFaqData}
