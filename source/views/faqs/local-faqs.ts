import faqsData from '../../../docs/faqs.json'
import type {Faq} from './types'

const docsFaqs = Array.isArray(faqsData?.faqs) ? (faqsData.faqs as Faq[]) : []

export const fallbackLegacyText =
	typeof faqsData?.text === 'string' ? faqsData.text : ''

export const fallbackFaqs: Faq[] = docsFaqs.map((faq) => ({
	...faq,
	targets: Array.isArray(faq.targets) ? faq.targets : [],
	severity: faq.severity ?? 'notice',
	dismissable: faq.dismissable ?? true,
}))
