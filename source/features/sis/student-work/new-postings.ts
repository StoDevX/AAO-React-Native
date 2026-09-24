/// The postings on the board now that the student's last visit did not see.
///
/// `seenIds` is `null` until a first visit ends. Marking the whole board new
/// on that first visit would say nothing, so nothing is.
export function newPostingIds(currentIds: string[], seenIds: string[] | null): Set<string> {
	if (seenIds === null) return new Set()

	let seen = new Set(seenIds)
	return new Set(currentIds.filter((id) => !seen.has(id)))
}
