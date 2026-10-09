import ky from 'ky'

/// For modules that read ky's errors without depending on ky themselves.
export {isHTTPError} from 'ky'

/// What answers a request instead of the network, under UI tests that name a
/// campus. `next` is the network.
export type FetchInterceptor = (request: Request, next: typeof fetch) => Promise<Response>

let interceptor: FetchInterceptor | null = null

export function setFetchInterceptor(next: FetchInterceptor | null): void {
	interceptor = next
}

/// `fetch`, through the interceptor when one is set. Every campus's client and
/// the data sources' own fetches go through it.
export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
	if (!interceptor) return fetch(input, init)
	return interceptor(new Request(input instanceof URL ? input.href : input, init), fetch)
}

// MARK: Old names, for callers not yet on clientFor

const STOLAF = 'edu.stolaf'
const CARLETON = 'edu.carleton'

/** The old name for `clientFor('edu.stolaf')`. */
export let stolafClient: typeof ky

/** The old name for `clientFor('edu.carleton')`. */
export let carletonClient: typeof ky

// MARK: Campus servers

/// Each campus's server and a client for it, by campus id (`edu.carleton`).
/// Boot registers every campus at its default, then applies any override a
/// developer saved (source/init/api.ts), so a client is there before anything
/// fetches.
let roots = new Map<string, URL>()
let clients = new Map<string, typeof ky>()

/// Points campus `id`'s client at `root`, replacing any it had.
export function registerCampusServer(id: string, root: URL): void {
	let client = ky.create({baseUrl: root, fetch: apiFetch})
	roots.set(id, root)
	clients.set(id, client)
	if (id === STOLAF) stolafClient = client
	if (id === CARLETON) carletonClient = client
}

/// The client for campus `id`'s server. A campus nothing registered throws,
/// naming it and the ones there are, rather than asking some other server.
export function clientFor(id: string): typeof ky {
	let client = clients.get(id)
	if (client === undefined) {
		let known = [...clients.keys()].join(', ') || 'none yet'
		throw new Error(`No server is registered for campus ${id}; registered: ${known}`)
	}
	return client
}

/// Campus `id`'s server, for an address not fetched through `clientFor`, such
/// as an image's `uri`. Undefined until boot registers it.
export function campusRoot(id: string): URL | undefined {
	return roots.get(id)
}

/// Every registered campus's server, by campus id.
export function campusRoots(): Record<string, URL> {
	return Object.fromEntries(roots)
}

/** The old name for `registerCampusServer('edu.stolaf', url)`. */
export function setApiRoot(url: URL): void {
	registerCampusServer(STOLAF, url)
}

/** The old name for `registerCampusServer('edu.carleton', url)`. */
export function setCarletonApiRoot(url: URL): void {
	registerCampusServer(CARLETON, url)
}
