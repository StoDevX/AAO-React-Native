import * as React from 'react'

import {CustomizeScreen} from '../../../source/features/mess/customize-screen'
import {newspaperRoute} from '../../../source/features/mess/newspaper-route'

function NewspaperCustomizePage(): React.ReactNode {
	return <CustomizeScreen />
}

export default newspaperRoute(NewspaperCustomizePage)
