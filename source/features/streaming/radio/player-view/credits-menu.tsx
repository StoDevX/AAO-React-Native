import * as React from 'react'
import {Button, Host, Image, Menu} from '@expo/ui/swift-ui'
import {accessibilityLabel, frame} from '@expo/ui/swift-ui/modifiers'
import {openUrl} from '@frogpond/open-url'

import {radioCredits} from '../credits'
import {palette} from './palette'

/**
 * The sheet's About button, which lists each station and opens its site. The
 * sheet has no navigation bar to hold one, so it sits beside the picker.
 */
export function CreditsMenu(): React.ReactNode {
	return (
		<Host matchContents={true}>
			<Menu
				label={
					<Image
						color={palette.primary}
						modifiers={[frame({width: 44, height: 44})]}
						systemName="info.circle"
					/>
				}
				modifiers={[accessibilityLabel('About these stations')]}
			>
				{radioCredits().map((credit) => (
					// The compass says the item opens a site, as Safari's own icon does.
					<Button
						key={credit.url}
						label={credit.label}
						onPress={() => openUrl(credit.url)}
						systemImage="safari"
					/>
				))}
			</Menu>
		</Host>
	)
}
