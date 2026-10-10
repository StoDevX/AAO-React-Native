import * as React from 'react'

import {AboutScreen} from '../../source/features/mess/about-screen'
import {newspaperRoute} from '../../source/features/mess/newspaper-route'

function NewspaperAboutPage(): React.ReactNode {
	return <AboutScreen />
}

export default newspaperRoute(NewspaperAboutPage)
