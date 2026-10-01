import * as Sentry from '@sentry/react-native'
import {File} from 'expo-file-system'

import {getRunner} from '../client.ts'
import type {SqlRunner} from '../sql.ts'
import {catalogFile, filePath, incomingCatalogFile} from './catalog-file.ts'
import {checkCatalog} from './check.ts'
import {CATALOG_SCHEMA} from './fixture.ts'
import {buildCourseIndex, storedEtag, storeEtag} from './index-build.ts'
import {bumpCourseRevision} from './revision.ts'

/** The course catalog course-data-tools publishes nightly: every term from five years back. */
export const CATALOG_URL = 'https://stolaf.dev/course-data/catalog-recent.db'

/** Whether `schema` is attached to `runner`'s connection. */
function isAttached(runner: SqlRunner, schema: string): boolean {
	return runner
		.all<{name: string}>({sql: 'select name from pragma_database_list', params: []})
		.some((row) => row.name === schema)
}

/**
 * Brings the stored catalog up to date with the published one. Downloads only
 * when the ETag changed. The new file is checked and indexed while it is
 * still beside the old one, so the swap replaces one complete, searchable
 * file with another.
 */
export async function refreshCatalog(
	signal?: AbortSignal,
): Promise<{etag: string; changed: boolean}> {
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

	let incoming = incomingCatalogFile()
	try {
		if (incoming.exists) incoming.delete()
		await File.downloadFileAsync(CATALOG_URL, incoming, {idempotent: true})

		runner.run({sql: 'attach database ? as incoming', params: [filePath(incoming)]})
		try {
			checkCatalog(runner, 'incoming')
			buildCourseIndex(runner, 'incoming')
		} finally {
			runner.exec('detach database incoming')
		}

		if (isAttached(runner, CATALOG_SCHEMA)) runner.exec(`detach database ${CATALOG_SCHEMA}`)
		// expo-file-system's move is asynchronous; attaching before it lands opens an empty file.
		await incoming.move(current, {overwrite: true})
		runner.run({sql: `attach database ? as ${CATALOG_SCHEMA}`, params: [filePath(current)]})
		storeEtag(runner, etag)
	} catch (error) {
		Sentry.captureException(error)
		if (incoming.exists) incoming.delete()
		// Put the old file back in reach if it was detached and is still there.
		if (!isAttached(runner, CATALOG_SCHEMA) && current.exists) {
			runner.run({sql: `attach database ? as ${CATALOG_SCHEMA}`, params: [filePath(current)]})
		}
		throw error
	}

	bumpCourseRevision()
	return {etag, changed: true}
}
