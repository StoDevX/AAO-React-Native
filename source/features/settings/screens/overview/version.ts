/**
 * Render a version the way iOS does, as "2.8.0 (17)".
 *
 * Kept free of native imports so it stays testable; the caller reads the values
 * from `expo-application`.
 *
 * The build number comes from the app bundle, not from `@frogpond/constants`,
 * whose `appBuild()` reads the part after a `+` in the package.json version --
 * a separator our versions do not use, so it yields undefined.
 */
export function formatVersion(version: string | null, build: string | null): string {
	if (!version) {
		return 'unknown'
	}

	return build ? `${version} (${build})` : version
}
