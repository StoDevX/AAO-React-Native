/** Join a course's notes into one line, collapsing the stray whitespace runs the catalog data ships with. */
export function formatCourseNotes(notes: string[]): string {
	return notes.join(' ').replaceAll(/\s+/gu, ' ').trim()
}
