import * as React from 'react'

import {FrontPageScreen} from '../../source/features/mess/front-page-screen'
import {newspaperRoute} from '../../source/features/mess/newspaper-route'

function NewspaperPage(): React.ReactNode {
	return <FrontPageScreen />
}

export default newspaperRoute(NewspaperPage)
