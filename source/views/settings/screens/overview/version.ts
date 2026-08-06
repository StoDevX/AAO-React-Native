/**
 * Render a version the way iOS does, as "2.8.0 (17)".
 *
 * Kept free of native imports so it stays testable; the caller reads the values
 * from `expo-application`.
 *
 * `@frogpond/constants` reads package.json instead, and its `appBuild()` looks
 * for the part after a `+` in the version string. Our versions have never had
 * one, so the build number was always undefined and this cell never showed it.
 */
export function formatVersion(
	version: string | null,
	build: string | null,
): string {
	if (!version) {
		return 'unknown'
	}

	return build ? `${version} (${build})` : version
}
