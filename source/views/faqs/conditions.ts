import {Platform} from 'react-native'
import semver from 'semver'
import {appVersion} from '@frogpond/constants'

import type {ConditionNode, ConditionRule, PlatformCondition} from './types'

type ConditionContext = {
	platform: PlatformCondition
	version: string
	now: number
}

const DEFAULT_CONTEXT = (): ConditionContext => ({
	platform: mapPlatform(Platform.OS),
	version: appVersion(),
	now: Date.now(),
})

export function evaluateConditions(
	conditions: ConditionNode[] | undefined,
	context: ConditionContext = DEFAULT_CONTEXT(),
): boolean {
	if (!conditions || conditions.length === 0) {
		return true
	}

	return conditions.some((node) => evaluateConditionNode(node, context))
}

function evaluateConditionNode(
	node: ConditionNode,
	context: ConditionContext,
): boolean {
	switch (node.type) {
		case 'rule':
			return evaluateConditionRule(node.rule, context)
		case 'and':
			return node.children.every((child) =>
				evaluateConditionNode(child, context),
			)
		case 'or':
			return node.children.some((child) =>
				evaluateConditionNode(child, context),
			)
		case 'not':
			return !evaluateConditionNode(node.child, context)
		default:
			return true
	}
}

function evaluateConditionRule(
	rule: ConditionRule,
	context: ConditionContext,
): boolean {
	if (rule.platforms && rule.platforms.length > 0) {
		let matchesPlatform = rule.platforms.some((platform) =>
			platformMatches(platform, context.platform),
		)

		if (!matchesPlatform) {
			return false
		}
	}

	if (rule.versionRange) {
		try {
			if (
				!semver.satisfies(context.version, rule.versionRange, {
					includePrerelease: true,
				})
			) {
				return false
			}
		} catch {
			return false
		}
	}

	if (rule.startDate && context.now < rule.startDate) {
		return false
	}

	if (rule.endDate && context.now > rule.endDate) {
		return false
	}

	return true
}

export function parseConditionInput(
	value: unknown,
): ConditionNode[] | undefined {
	if (!value) {
		return undefined
	}

	let entries = Array.isArray(value) ? value : [value]
	let nodes: ConditionNode[] = []

	for (let entry of entries) {
		let node = parseConditionNode(entry)
		if (node) {
			nodes.push(node)
		}
	}

	return nodes.length > 0 ? nodes : undefined
}

function parseConditionNode(value: unknown): ConditionNode | null {
	if (Array.isArray(value)) {
		let children = value
			.map((child) => parseConditionNode(child))
			.filter(Boolean) as ConditionNode[]

		return children.length ? {type: 'and', children} : null
	}

	if (!isRecord(value)) {
		return null
	}

	if (value.and !== undefined) {
		let children = toArray(value.and)
			.map((child) => parseConditionNode(child))
			.filter(Boolean) as ConditionNode[]

		return children.length ? {type: 'and', children} : null
	}

	if (value.or !== undefined) {
		let children = toArray(value.or)
			.map((child) => parseConditionNode(child))
			.filter(Boolean) as ConditionNode[]

		return children.length ? {type: 'or', children} : null
	}

	if (value.not !== undefined) {
		let child = parseConditionNode(value.not)
		return child ? {type: 'not', child} : null
	}

	let rule = parseRule(value)
	return rule ? {type: 'rule', rule} : null
}

function parseRule(value: Record<string, unknown>): ConditionRule | null {
	let platforms = readPlatforms(value.platform ?? value.platforms)
	let versionRange = readString(value.versionRange)
	let startDate = readDate(value.startDate)
	let endDate = readDate(value.endDate)

	if (
		!platforms?.length &&
		!versionRange &&
		typeof startDate !== 'number' &&
		typeof endDate !== 'number'
	) {
		return null
	}

	return {
		platforms,
		versionRange: versionRange ?? undefined,
		startDate: startDate ?? undefined,
		endDate: endDate ?? undefined,
	}
}

function readPlatforms(value: unknown): PlatformCondition[] | undefined {
	if (!value) {
		return undefined
	}

	let entries = toArray(value)
		.map((item) =>
			typeof item === 'string' ? item.toLowerCase().trim() : null,
		)
		.filter(Boolean) as string[]

	let valid = entries
		.map((entry) => {
			switch (entry) {
				case 'ios':
				case 'android':
				case 'native':
					return entry
				default:
					return null
			}
		})
		.filter(Boolean) as PlatformCondition[]

	return valid.length ? valid : undefined
}

function readString(value: unknown): string | undefined {
	if (typeof value === 'string' && value.trim().length) {
		return value.trim()
	}

	return undefined
}

function readDate(value: unknown): number | undefined {
	if (typeof value !== 'string' || !value.trim()) {
		return undefined
	}

	let timestamp = Date.parse(value)
	return Number.isNaN(timestamp) ? undefined : timestamp
}

function toArray<T>(value: T | T[] | undefined): T[] {
	if (Array.isArray(value)) {
		return value
	}

	if (value === undefined || value === null) {
		return []
	}

	return [value]
}

function isRecord(value: unknown): value is Record<string, any> {
	return typeof value === 'object' && value !== null
}

function platformMatches(
	expected: PlatformCondition,
	actual: PlatformCondition,
) {
	if (expected === 'native') {
		return actual === 'ios' || actual === 'android'
	}

	return expected === actual
}

function mapPlatform(os: typeof Platform.OS): PlatformCondition {
	if (os === 'ios') {
		return 'ios'
	}

	if (os === 'android') {
		return 'android'
	}

	return 'native'
}
