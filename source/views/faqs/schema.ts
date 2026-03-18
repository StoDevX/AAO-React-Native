import {z} from 'zod'

import {parseConditionInput} from './conditions'
import type {ConditionNode, FaqSeverity, RepeatRule} from './types'

const trimmedString = z.string().trim().min(1)
const optionalTrimmedString = z.string().trim().min(1).optional()

const severitySchema = z
	.union([z.literal('notice'), z.literal('info'), z.literal('alert')])
	.default('notice')

const platformSchema = z.union([
	z.literal('ios'),
	z.literal('android'),
	z.literal('native'),
])

const dateTimeString = z
	.string()
	.trim()
	.pipe(z.string().datetime({offset: true}))

const conditionRuleSchema = z
	.object({
		platform: platformSchema.optional(),
		platforms: z.array(platformSchema).nonempty().optional(),
		versionRange: optionalTrimmedString,
		startDate: dateTimeString.optional(),
		endDate: dateTimeString.optional(),
	})
	.refine(
		(value) =>
			Boolean(
				value.platform ??
					value.platforms?.length ??
					value.versionRange ??
					value.startDate ??
					value.endDate,
			),
		{message: 'Condition rule must include at least one filter'},
	)

type ConditionInput =
	| {and: ConditionInput[]}
	| {or: ConditionInput[]}
	| {not: ConditionInput}
	| z.infer<typeof conditionRuleSchema>

const conditionNodeSchema: z.ZodType<ConditionInput> = z.lazy(() =>
	z.union([
		z.object({
			and: z.array(conditionNodeSchema).min(1),
		}),
		z.object({
			or: z.array(conditionNodeSchema).min(1),
		}),
		z.object({
			not: conditionNodeSchema,
		}),
		conditionRuleSchema,
	]),
)

const conditionsSchema = z.union([
	conditionNodeSchema,
	z.array(conditionNodeSchema).min(1),
])

const metadataSchema = z
	.object({
		bannerTitle: trimmedString,
		bannerText: trimmedString,
		bannerCta: optionalTrimmedString,
		ctaText: optionalTrimmedString,
		severity: severitySchema,
		icon: optionalTrimmedString,
		backgroundColor: optionalTrimmedString,
		foregroundColor: optionalTrimmedString,
		dismissable: z.boolean().default(true),
		repeatInterval: optionalTrimmedString,
		conditions: conditionsSchema.optional(),
	})
	.passthrough()

type MetadataInput = z.infer<typeof metadataSchema>

export type ParsedFaqMetadata = {
	bannerTitle: string
	bannerText: string
	bannerCta?: string
	severity: FaqSeverity
	icon?: string
	backgroundColor?: string
	foregroundColor?: string
	dismissable: boolean
	repeatRule?: RepeatRule
	conditions?: ConditionNode[]
}

const fallbackMetadata: ParsedFaqMetadata = {
	bannerTitle: '',
	bannerText: '',
	severity: 'notice',
	dismissable: true,
}

export function parseFaqMetadata(value: unknown): ParsedFaqMetadata {
	let result = metadataSchema.safeParse(value ?? {})

	if (!result.success) {
		return {...fallbackMetadata}
	}

	let data = result.data

	return {
		bannerTitle: data.bannerTitle,
		bannerText: data.bannerText,
		bannerCta: data.bannerCta ?? data.ctaText,
		severity: data.severity,
		icon: data.icon,
		backgroundColor: data.backgroundColor,
		foregroundColor: data.foregroundColor,
		dismissable: data.dismissable,
		repeatRule: parseRepeatRule(data),
		conditions: parseConditionInput(data.conditions),
	}
}

function parseRepeatRule(data: MetadataInput): RepeatRule | undefined {
	if (data.repeatInterval) {
		return parseRepeatString(data.repeatInterval)
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
