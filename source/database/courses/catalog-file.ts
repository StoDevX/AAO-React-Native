import * as Sentry from '@sentry/react-native'
import {File, Paths} from 'expo-file-system'

/**
 * Where the downloaded catalog is kept: in Caches, since it can always be
 * downloaded again, so it is neither backed up nor kept when iOS needs the
 * space. A missing file is downloaded on the next refresh.
 */
export function catalogFile(): File {
	return new File(Paths.cache, 'course-catalog.db')
}

/**
 * Deletes the downloaded catalog if there is one. Never throws: the catalog
 * is a cache, and the next refresh replaces it, so a failure is only
 * reported.
 */
export function deleteCatalogFile(): void {
	try {
		let file = catalogFile()
		if (file.exists) file.delete()
	} catch (error) {
		Sentry.captureException(error)
	}
}

/** Where a new catalog lands while it is checked and indexed, before it is swapped in. */
export function incomingCatalogFile(): File {
	return new File(Paths.cache, 'course-catalog.next.db')
}

/** `file` as a plain path, which SQLite's `attach` takes instead of a `file://` URI. */
export function filePath(file: File): string {
	return decodeURIComponent(file.uri.replace(/^file:\/\//u, ''))
}
