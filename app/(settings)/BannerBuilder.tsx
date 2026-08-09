import * as React from 'react'
import {Stack} from 'expo-router'

import {BannerBuilderView} from '../../source/views/settings/screens/banner-builder'

export default function BannerBuilderPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Banner Builder</Stack.Title>
			<BannerBuilderView />
		</>
	)
}
