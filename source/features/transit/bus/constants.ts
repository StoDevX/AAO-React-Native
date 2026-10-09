import {useCampusSection} from '../../campus/store'

const BUS_FOOTER_HEADLINE = 'Bus routes and times subject to change without notice'

/** The footer under the bus schedules, crediting the app by the campus's name for it. */
export function useBusFooterMessage(): string {
	let {appName} = useCampusSection('branding')
	return [BUS_FOOTER_HEADLINE, `Data collected by the humans of ${appName}`].join('\n\n')
}
