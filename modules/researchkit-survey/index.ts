import {requireNativeModule} from 'expo-modules-core'
import type {SurveyDefinition, SurveyResult} from './types'

export * from './types'

interface ResearchKitSurveyModule {
	presentSurvey(survey: SurveyDefinition): Promise<SurveyResult>
}

const NativeModule = requireNativeModule<ResearchKitSurveyModule>('ResearchKitSurvey')

export function presentSurvey(survey: SurveyDefinition): Promise<SurveyResult> {
	return NativeModule.presentSurvey(survey)
}
