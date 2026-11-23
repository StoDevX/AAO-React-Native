import {useQuery, queryOptions} from '@tanstack/react-query'
import {isDebugBuild} from '@frogpond/constants'
import {fetchManifest, fetchSourceBody, REL_FEATURES, resolveSource} from '@frogpond/data-sources'
import {z} from 'zod'

import {queryClient} from '../init/tanstack-query'

const FEATURES_TYPE = 'application/vnd.frogpond.features+json'
const FEATURES_ID = 'app'
const ONE_HOUR_IN_MS = 1000 * 60 * 60

/**
 * The published `data/features.yaml`, each feature's section left for that
 * feature to read, so one malformed section switches off only its own feature.
 */
export type FeatureSwitches = Readonly<Record<string, unknown>>

const PublishedSwitchesSchema = z.object({data: z.record(z.string(), z.unknown())})

/**
 * The switches in a fetched body, or none when it is not `{data: {...}}`, so a
 * malformed publish turns every feature off. Only a failed request keeps the
 * last answer.
 */
export function parseFeatureSwitches(body: unknown): FeatureSwitches {
	let parsed = PublishedSwitchesSchema.safeParse(body)
	return parsed.success ? parsed.data.data : {}
}

/**
 * Whether this build obeys the published switches. Debug and prerelease builds
 * (which go to TestFlight alone) show every feature and never fetch the file.
 * Read when asked, not when this module loads: the version that marks a
 * prerelease is set by `source/init/constants.ts`, which may load after it.
 */
export function followsFeatureSwitches(): boolean {
	return !isDebugBuild()
}

/**
 * The published switches. Kept through a failed refetch and persisted, so a
 * launch offline keeps the last answer; with none, every feature is off.
 */
export const featureSwitchesOptions = queryOptions({
	queryKey: ['features'] as const,
	queryFn: async ({signal}): Promise<FeatureSwitches> => {
		let manifest = await fetchManifest(queryClient)
		let source = resolveSource(manifest, REL_FEATURES, FEATURES_ID, [FEATURES_TYPE])
		let body = await fetchSourceBody(source.href, signal, 'Features', 'json', source.campus)
		return parseFeatureSwitches(body)
	},
	staleTime: ONE_HOUR_IN_MS,
	meta: {persistAfterFailure: true},
})

function usePublishedFeatureSwitches(): FeatureSwitches | undefined {
	return useQuery(featureSwitchesOptions).data
}

function noFeatureSwitches(): FeatureSwitches | undefined {
	return undefined
}

let chosenHook: (() => FeatureSwitches | undefined) | undefined

/**
 * The published switches, or undefined until they load. The hook behind it is
 * chosen on the first render, after launch has set the version, and kept,
 * since whether a build follows the switches never changes while it runs: a
 * build that ignores them mounts no query, so it never fetches the file and
 * needs no query client.
 */
export function useFeatureSwitches(): FeatureSwitches | undefined {
	chosenHook ??= followsFeatureSwitches() ? usePublishedFeatureSwitches : noFeatureSwitches
	return chosenHook()
}

/** The switches as last fetched, for code outside React. */
export function featureSwitchesNow(): FeatureSwitches | undefined {
	return queryClient.getQueryData(featureSwitchesOptions.queryKey)
}

/**
 * Fetches the switches again now. A failure leaves the cached ones in place,
 * which is what an offline listener should get.
 */
export async function refreshFeatureSwitches(): Promise<void> {
	if (!followsFeatureSwitches()) {
		return
	}
	try {
		await queryClient.query({...featureSwitchesOptions, staleTime: 0})
	} catch {
		// The cached switches stand.
	}
}
