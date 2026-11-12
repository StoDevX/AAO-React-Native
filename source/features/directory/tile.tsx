import * as React from 'react'
import type {SFSymbol} from 'sf-symbols-typescript'
import {resolveGradient} from '@frogpond/colors'
import {GradientTile} from '../../components/gradient-tile'
import type {ContactType} from './types'

/// Drawn when a contact names no icon. A named icon this iOS does not carry
/// draws nothing instead -- `Image(systemName:)` validates nothing and just
/// renders empty, so this fallback never reaches that case.
const FALLBACK_ICON: SFSymbol = 'phone.fill'

type Props = {
	contact: ContactType
	/** Opens the contact's detail screen. */
	onPress: () => void
}

/**
 * A curated campus contact's tile. Tapping opens the detail screen, where
 * the contact's call/link action lives. Square rather than the default
 * portrait shape, so the grid stays short enough to leave the department list
 * in view below it. Every label holds two lines, so a row of tiles is one
 * height and its cards line up whether a name wraps or not.
 */
export function ContactTile({contact, onPress}: Props): React.ReactNode {
	return (
		<GradientTile
			gradient={resolveGradient(contact.gradient)}
			icon={contact.icon ?? FALLBACK_ICON}
			onPress={onPress}
			ratio={1}
			// Every name gets two lines' room, so the cards of a row line up
			// whether a name wraps or not.
			reservesLabelLines={true}
			title={contact.title}
		/>
	)
}
