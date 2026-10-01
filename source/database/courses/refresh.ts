import * as Sentry from '@sentry/react-native'
import {File} from 'expo-file-system'

import {getRunner} from '../client.ts'
import type {SqlRunner} from '../sql.ts'
import {catalogFile, filePath, incomingCatalogFile} from './catalog-file.ts'
import {checkCatalog} from './check.ts'
import {buildCourseIndex, storedEtag, storeEtag} from './index-build.ts'
import {bumpCourseRevision} from './revision.ts'
import {CATALOG_SCHEMA} from './schema.ts'

/** The course catalog course-data-tools publishes nightly: every term from five years back. */
export const CATALOG_URL = 'https://stolaf.dev/course-data/catalog-recent.db'

/** Whether `schema` is attached to `runner`'s connection. */
function isAttached(runner: SqlRunner, schema: string): boolean {
	return runner
		.all<{name: string}>({sql: 'select name from pragma_database_list', params: []})
		.some((row) => row.name === schema)
}

/** A published catalog that failed its check or its index build, and would fail again. */
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
 * moment, but a file that was rejected is the same file next time.
 */
export function shouldRetryCatalog(failureCount: number, error: Error): boolean {
	return !(error instanceof CatalogRejectedError) && failureCount < 3
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
	let head = await fetch(CATALOG_URL, {method: 'HEAD', signal})
	if (!head.ok) throw new Error(`The course catalog could not be checked (HTTP ${head.status})`)
	let etag = head.headers.get('etag') ?? ''

	let current = catalogFile()
	if (
		etag !== '' &&
		storedEtag(runner) === etag &&
		current.exists &&
		isAttached(runner, CATALOG_SCHEMA)
	) {
		return {etag, changed: false}
	}
	if (etag !== '' && etag === rejectedEtag) {
		throw new CatalogRejectedError(etag, 'The published course catalog was already rejected')
	}

	let incoming = incomingCatalogFile()
	try {
		if (incoming.exists) incoming.delete()
		await File.downloadFileAsync(CATALOG_URL, incoming, {idempotent: true})

		runner.run({sql: 'attach database ? as incoming', params: [filePath(incoming)]})
		try {
			try {
				checkCatalog(runner, 'incoming')
				buildCourseIndex(runner, 'incoming')
			} catch (error) {
				rejectedEtag = etag
				throw new CatalogRejectedError(etag, error instanceof Error ? error.message : String(error))
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
