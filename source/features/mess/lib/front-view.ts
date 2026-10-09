import {MAIN_SECTIONS} from './posts'

/**
 * The Mess front page's view: issues as a grid, or the latest stories, and the section Latest is
 * narrowed to. The section is kept while By Issue shows, so Latest comes back as it was left.
 */
export type MessView = {mode: 'issues' | 'latest'; section: string | null}

const MODES = {issues: 'Issues', latest: 'Latest'} as const

/** What the news filter store keeps for a view: `Issues` or `Latest`, then `:Section` when narrowed. */
export function viewKey(view: MessView): string {
	let mode = MODES[view.mode]
	return view.section ? `${mode}:${view.section}` : mode
}

/**
 * The view a saved key names. Anything else opens By Issue with no section: nothing saved, or a
 * key an installed copy may still hold that names no view, such as `Top` or a section's name.
 */
export function viewOf(
	saved: string | null,
	mainSections: readonly string[] = MAIN_SECTIONS,
): MessView {
	let [mode, ...rest] = (saved ?? '').split(':')
	let section = rest.join(':')
	let known = section === '' ? null : mainSections.includes(section) ? section : undefined
	if (mode === MODES.latest && known !== undefined) return {mode: 'latest', section: known}
	if (mode === MODES.issues && known !== undefined) return {mode: 'issues', section: known}
	return {mode: 'issues', section: null}
}

/**
 * The view a link to the front page names by its `view`, `Issues` or `Latest`, and its `section`,
 * one of the paper's main sections. Null for a link that names no view, so a stray one leaves the
 * remembered view alone.
 */
export function linkedView(
	view: string | undefined,
	section: string | undefined,
	mainSections: readonly string[] = MAIN_SECTIONS,
): MessView | null {
	if (view !== MODES.issues && view !== MODES.latest) return null
	let key = section === undefined ? view : `${view}:${section}`
	let linked = viewOf(key, mainSections)
	return viewKey(linked) === key ? linked : null
}
