import * as React from 'react'
import {StyleSheet} from 'react-native'
import type {SFSymbol} from 'sf-symbols-typescript'
import {Host, Image, Label, List, Section, Text, VStack} from '@expo/ui/swift-ui'
import {
	font,
	foregroundStyle,
	frame,
	listRowBackground,
	listStyle,
	multilineTextAlignment,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {ActionRow} from '../../../source/components/rows'
import {BalancesView} from '../../../source/features/sis/balances'
import {useAppDispatch, useAppSelector} from '../../../source/redux'
import {
	acknowledgeAcknowledgement,
	selectAcknowledgement,
} from '../../../source/redux/parts/settings'

/** What a student agrees to before the app shows their balances. */
const TERMS: {symbol: SFSymbol; text: string}[] = [
	{
		symbol: 'exclamationmark.triangle',
		text: 'The information in the app may not be completely accurate.',
	},
	{
		symbol: 'checkmark.seal',
		text: 'Bon Appétit is always the final authority on any discrepancies.',
	},
	{symbol: 'building.columns', text: 'This app is not an official college app.'},
]

export default function SISBalancesPage(): React.ReactNode {
	let dispatch = useAppDispatch()
	let alertSeen = useAppSelector(selectAcknowledgement)

	if (alertSeen) {
		return <BalancesView />
	}

	return (
		<Host matchContents={false} style={styles.host}>
			<List modifiers={[listStyle('insetGrouped')]}>
				{/* The introduction sits on the list's own background, above the
				    cards, rather than in a card of its own. */}
				<Section modifiers={[listRowBackground('clear')]}>
					<VStack modifiers={[frame({maxWidth: Infinity})]} spacing={12}>
						<Image color={c.systemBlue} size={44} systemName="checkmark.shield" />
						<Text modifiers={[font({textStyle: 'title2', weight: 'bold'})]}>
							Before You Continue
						</Text>
						<Text modifiers={[foregroundStyle(c.secondaryLabel), multilineTextAlignment('center')]}>
							We want to make sure you have the most up-to-date information in the app, but please
							keep in mind that there may be some inaccuracies.
						</Text>
					</VStack>
				</Section>

				<Section
					footer={
						<Text>
							If you do not agree to these terms, you will not be able to see your balances in the
							app, but you can still use the rest of the features.
						</Text>
					}
					title="By continuing, you agree that"
				>
					{TERMS.map((term) => (
						<Label key={term.text} systemImage={term.symbol} title={term.text} />
					))}
				</Section>

				<Section>
					<ActionRow onPress={() => dispatch(acknowledgeAcknowledgement(true))} title="I Agree" />
				</Section>
			</List>
		</Host>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})
