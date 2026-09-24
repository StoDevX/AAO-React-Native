import {openOrOfferCopy} from './open-or-offer-copy'

type Args = {
	to?: Array<string>
	cc?: Array<string>
	bcc?: Array<string>
	subject?: string
	body?: string
}

export function sendEmail(args: Args): void {
	const {to = []} = args
	const toString = to.join(', ')

	void openOrOfferCopy(formatEmailParts(args), {
		title: "Apologies, we couldn't open an email client",
		message: `We were trying to email "${toString}".`,
		copyLabel: 'Copy addresses',
		copyText: toString,
	})
}

export function formatEmailParts(args: Args): string {
	const {to = [], cc = [], bcc = [], subject = '', body = ''} = args

	// `mailto:` follows RFC 6068, not the `application/x-www-form-urlencoded`
	// convention: `+` is a literal plus sign there, not a decoded space. So this
	// builds the query string with `encodeURIComponent`, which percent-encodes
	// a space as `%20`, instead of `URLSearchParams`, which encodes it as `+`.
	const params: Array<[string, string]> = []

	if (cc.length > 0) {
		params.push(['cc', cc.join(',')])
	}

	if (bcc.length > 0) {
		params.push(['bcc', bcc.join(',')])
	}

	if (subject) {
		params.push(['subject', subject])
	}

	if (body) {
		params.push(['body', body])
	}

	const query = params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')

	return `mailto:${to.join(',')}${query ? `?${query}` : ''}`
}
