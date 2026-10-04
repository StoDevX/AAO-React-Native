// The decisions behind the release workflow, kept apart from the scripts that
// shell out so they can be tested without git, gh or changesets.

/**
 * A label on the Version Packages pull request that picks the release channel.
 * `prerelease:beta` makes the next release `X.Y.Z-beta.N`; `prerelease:none`
 * leaves prerelease mode for the final `X.Y.Z`.
 */
export const LABEL_PREFIX = 'prerelease:'
export const FINAL_CHANNEL = 'none'

const CHANNEL = /^[a-z][a-z0-9]*$/u

/**
 * The channel the labels ask for: a tag like `beta`, `FINAL_CHANNEL`, or null
 * when no label says. Two channel labels are a mistake worth failing on,
 * rather than picking one at random.
 *
 * @param {string[]} labels
 * @returns {string | null}
 */
export function requestedChannel(labels) {
	let channels = labels
		.filter((label) => label.startsWith(LABEL_PREFIX))
		.map((label) => label.slice(LABEL_PREFIX.length))

	for (let channel of channels) {
		if (!CHANNEL.test(channel)) {
			throw new Error(`"${LABEL_PREFIX}${channel}" is not a channel name (try ${LABEL_PREFIX}beta)`)
		}
	}
	if (channels.length > 1) {
		throw new Error(
			`pick one channel label, found: ${channels.map((c) => LABEL_PREFIX + c).join(', ')}`,
		)
	}
	return channels[0] ?? null
}

/**
 * The tag `.changeset/pre.json` has the repo in right now, or null when it is
 * not in prerelease mode (no file, or `mode: "exit"`).
 *
 * @param {{mode?: string, tag?: string} | null} preState
 * @returns {string | null}
 */
export function currentChannel(preState) {
	return preState?.mode === 'pre' && preState.tag ? preState.tag : null
}

/**
 * The `changeset pre …` commands that bring the repo from its current channel
 * to the requested one. No label means "stay where master is": after a beta
 * merges, the next Version PR is another beta until someone asks for `none`.
 * Changesets will not switch tags in place, so a change of channel exits first.
 *
 * @param {{requested: string | null, current: string | null}} options
 * @returns {string[][]}
 */
export function preCommands({requested, current}) {
	let wanted = requested === FINAL_CHANNEL ? null : (requested ?? current)
	if (wanted === current) {
		return []
	}

	let commands = []
	if (current) {
		commands.push(['pre', 'exit'])
	}
	if (wanted) {
		commands.push(['pre', 'enter', wanted])
	}
	return commands
}

/**
 * The CHANGELOG.md entry Changesets wrote for `version`, for the release notes.
 * Empty when there is none, so the release falls back to no body.
 *
 * @param {string} changelog
 * @param {string} version
 * @returns {string}
 */
export function changelogEntry(changelog, version) {
	let lines = changelog.split('\n')
	let start = lines.findIndex((line) => line.trim() === `## ${version}`)
	if (start === -1) {
		return ''
	}
	let end = lines.findIndex((line, index) => index > start && line.startsWith('## '))
	return lines
		.slice(start + 1, end === -1 ? undefined : end)
		.join('\n')
		.trim()
}

/** Prerelease versions carry a `-tag.N` suffix; Apple's own version drops it. */
export const isPrerelease = (version) => version.includes('-')

/** Xcode Cloud starts a build for tags in this shape. */
export const tagFor = (version) => `v${version}`
