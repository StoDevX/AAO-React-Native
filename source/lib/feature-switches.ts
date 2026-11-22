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

/** The switches in a fetched body; throws unless it is `{data: {...}}`. */
export function parseFeatureSwitches(body: unknown): FeatureSwitches {
	return PublishedSwitchesSchema.parse(body).data
}

/**
 * Whether this build obeys the published switches. Debug and prerelease builds
 * (which go to TestFlight alone) show every feature and never fetch the file.
 */
export const followsFeatureSwitches = !isDebugBuild()

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

/**
 * The published switches, or undefined until they load. Chosen once at load,
 * since whether a build follows the switches never changes while it runs: a
 * build that ignores them mounts no query, so it never fetches the file and
 * needs no query client.
 */
export const useFeatureSwitches: () => FeatureSwitches | undefined = followsFeatureSwitches
	? usePublishedFeatureSwitches
	: noFeatureSwitches

/** The switches as last fetched, for code outside React. */
export function featureSwitchesNow(): FeatureSwitches | undefined {
	return queryClient.getQueryData(featureSwitchesOptions.queryKey)
}

/**
 * Fetches the switches again now. A failure leaves the cached ones in place,
 * which is what an offline listener should get.
 */
export async function refreshFeatureSwitches(): Promise<void> {
	if (!followsFeatureSwitches) {
		return
	}
	try {
		await queryClient.query({...featureSwitchesOptions, staleTime: 0})
	} catch {
		// The cached switches stand.
	}
}
