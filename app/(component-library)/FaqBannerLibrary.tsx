import * as React from 'react'
import {Stack} from 'expo-router'

import {FaqBannerLibrary} from '../../source/views/settings/screens/overview/component-library/faq-banners'

export default function FaqBannerLibraryPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{presentation: 'card'}} />
			<Stack.Title>FAQ Banners</Stack.Title>
			<FaqBannerLibrary />
		</>
	)
}
