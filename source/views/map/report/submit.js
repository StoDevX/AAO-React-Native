// @flow

import {sendEmail} from '../../../components/send-email'
import {GH_NEW_ISSUE_URL} from '../../../lib/constants'

export function submitReport({name, description}: {[key: string]: string}) {
	const body = makeEmailBody({name, description})

	return sendEmail({
		to: ['rives@stolaf.edu'],
		subject: `[carls-map] Suggestion for building ${name}`,
		body,
	})
}

function makeEmailBody({name, description}) {
	return `
Hi! Thanks for letting us know about a map change.

With regards to the building named "${name}", you said:

> ${description}

Please do not change anything below this line.

------------

Project maintainers: ${GH_NEW_ISSUE_URL}
`
}
