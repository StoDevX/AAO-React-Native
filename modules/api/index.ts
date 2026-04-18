import ky from 'ky'

export let client: typeof ky

export function setApiRoot(url: URL): void {
	let base = url.toString()
	if (!base.endsWith('/')) base += '/'
	client = ky.create({baseUrl: base})
}
