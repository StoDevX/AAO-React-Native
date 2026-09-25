import * as React from 'react'

import {NewsScreen} from '../../source/features/news/news-screen'
import {OLAF_MESSENGER} from '../../source/features/news/sources'

export default function MessengerPage(): React.ReactNode {
	return <NewsScreen source={OLAF_MESSENGER} />
}
