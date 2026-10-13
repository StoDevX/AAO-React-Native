import * as React from 'react'

import {CustomizeScreen} from '../../../source/features/newspaper/customize-screen'
import {newspaperRoute} from '../../../source/features/newspaper/newspaper-route'

function NewspaperCustomizePage(): React.ReactNode {
	return <CustomizeScreen />
}

export default newspaperRoute(NewspaperCustomizePage)
