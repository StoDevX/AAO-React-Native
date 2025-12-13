import * as React from 'react'
import {RefreshControl, StyleSheet, ScrollView, View, Text} from 'react-native'
import * as c from '@frogpond/colors'
import {Markdown} from '@frogpond/markdown'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {RouteProp, useRoute} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useFaqs, Faq, FaqQueryData, emptyFaqData} from './query'

type FaqRoute = RouteProp<ReactNavigation.RootParamList, 'Faq'>

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 15,
		paddingBottom: 24,
	},
	scrollView: {
		backgroundColor: c.systemBackground,
	},
	legacy: {
		paddingVertical: 15,
	},
	card: {
		backgroundColor: c.secondarySystemBackground,
		borderColor: c.separator,
		borderRadius: 12,
		borderWidth: StyleSheet.hairlineWidth,
		marginTop: 15,
		padding: 16,
	},
	cardHighlighted: {
		borderColor: c.tintColor,
	},
	cardTitle: {
		color: c.label,
		fontSize: 17,
		fontWeight: '600',
		marginBottom: 10,
	},
	cardBody: {
		marginTop: 4,
	},
})

function FaqView(): JSX.Element {
	let route = useRoute<FaqRoute>()
	let {data, error, isLoading, isError, isRefetching, refetch} = useFaqs()
	let faqData: FaqQueryData = data ?? emptyFaqData
	let highlightId = route.params?.faqId
	let hasFaqs = faqData.faqs.length > 0
	let hasLegacy = Boolean(faqData.legacyText && !hasFaqs)

	if (isLoading) {
		return <LoadingView />
	}

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${error}`}
			/>
		)
	}

	if (!hasLegacy && !hasFaqs) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text="There aren't any FAQs to show right now."
			/>
		)
	}

	return (
		<ScrollView
			contentContainerStyle={styles.container}
			contentInsetAdjustmentBehavior="automatic"
			refreshControl={
				<RefreshControl onRefresh={refetch} refreshing={isRefetching} />
			}
			style={styles.scrollView}
		>
			{hasLegacy ? (
				<View style={styles.legacy}>
					<Markdown source={faqData.legacyText ?? ''} />
				</View>
			) : null}

			{faqData.faqs.map((faq) => (
				<FaqCard
					key={faq.id}
					faq={faq}
					isHighlighted={faq.id === highlightId}
				/>
			))}
		</ScrollView>
	)
}

type CardProps = {
	faq: Faq
	isHighlighted: boolean
}

const FaqCard = ({faq, isHighlighted}: CardProps): JSX.Element => {
	return (
		<View
			style={[styles.card, isHighlighted ? styles.cardHighlighted : null]}
			testID={`faq-card-${faq.id}`}
		>
			<Text style={styles.cardTitle}>{faq.question}</Text>

			<View style={styles.cardBody}>
				<Markdown source={faq.answer} />
			</View>
		</View>
	)
}

export {FaqView as View}
export {FaqBanner} from './banner'

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'FAQs',
}
