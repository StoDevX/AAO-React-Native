import * as React from 'react'
import {RefreshControl, StyleSheet, ScrollView, View, Text} from 'react-native'
import * as c from '@frogpond/colors'
import {Markdown} from '@frogpond/markdown'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {accent} from '../../source/lib/theme'
import {Stack, useLocalSearchParams, useNavigation} from 'expo-router'
import {faqsOptions, emptyFaqData} from '../../source/features/faqs/query'
import {useQuery} from '@tanstack/react-query'
import type {Faq, FaqQueryData} from '../../source/features/faqs/types'

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
		borderColor: accent,
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

type CardProps = {
	faq: Faq
	isHighlighted: boolean
}

const FaqCard = ({faq, isHighlighted}: CardProps): React.ReactNode => {
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

function FaqView(): React.ReactNode {
	let {faqId: highlightId} = useLocalSearchParams<{faqId?: string}>()
	let {data, error, isLoading, isError, isRefetching, refetch} = useQuery(faqsOptions)
	let faqData: FaqQueryData = data ?? emptyFaqData
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
			refreshControl={<RefreshControl onRefresh={refetch} refreshing={isRefetching} />}
			style={styles.scrollView}
		>
			{hasLegacy ? (
				<View style={styles.legacy}>
					<Markdown source={faqData.legacyText ?? ''} />
				</View>
			) : null}

			{faqData.faqs.map((faq) => (
				<FaqCard key={faq.id} faq={faq} isHighlighted={faq.id === highlightId} />
			))}
		</ScrollView>
	)
}

export default function FaqPage(): React.ReactNode {
	const navigation = useNavigation()

	return (
		<>
			<Stack.Title>FAQs</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Close Screen"
					icon="xmark"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>

			<FaqView />
		</>
	)
}
