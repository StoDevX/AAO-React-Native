import React from 'react'
import {ScrollView, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import * as m from '@frogpond/markdown'

const styles = StyleSheet.create({
	scrollView: {
		backgroundColor: c.systemBackground,
		paddingHorizontal: 15,
		paddingVertical: 15,
	},
})

export let PrivacyView = (): React.JSX.Element => (
	<ScrollView
		contentInsetAdjustmentBehavior="automatic"
		style={styles.scrollView}
	>
		<m.Heading level={1}>All About Olaf Privacy Policy</m.Heading>
		<m.Paragraph>
			We respect your right to privacy when using our app, All About Olaf.
		</m.Paragraph>
		<m.Paragraph>
			Our policy towards privacy is simple: we aim to collect no data other than
			what we need to keep the app functional and ensure a smooth experience for
			all users.
		</m.Paragraph>
		<m.Heading level={2}>Who runs this app?</m.Heading>
		<m.Paragraph>
			This app is developed and maintained by a mixed team of current students
			at St. Olaf College and alumni of St. Olaf College. Anyone is welcome to
			make contributions to the app, and the source code for the app is publicly
			available{' '}
			<m.Link href="https://github.com/StoDevX/AAO-React-Native">
				on GitHub
			</m.Link>
			. All contributions go through code review by maintainers.
		</m.Paragraph>
		<m.Paragraph>
			This app is entirely self-funded, and we do not include advertisements on
			our app. As such, our privacy policy is quite simple.
		</m.Paragraph>
		<m.Heading level={2}>What data do you collect?</m.Heading>
		<m.Paragraph>
			When you “Sign in with St. Olaf” in the settings, your St. Olaf username
			and password are stored locally, on your device, in the encrypted keychain
			storage mechanism available on your device. _We do not transmit these
			credentials to or through any servers that we control, and we do not have
			the ability to remotely access these credentials_. These credentials
			become inaccessible when you delete the app. We only transmit these
			credentials to on-campus servers, and the security of those servers is not
			controlled by us.
		</m.Paragraph>
		<m.Paragraph>
			When you fetch any data besides your personal information, your requests
			may reach servers that we control. Whenever your app makes such a request,
			the following information is logged:
		</m.Paragraph>
		<m.Paragraph>
			1. <m.Emph>Your public IP address</m.Emph>. We do not use this to identify
			you or for tracking purposes, and this is logged only for diagnostic
			purposes.
		</m.Paragraph>
		<m.Paragraph>
			2.{' '}
			<m.Emph>
				The version of All About Olaf you are using and information about your
				phone
			</m.Emph>
			, which is sent as part of your device’s request. This data is
			intentionally vague so that we can also not use this to identify you.
		</m.Paragraph>
		<m.Paragraph>
			3. <m.Emph>What you requested and how long it took</m.Emph>, which is
			widely considered to be fully anonymous.
		</m.Paragraph>
		<m.Paragraph>
			We also use <m.Emph>Sentry</m.Emph>, which collects crash reports and
			cannot be disabled currently. Sentry collects in-depth information about
			the device and circumstances leading up to a given crash.
		</m.Paragraph>
		<m.Paragraph>
			If you send us suggestions for updates to building hours, we will
			anonymously add them to the app if we determine that they are correct. We
			do not currently give credit for these contributions, primarily because we
			don’t have an easy way of attributing these. In its current form, the
			“suggest an update” feature requires you to send an email, and this email
			is sent to our developer mailing list.
		</m.Paragraph>
		<m.Paragraph>
			If you choose to use the “Submit a Wi-Fi problem” feature or other
			features and tools that use college systems such as StoPrint, your data is
			transmitted to those systems exclusively, and we do not have the ability
			to see it.
		</m.Paragraph>
		<m.Paragraph>
			Most importantly:{' '}
			<m.Strong>
				the developers and maintainers of All About Olaf{' '}
				<m.Emph>will not</m.Emph>, under any circumstances, grant access to any
				personally identifiable information that we may have collected to a
				third party, unless as required by law
			</m.Strong>
			. We treat your data as confidential and have the utmost respect for your
			privacy, and we think that sharing data with other companies for marketing
			purposes or compensation is a blatant violation of trust; we will never
			share this data.
		</m.Paragraph>
		<m.Heading level={2}>Contact Us</m.Heading>
		<m.Paragraph>
			If you have any questions, comments, or concerns about this privacy
			policy, please reach out to us via email at{' '}
			<m.Link href="mailto:allaboutolaf@frogpond.tech">
				allaboutolaf@frogpond.tech
			</m.Link>
			. This mailing list contains all active maintainers and developers.
		</m.Paragraph>
	</ScrollView>
)
