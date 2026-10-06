/**
 * What the About screen's version row can show, in the order a tap steps
 * through them, as iOS's own About rows do: the version, the build number, and
 * the commit the build came from.
 *
 * A local build's number is its commit's SHA, so a commit that repeats the
 * build number is left out. Kept free of native imports so it stays testable;
 * the caller reads the values from `expo-application` and the app config.
 *
 * The build number comes from the app bundle, not from `@frogpond/constants`,
 * whose `appBuild()` reads the part after a `+` in the package.json version --
 * a separator our versions do not use, so it yields undefined.
 */
export function versionDetails(
	version: string | null,
	build: string | null,
	commit: string | undefined,
): Array<string> {
	let details = [version ?? 'unknown']
	if (build) {
		details.push(build)
	}
	if (commit && commit !== build) {
		details.push(commit)
	}
	return details
}
