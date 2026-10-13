import * as React from 'react'

import {FrontPageScreen} from '../../source/features/newspaper/front-page-screen'
import {newspaperRoute} from '../../source/features/newspaper/newspaper-route'

function NewspaperPage(): React.ReactNode {
	return <FrontPageScreen />
}

export default newspaperRoute(NewspaperPage)
