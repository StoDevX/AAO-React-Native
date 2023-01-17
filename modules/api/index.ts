import ky from 'ky'

export let client: typeof ky

export function setApiRoot(url: URL): void {
	client = ky.create({prefixUrl: url})
}
