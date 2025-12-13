import type {Faq} from './query'

export const fallbackLegacyText =
	'# Support\nSay hello to us at [allaboutolaf@frogpond.tech](mailto:allaboutolaf@frogpond.tech).\n\n# Known Issues\n- Login Unavailable: SIS now requires Google sign-in, which the All About Olaf app can’t currently support. This means login and balances are unavailable until further notice.\n- Building Hours: It reports the 2am buildings as open too often; for instance, the Pause is open on Saturday at 2am, continuing from Friday, but the app reports it as being open on Friday at 2am, as well. This is incorrect.\n'

export const fallbackFaqs: Faq[] = [
	{
		id: 'sis-login-disabled',
		question: "Why can't I log in to Balances anymore?",
		answer:
			'Balances login now appears to require Google sign-in on St. Olaf’s end, which the All About Olaf app can’t currently access or support.\n\nThese features will be unavailable until further notice. We’ll update this if access options change.',
		bannerTitle: 'Login and Balances Unavailable',
		bannerText:
			'Balances login now appears to require Google sign-in on St. Olaf’s end, which the All About Olaf app can’t currently access or support.',
		targets: ['SIS', 'Settings', 'SettingsRoot'],
		updatedAt: '2024-12-02T00:00:00Z',
	},
	{
		id: 'home-support',
		question: 'How do I get support?',
		answer:
			'Email [allaboutolaf@frogpond.tech](mailto:allaboutolaf@frogpond.tech) with any screenshots or details you have and a developer will follow up.',
		bannerTitle: 'Need help with the app?',
		bannerText: 'Reach out to the team if something looks wrong or confusing.',
		targets: ['Home'],
		updatedAt: '2024-12-02T00:00:00Z',
	},
	{
		id: 'settings-feedback',
		question: 'How can I reset the app?',
		answer:
			'Open Settings → Support → Reset Everything. This will clear cached data and reload.',
		bannerTitle: 'Need to reset the app?',
		bannerText: 'You can reset cached data from Settings if things get stuck.',
		targets: ['SettingsRoot', 'Settings'],
		updatedAt: '2024-12-02T00:00:00Z',
	},
]
