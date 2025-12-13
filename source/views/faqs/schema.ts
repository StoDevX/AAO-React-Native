import {z} from 'zod'

import {parseConditionInput} from './conditions'
import type {ConditionNode, FaqSeverity, RepeatRule} from './types'

const severitySchema = z.union([
	z.literal('notice'),
	z.literal('info'),
	z.literal('alert'),
])

const metadataSchema = z
	.object({
		bannerTitle: z.string().optional(),
		bannerText: z.string().optional(),
		bannerCta: z.string().optional(),
		ctaText: z.string().optional(),
		severity: severitySchema.optional(),
		icon: z.string().optional(),
		backgroundColor: z.string().optional(),
		foregroundColor: z.string().optional(),
		dismissable: z.boolean().optional(),
		repeatIfDismissed: z.any().optional(),
		repeatIntervalHours: z.number().positive().optional(),
		repeatIntervalMinutes: z.number().positive().optional(),
		repeatInterval: z.string().optional(),
		conditions: z.any().optional(),
	})
	.partial()

type MetadataInput = z.infer<typeof metadataSchema>

export type ParsedFaqMetadata = {
	bannerTitle?: string
	bannerText?: string
	bannerCta?: string
	severity?: FaqSeverity
	icon?: string
	backgroundColor?: string
	foregroundColor?: string
	dismissable?: boolean
	repeatRule?: RepeatRule
	conditions?: ConditionNode[]
}

export function parseFaqMetadata(value: unknown): ParsedFaqMetadata {
	let result = metadataSchema.safeParse(value ?? {})

	if (!result.success) {
		return {}
	}

	let data = result.data

	return {
		bannerTitle: optionalString(data.bannerTitle),
		bannerText: optionalString(data.bannerText),
		bannerCta: optionalString(data.bannerCta ?? data.ctaText),
		severity: data.severity ?? 'notice',
		icon: optionalString(data.icon),
		backgroundColor: optionalString(data.backgroundColor),
		foregroundColor: optionalString(data.foregroundColor),
		dismissable: data.dismissable ?? true,
		repeatRule: parseRepeatRule(data),
		conditions: parseConditionInput(data.conditions),
	}
}

function optionalString(value: string | undefined): string | undefined {
	if (!value) {
		return undefined
	}

	let trimmed = value.trim()
	return trimmed.length ? trimmed : undefined
}

function parseRepeatRule(data: MetadataInput): RepeatRule | undefined {
	let fromValue = parseRepeatValue(data.repeatIfDismissed)
	if (fromValue) {
		return fromValue
	}

	if (typeof data.repeatIntervalHours === 'number') {
		return {
			intervalMs: data.repeatIntervalHours * 60 * 60 * 1000,
			description: `${data.repeatIntervalHours}h`,
		}
	}

	if (typeof data.repeatIntervalMinutes === 'number') {
		return {
			intervalMs: data.repeatIntervalMinutes * 60 * 1000,
			description: `${data.repeatIntervalMinutes}m`,
		}
	}

	if (data.repeatInterval) {
		return parseRepeatString(data.repeatInterval)
	}

	return undefined
}

function parseRepeatValue(value: unknown): RepeatRule | undefined {
	if (!value) {
		return undefined
	}

	if (typeof value === 'string') {
		return parseRepeatString(value)
	}

	if (!isRecord(value)) {
		return undefined
	}

	if (value.repeat === false) {
		return undefined
	}

	if (typeof value.intervalHours === 'number') {
		return {
			intervalMs: value.intervalHours * 60 * 60 * 1000,
			description: `${value.intervalHours}h`,
		}
	}

	if (typeof value.intervalMinutes === 'number') {
		return {
			intervalMs: value.intervalMinutes * 60 * 1000,
			description: `${value.intervalMinutes}m`,
		}
	}

	if (typeof value.interval === 'string') {
		return parseRepeatString(value.interval)
	}

	return undefined
}

function parseRepeatString(value: string): RepeatRule | undefined {
	let trimmed = value.trim()
	if (!trimmed) {
		return undefined
	}

	let simpleDuration = parseSimpleDuration(trimmed)
	if (simpleDuration) {
		return {
			intervalMs: simpleDuration,
			description: trimmed,
		}
	}

	let isoDuration = parseIsoDuration(trimmed)
	if (isoDuration) {
		return {
			intervalMs: isoDuration,
			description: trimmed,
		}
	}

	return undefined
}

function parseSimpleDuration(value: string): number | undefined {
	let match =
		/^(\d+)\s*(minute|minutes|min|hour|hours|day|days|week|weeks|m|h|d|w)$/iu.exec(
			value,
		)

	if (!match) {
		return undefined
	}

	let amount = Number(match[1])
	let unit = match[2].toLowerCase()

	switch (unit) {
		case 'minute':
		case 'minutes':
		case 'min':
		case 'm':
			return amount * 60 * 1000
		case 'hour':
		case 'hours':
		case 'h':
			return amount * 60 * 60 * 1000
		case 'day':
		case 'days':
		case 'd':
			return amount * 24 * 60 * 60 * 1000
		case 'week':
		case 'weeks':
		case 'w':
			return amount * 7 * 24 * 60 * 60 * 1000
		default:
			return undefined
	}
}

function parseIsoDuration(value: string): number | undefined {
	let match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/iu.exec(
		value,
	)

	if (!match) {
		return undefined
	}

	let days = Number(match[1] ?? 0)
	let hours = Number(match[2] ?? 0)
	let minutes = Number(match[3] ?? 0)
	let seconds = Number(match[4] ?? 0)

	let totalMs =
		days * 24 * 60 * 60 * 1000 +
		hours * 60 * 60 * 1000 +
		minutes * 60 * 1000 +
		seconds * 1000

	return totalMs > 0 ? totalMs : undefined
}

function isRecord(value: unknown): value is Record<string, any> {
	return typeof value === 'object' && value !== null
}
