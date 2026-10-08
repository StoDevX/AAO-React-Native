import ky from 'ky'

/// For modules that read ky's errors without depending on ky themselves.
export {isHTTPError} from 'ky'

export let stolafClient: typeof ky

/// The server the app was pointed at, for URLs that are not fetched through
/// `stolafClient`, such as an image's `uri`. Unset until `setApiRoot` has run.
let apiRoot: URL | undefined

export function getApiRoot(): URL | undefined {
	return apiRoot
}

export function setApiRoot(url: URL): void {
	apiRoot = url
	stolafClient = ky.create({baseUrl: url})
}

/// Carleton runs its own ccc-server deployment. The map view reads building
/// data from it directly, so it needs a peer of `stolafClient` rather than a
/// different path on the St. Olaf server.
export let carletonClient: typeof ky

export function setCarletonApiRoot(url: URL): void {
	carletonClient = ky.create({baseUrl: url})
}
