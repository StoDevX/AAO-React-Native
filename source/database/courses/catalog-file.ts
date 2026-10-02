import {File, Paths} from 'expo-file-system'

/**
 * Where the downloaded catalog is kept: in Caches, since it can always be
 * downloaded again, so it is neither backed up nor kept when iOS needs the
 * space. A missing file is downloaded on the next refresh.
 */
export function catalogFile(): File {
	return new File(Paths.cache, 'course-catalog.db')
}

/** Where a new catalog lands while it is checked and indexed, before it is swapped in. */
export function incomingCatalogFile(): File {
	return new File(Paths.cache, 'course-catalog.next.db')
}

/** `file` as a plain path, which SQLite's `attach` takes instead of a `file://` URI. */
export function filePath(file: File): string {
	return decodeURIComponent(file.uri.replace(/^file:\/\//u, ''))
}
