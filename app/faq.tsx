import * as React from 'react'
import {RefreshControl, StyleSheet, ScrollView, View, Text} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import * as c from '@frogpond/colors'
import {Markdown} from '@frogpond/markdown'
import {LoadErrorView, LoadingView, NoticeView} from '@frogpond/notice'
import {accent} from '../source/lib/theme'
import {Stack, useLocalSearchParams} from 'expo-router'
import {faqsOptionsFor, emptyFaqDataFor} from '../source/features/faqs/query'
import {useCampus} from '../source/features/campus/store'
import {useQuery} from '@tanstack/react-query'
import type {Faq, FaqQueryData} from '../source/features/faqs/types'
import {requiresSection} from '../source/features/campus/section-gate'

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 15,
		paddingBottom: 24,
	},
	scrollView: {
		backgroundColor: c.systemGroupedBackground,
	},
	legacy: {
		paddingVertical: 15,
	},
	card: {
		backgroundColor: c.secondarySystemGroupedBackground,
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
	let campus = useCampus()
	let {data, error, isLoading, isError, isRefetching, refetch} = useQuery(faqsOptionsFor(campus))
	let faqData: FaqQueryData = data ?? emptyFaqDataFor(campus)
	let hasFaqs = faqData.faqs.length > 0
	let hasLegacy = Boolean(faqData.legacyText && !hasFaqs)

	if (isLoading) {
		return <LoadingView />
	}

	if (isError) {
		return <LoadErrorView error={error} onRetry={refetch} />
	}

	if (!hasLegacy && !hasFaqs) {
		return (
			<NoticeView
				action={{label: 'Try Again', onPress: refetch}}
				description="There aren’t any FAQs to show right now."
				systemImage="questionmark.bubble"
				title="No FAQs"
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
			<SafeAreaView edges={['left', 'right']}>
				{hasLegacy ? (
					<View style={styles.legacy}>
						<Markdown source={faqData.legacyText ?? ''} />
					</View>
				) : null}

				{faqData.faqs.map((faq) => (
					<FaqCard key={faq.id} faq={faq} isHighlighted={faq.id === highlightId} />
				))}
			</SafeAreaView>
		</ScrollView>
	)
}

function FaqPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>FAQs</Stack.Title>

			<FaqView />
		</>
	)
}

export default requiresSection(
	'faqs',
	{title: 'FAQs', noun: 'FAQs', systemImage: 'questionmark.circle'},
	FaqPage,
)
