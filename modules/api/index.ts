import ky from 'ky'

export let client: typeof ky

/// The server the app was pointed at, for URLs that are not fetched through
/// `client`, such as an image's `uri`. Unset until `setApiRoot` has run.
let apiRoot: URL | undefined

export function getApiRoot(): URL | undefined {
	return apiRoot
}

export function setApiRoot(url: URL): void {
	apiRoot = url
	client = ky.create({baseUrl: url})
}

/// Carleton runs its own ccc-server deployment. The map view reads building
/// data from it directly, so it needs a peer of `client` rather than a
/// different path on the St. Olaf server.
export let carletonClient: typeof ky

export function setCarletonApiRoot(url: URL): void {
	carletonClient = ky.create({baseUrl: url})
}
