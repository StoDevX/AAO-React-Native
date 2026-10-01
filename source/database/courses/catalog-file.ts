import {File, Paths} from 'expo-file-system'

/** Where the downloaded catalog is kept. */
export function catalogFile(): File {
	return new File(Paths.document, 'course-catalog.db')
}

/** Where a new catalog lands while it is checked and indexed, before it is swapped in. */
export function incomingCatalogFile(): File {
	return new File(Paths.document, 'course-catalog.next.db')
}

/** `file` as a plain path, which SQLite's `attach` takes instead of a `file://` URI. */
export function filePath(file: File): string {
	return decodeURIComponent(file.uri.replace(/^file:\/\//u, ''))
}
