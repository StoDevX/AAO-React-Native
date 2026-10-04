import {fetchManifest, REL_COURSE_CATALOG, resolveSource} from '@frogpond/data-sources'
import * as Sentry from '@sentry/react-native'

import {queryClient} from '../../init/tanstack-query'
import {apiUrl} from '../../lib/api-url'
import {getRunner} from '../client.ts'
import {catalogFile, filePath, incomingCatalogFile} from './catalog-file.ts'
import {checkCatalog} from './check.ts'
import {courseIndexBatches, isAttached, storedEtag, storeEtag} from './index-build.ts'
import {bumpCourseRevision} from './revision.ts'
import {CATALOG_SCHEMA} from './schema.ts'

export const CATALOG_TYPE = 'application/vnd.sqlite3'

/**
 * Where the course catalog course-data-tools publishes nightly is -- every term
 * from five years back -- as the published manifest says, so it can move
 * without a release. A relative address names ccc-server, which is resolved
 * against the configured server; read when a refresh starts, since the server
 * address is a setting read from storage after launch.
 */
async function catalogUrl(): Promise<string> {
	let manifest = await fetchManifest(queryClient)
	let source = resolveSource(manifest, REL_COURSE_CATALOG, 'stolaf', [CATALOG_TYPE])
	return apiUrl(source.href)
}

/** A published catalog that failed its check, and would fail it again. */
export class CatalogRejectedError extends Error {
	etag: string

	constructor(etag: string, reason: string) {
		super(reason)
		this.name = 'CatalogRejectedError'
		this.etag = etag
	}
}

/**
 * Whether a failed refresh is worth trying again: a download can fail for a
 * moment, but a file that failed its check is the same file next time.
 */
export function shouldRetryCatalog(failureCount: number, error: Error): boolean {
	return !(error instanceof CatalogRejectedError) && failureCount < 3
}

/** Lets the app handle whatever is waiting, such as a gesture, before carrying on. */
function nextTurn(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0))
}

/** The ETag of the last published file that was rejected, so it is not downloaded again. */
let rejectedEtag: string | null = null

/** The refresh under way, which a second caller joins rather than racing. */
let inFlight: Promise<{etag: string; changed: boolean}> | null = null

/**
 * Brings the stored catalog up to date with the published one. Downloads only
 * when the ETag changed. The new file is checked and indexed while it is
 * still beside the old one, so the swap replaces one complete, searchable
 * file with another. Callers share one refresh at a time: two would download
 * into, attach and move the same file.
 */
export function refreshCatalog(signal?: AbortSignal): Promise<{etag: string; changed: boolean}> {
	inFlight ??= refresh(signal).finally(() => {
		inFlight = null
	})
	return inFlight
}

async function refresh(signal?: AbortSignal): Promise<{etag: string; changed: boolean}> {
	let runner = getRunner()
	let current = catalogFile()
	let stored = current.exists && isAttached(runner, CATALOG_SCHEMA) ? storedEtag(runner) : null

	// One request: the file and the ETag it was published with arrive together,
	// so a republish between two requests cannot pair a new ETag with the old
	// file. Naming both the file in use and one already rejected means the
	// server sends nothing when either is still current: React Native's fetch
	// reads a whole body before it resolves, so asking is the only way to skip
	// a download.
	let known = [stored, rejectedEtag].filter((tag): tag is string => Boolean(tag))
	let response = await fetch(await catalogUrl(), {
		headers: known.length > 0 ? {'If-None-Match': known.join(', ')} : {},
		signal,
	})
	let etag = response.headers.get('etag') ?? ''

	if (etag !== '' && etag === rejectedEtag) {
		throw new CatalogRejectedError(etag, 'The published course catalog was already rejected')
	}
	if (response.status === 304 && stored) return {etag: stored, changed: false}
	if (!response.ok) {
		throw new Error(`The course catalog could not be downloaded (HTTP ${response.status})`)
	}
	if (etag !== '' && etag === stored) {
		return {etag, changed: false}
	}

	let incoming = incomingCatalogFile()
	try {
		if (incoming.exists) incoming.delete()
		incoming.write(new Uint8Array(await response.arrayBuffer()))

		runner.run({sql: 'attach database ? as incoming', params: [filePath(incoming)]})
		try {
			// Only the check says the file itself is bad; a failure building its
			// index, such as a full disk, may not happen next time.
			try {
				checkCatalog(runner, 'incoming')
			} catch (error) {
				rejectedEtag = etag
				throw new CatalogRejectedError(etag, error instanceof Error ? error.message : String(error))
			}
			for (let _indexed of courseIndexBatches(runner, 'incoming')) {
				// One batch at a time is the point: the app runs between them.
				// oxlint-disable-next-line eslint/no-await-in-loop
				await nextTurn()
			}
			storeEtag(runner, 'incoming', etag)
		} finally {
			runner.exec('detach database incoming')
		}

		// Detach, replace and reattach with nothing awaited between them, so no
		// read lands while the catalog is out of reach.
		if (isAttached(runner, CATALOG_SCHEMA)) runner.exec(`detach database ${CATALOG_SCHEMA}`)
		incoming.moveSync(current, {overwrite: true})
		runner.run({sql: `attach database ? as ${CATALOG_SCHEMA}`, params: [filePath(current)]})
	} catch (error) {
		Sentry.captureException(error)
		// A fresh handle: once moved, `incoming` names the catalog itself.
		let leftover = incomingCatalogFile()
		if (leftover.exists) leftover.delete()
		// Put the catalog back in reach if it was detached and is still there.
		if (!isAttached(runner, CATALOG_SCHEMA) && current.exists) {
			runner.run({sql: `attach database ? as ${CATALOG_SCHEMA}`, params: [filePath(current)]})
		}
		throw error
	}

	bumpCourseRevision()
	return {etag, changed: true}
}
