import * as React from 'react'
import {HStack, ScrollView} from '@expo/ui/swift-ui'
import {padding} from '@expo/ui/swift-ui/modifiers'
import {Chip} from './chip'
import {chipKey, chipLabel, MESS_CHIPS, type MessChip} from './lib/chips'
import {PAGE_MARGIN} from './mess-page'

/** Names every chip, for a UI test; each is told apart by its label. */
export const CHIP_ID = 'mess-chip'

const ROW = [padding({horizontal: PAGE_MARGIN, vertical: 8})]

type Props = {
	chosen: MessChip
	onChoose: (chip: MessChip) => void
}

/** The front page's chips in one row that scrolls sideways; the chosen one is filled in the Mess red. */
export function ChipRow({chosen, onChoose}: Props): React.ReactNode {
	return (
		<ScrollView axes="horizontal" showsIndicators={false}>
			<HStack modifiers={ROW} spacing={8}>
				{MESS_CHIPS.map((chip) => (
					<Chip
						identifier={CHIP_ID}
						isOn={chipKey(chip) === chipKey(chosen)}
						key={chipKey(chip)}
						label={chipLabel(chip)}
						onPress={() => onChoose(chip)}
					/>
				))}
			</HStack>
		</ScrollView>
	)
}
