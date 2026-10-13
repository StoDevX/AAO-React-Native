import * as React from 'react'

import {AboutScreen} from '../../source/features/newspaper/about-screen'
import {newspaperRoute} from '../../source/features/newspaper/newspaper-route'

function NewspaperAboutPage(): React.ReactNode {
	return <AboutScreen />
}

export default newspaperRoute(NewspaperAboutPage)
