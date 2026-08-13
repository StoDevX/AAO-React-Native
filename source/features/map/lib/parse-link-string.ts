const LINK_PATTERN = /^(.*)\s<(.*)>$/u

export type ParsedLink = {label: string; href: string}

export function parseLinkString(input: string): ParsedLink {
	let match = LINK_PATTERN.exec(input)
	if (!match) {
		return {label: input, href: ''}
	}
	return {label: match[1], href: match[2]}
}
