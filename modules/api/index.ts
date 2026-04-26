import ky from 'ky'

export let client: typeof ky
export let carletonClient: typeof ky

export function setApiRoot(url: URL): void {
	client = ky.create({prefix: url})
}

export function setCarletonApiRoot(url: URL): void {
	carletonClient = ky.create({prefix: url})
}
