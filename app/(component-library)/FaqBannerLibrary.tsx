import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Section} from '@frogpond/tableview'
import {Stack} from 'expo-router'

import {FaqBannerPresentation} from '../../source/features/faqs/banner'
import type {Faq} from '../../source/features/faqs/types'
import {LibraryWrapper} from '../../source/features/settings/screens/overview/component-library/base/library-wrapper'

/**
 * Builds a preview Faq. Only the fields a banner actually reads are worth
 * varying, so the rest get inert defaults.
 */
function fixture(overrides: Partial<Faq> & Pick<Faq, 'id' | 'bannerTitle'>): Faq {
	return {
		question: overrides.bannerTitle,
		answer: '',
		targets: [],
		bannerText: 'Every banner reads its palette from its severity.',
		severity: 'notice',
		dismissable: false,
		...overrides,
	}
}

const severityExamples: Faq[] = [
	fixture({id: 'severity-notice', bannerTitle: 'notice', severity: 'notice'}),
	fixture({id: 'severity-info', bannerTitle: 'info', severity: 'info'}),
	fixture({id: 'severity-alert', bannerTitle: 'alert', severity: 'alert'}),
]

const iconExamples: Faq[] = [
	fixture({
		id: 'icon-default',
		bannerTitle: 'default for severity',
		bannerText: 'No icon field, so the severity supplies one.',
		severity: 'info',
	}),
	fixture({
		id: 'icon-override',
		bannerTitle: 'icon: megaphone',
		bannerText: 'Any SF Symbol name overrides the severity default.',
		severity: 'info',
		icon: 'megaphone',
	}),
	fixture({
		id: 'icon-override-alert',
		bannerTitle: 'icon: wrench.and.screwdriver',
		bannerText: 'The override applies on every severity.',
		severity: 'alert',
		icon: 'wrench.and.screwdriver',
	}),
]

const colorExamples: Faq[] = [
	fixture({
		id: 'color-background',
		bannerTitle: 'backgroundColor only',
		severity: 'alert',
		backgroundColor: '#fef3f2',
	}),
	fixture({
		id: 'color-foreground',
		bannerTitle: 'foregroundColor only',
		bannerText: 'Foreground drives both the title and the body text.',
		severity: 'alert',
		foregroundColor: '#b42318',
	}),
	fixture({
		id: 'color-both',
		bannerTitle: 'both overrides',
		bannerText: 'This is the palette the live SIS banner ships with.',
		severity: 'alert',
		backgroundColor: '#fef3f2',
		foregroundColor: '#b42318',
	}),
]

const dismissExamples: Faq[] = [
	fixture({
		id: 'dismiss-false',
		bannerTitle: 'dismissable: false',
		bannerText: 'No dismiss control is rendered at all.',
		severity: 'info',
	}),
	fixture({
		id: 'dismiss-true',
		bannerTitle: 'dismissable: true',
		bannerText: 'The dismiss control appears in the header row.',
		severity: 'info',
		dismissable: true,
	}),
]

const textExamples: Faq[] = [
	fixture({
		id: 'text-title-only',
		bannerTitle: 'title only, no body',
		bannerText: '',
		severity: 'notice',
	}),
	fixture({
		id: 'text-custom-cta',
		bannerTitle: 'custom bannerCta',
		bannerText: 'The call to action defaults to "Learn more".',
		severity: 'notice',
		bannerCta: 'Read the announcement',
	}),
	fixture({
		id: 'text-long-title',
		bannerTitle:
			'A banner title long enough to wrap onto several lines, which is what happens when a headline is written as a sentence',
		bannerText: 'The title flexes, so the dismiss control keeps its place.',
		severity: 'notice',
		dismissable: true,
	}),
	fixture({
		id: 'text-long-body',
		bannerTitle: 'long body',
		bannerText:
			'Balances login now appears to require Google sign-in on St. Olaf’s end, which the All About Olaf app cannot currently access or support. We will update this banner if that changes, and until then the login screen stays disabled rather than failing halfway through.',
		severity: 'notice',
	}),
]

const BannerSection = ({header, faqs}: {header: string; faqs: Faq[]}): React.ReactNode => (
	// Banners are standalone cards with their own corners and borders, so the
	// section drops the cell chrome that would clip and divide them.
	<Section header={header} hideSeparator={true} roundedCorners={false}>
		{faqs.map((faq) => (
			<FaqBannerPresentation key={faq.id} faq={faq} style={styles.banner} />
		))}
	</Section>
)

export default function FaqBannerLibraryPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>FAQ Banners</Stack.Title>
			<LibraryWrapper>
				<>
					<BannerSection faqs={severityExamples} header="Severity" />
					<BannerSection faqs={iconExamples} header="Icon" />
					<BannerSection faqs={colorExamples} header="Color overrides" />
					<BannerSection faqs={dismissExamples} header="Dismissable" />
					<BannerSection faqs={textExamples} header="Text" />
				</>
			</LibraryWrapper>
		</>
	)
}

const styles = StyleSheet.create({
	banner: {
		marginBottom: 12,
	},
})
