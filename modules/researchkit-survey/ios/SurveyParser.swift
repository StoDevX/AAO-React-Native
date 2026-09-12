import ResearchKit

enum SurveyParserError: LocalizedError {
	case missingField(String)
	case emptyQuestions
	case unknownQuestionType(String)
	case invalidScaleRange(questionId: String)
	case emptyChoices(questionId: String)

	var errorDescription: String? {
		switch self {
		case .missingField(let field):
			return "Missing required field: \(field)"
		case .emptyQuestions:
			return "Survey must have at least one question"
		case .unknownQuestionType(let type):
			return "Unknown question type: \(type)"
		case .invalidScaleRange(let id):
			return "Scale question '\(id)' has min >= max"
		case .emptyChoices(let id):
			return "Choice question '\(id)' has no choices"
		}
	}
}

/// Converts a JS survey definition (passed as a dictionary from Expo) into a ResearchKit task.
struct SurveyParser {
	static func parse(_ definition: [String: Any]) throws -> ORKOrderedTask {
		guard let surveyId = definition["id"] as? String else {
			throw SurveyParserError.missingField("id")
		}
		guard let title = definition["title"] as? String else {
			throw SurveyParserError.missingField("title")
		}
		guard let questionsArray = definition["questions"] as? [[String: Any]] else {
			throw SurveyParserError.missingField("questions")
		}
		guard !questionsArray.isEmpty else {
			throw SurveyParserError.emptyQuestions
		}

		var steps: [ORKStep] = []

		if let instructions = definition["instructions"] as? String {
			let introStep = ORKInstructionStep(identifier: "\(surveyId).intro")
			introStep.title = title
			introStep.detailText = instructions
			steps.append(introStep)
		}

		for questionDict in questionsArray {
			let step = try parseQuestion(questionDict)
			steps.append(step)
		}

		let completionStep = ORKCompletionStep(identifier: "\(surveyId).completion")
		completionStep.title = "Thank You"
		completionStep.text = "Your response has been recorded."
		steps.append(completionStep)

		return ORKOrderedTask(identifier: surveyId, steps: steps)
	}

	private static func parseQuestion(_ dict: [String: Any]) throws -> ORKQuestionStep {
		guard let id = dict["id"] as? String else {
			throw SurveyParserError.missingField("question.id")
		}
		guard let type = dict["type"] as? String else {
			throw SurveyParserError.missingField("question.type")
		}
		guard let title = dict["title"] as? String else {
			throw SurveyParserError.missingField("question.title")
		}

		let text = dict["text"] as? String
		let optional = dict["optional"] as? Bool ?? false

		let answerFormat: ORKAnswerFormat = try parseAnswerFormat(type: type, dict: dict, questionId: id)

		let step = ORKQuestionStep(identifier: id, title: title, question: text, answer: answerFormat)
		step.isOptional = optional

		return step
	}

	private static func parseAnswerFormat(type: String, dict: [String: Any], questionId: String) throws -> ORKAnswerFormat {
		switch type {
		case "boolean":
			let yesText = dict["yesText"] as? String ?? "Yes"
			let noText = dict["noText"] as? String ?? "No"
			return ORKBooleanAnswerFormat(yesString: yesText, noString: noText)

		case "singleChoice", "multipleChoice":
			guard let choicesArray = dict["choices"] as? [[String: Any]], !choicesArray.isEmpty else {
				throw SurveyParserError.emptyChoices(questionId: questionId)
			}
			let textChoices = choicesArray.map { choice in
				ORKTextChoice(
					text: choice["text"] as? String ?? "",
					value: (choice["value"] as? String ?? "") as NSString
				)
			}
			let style: ORKChoiceAnswerStyle = type == "singleChoice" ? .singleChoice : .multipleChoice
			return ORKTextChoiceAnswerFormat(style: style, textChoices: textChoices)

		case "scale":
			let min = dict["min"] as? Int ?? 1
			let max = dict["max"] as? Int ?? 5
			guard min < max else {
				throw SurveyParserError.invalidScaleRange(questionId: questionId)
			}
			let minLabel = dict["minLabel"] as? String
			let maxLabel = dict["maxLabel"] as? String
			let defaultValue = dict["defaultValue"] as? Int ?? min
			return ORKScaleAnswerFormat(
				maximumValue: max,
				minimumValue: min,
				defaultValue: defaultValue,
				step: 1,
				vertical: false,
				maximumValueDescription: maxLabel,
				minimumValueDescription: minLabel
			)

		case "text":
			let multiline = dict["multiline"] as? Bool ?? false
			let maxLength = dict["maxLength"] as? Int ?? 0
			let placeholder = dict["placeholder"] as? String
			let format = ORKTextAnswerFormat(maximumLength: maxLength)
			format.multipleLines = multiline
			format.placeholder = placeholder
			return format

		default:
			throw SurveyParserError.unknownQuestionType(type)
		}
	}
}
