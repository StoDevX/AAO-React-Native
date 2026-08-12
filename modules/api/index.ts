import ky from 'ky'

export let client: typeof ky

export function setApiRoot(url: URL): void {
	client = ky.create({baseUrl: url})
}

/// Carleton runs its own ccc-server deployment. The map view reads building
/// data from it directly, so it needs a peer of `client` rather than a
/// different path on the St. Olaf server.
export let carletonClient: typeof ky

export function setCarletonApiRoot(url: URL): void {
	carletonClient = ky.create({baseUrl: url})
}
