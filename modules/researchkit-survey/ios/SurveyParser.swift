import ResearchKit

enum SurveyParserError: LocalizedError {
	case missingField(String)
	case emptyQuestions
	case unknownQuestionType(String)
	case invalidScaleRange(questionId: String)
	case emptyChoices(questionId: String)
	case invalidNumericRange(questionId: String)
	case invalidDateRange(questionId: String)
	case invalidImageChoice(questionId: String)
	case emptySections(stepId: String)

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
		case .invalidNumericRange(let id):
			return "Numeric question '\(id)' has min >= max"
		case .invalidDateRange(let id):
			return "Date question '\(id)' has minDate >= maxDate"
		case .invalidImageChoice(let id):
			return "Image choice question '\(id)' has no valid image source"
		case .emptySections(let id):
			return "Form step '\(id)' has no sections"
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

	private static func parseQuestion(_ dict: [String: Any]) throws -> ORKStep {
		guard let type = dict["type"] as? String else {
			throw SurveyParserError.missingField("question.type")
		}

		if type == "formStep" {
			return try parseFormStep(dict)
		}

		guard let id = dict["id"] as? String else {
			throw SurveyParserError.missingField("question.id")
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

	private static func parseFormStep(_ dict: [String: Any]) throws -> ORKFormStep {
		guard let id = dict["id"] as? String else {
			throw SurveyParserError.missingField("formStep.id")
		}
		guard let title = dict["title"] as? String else {
			throw SurveyParserError.missingField("formStep.title")
		}
		guard let sectionsArray = dict["sections"] as? [[String: Any]], !sectionsArray.isEmpty else {
			throw SurveyParserError.emptySections(stepId: id)
		}

		let text = dict["text"] as? String
		let useCardView = dict["cardView"] as? Bool ?? true

		let formStep = ORKFormStep(identifier: id, title: title, text: text)
		formStep.useCardView = useCardView

		var formItems: [ORKFormItem] = []

		for section in sectionsArray {
			if let sectionTitle = section["title"] as? String {
				let sectionItem = ORKFormItem(sectionTitle: sectionTitle)
				formItems.append(sectionItem)
			}

			guard let items = section["items"] as? [[String: Any]] else { continue }

			for itemDict in items {
				guard let itemId = itemDict["id"] as? String else {
					throw SurveyParserError.missingField("formItem.id")
				}
				guard let itemType = itemDict["type"] as? String else {
					throw SurveyParserError.missingField("formItem.type")
				}
				let itemTitle = itemDict["title"] as? String ?? ""
				let itemText = itemDict["text"] as? String
				let optional = itemDict["optional"] as? Bool ?? false

				let answerFormat = try parseAnswerFormat(type: itemType, dict: itemDict, questionId: itemId)
				let formItem = ORKFormItem(identifier: itemId, text: itemTitle, answerFormat: answerFormat, optional: optional)
				formItem.detailText = itemText
				formItems.append(formItem)
			}
		}

		formStep.formItems = formItems
		return formStep
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

		case "numeric":
			let styleStr = dict["style"] as? String ?? "integer"
			let style: ORKNumericAnswerStyle = styleStr == "decimal" ? .decimal : .integer
			let min = dict["min"] as? NSNumber
			let max = dict["max"] as? NSNumber
			if let minVal = min, let maxVal = max, minVal.doubleValue >= maxVal.doubleValue {
				throw SurveyParserError.invalidNumericRange(questionId: questionId)
			}
			let unit = dict["unit"] as? String
			let format = ORKNumericAnswerFormat(style: style, unit: unit, minimum: min, maximum: max)
			format.placeholder = dict["placeholder"] as? String
			return format

		case "email":
			let format = ORKTextAnswerFormat(maximumLength: 0)
			format.keyboardType = .emailAddress
			format.autocapitalizationType = .none
			format.autocorrectionType = .no
			format.spellCheckingType = .no
			format.placeholder = dict["placeholder"] as? String
			return format

		case "date":
			let styleStr = dict["style"] as? String ?? "date"
			let style: ORKDateAnswerStyle = styleStr == "dateTime" ? .dateAndTime : .date

			let dateFormatter = ISO8601DateFormatter()
			let minDate = (dict["minDate"] as? String).flatMap { dateFormatter.date(from: $0) }
			let maxDate = (dict["maxDate"] as? String).flatMap { dateFormatter.date(from: $0) }
			let defaultDate = (dict["defaultDate"] as? String).flatMap { dateFormatter.date(from: $0) }

			if let min = minDate, let max = maxDate, min >= max {
				throw SurveyParserError.invalidDateRange(questionId: questionId)
			}

			return ORKDateAnswerFormat(
				style: style,
				defaultDate: defaultDate,
				minimumDate: minDate,
				maximumDate: maxDate,
				calendar: nil
			)

		case "time":
			var defaultComponents: DateComponents?
			if let timeStr = dict["defaultTime"] as? String {
				let parts = timeStr.split(separator: ":")
				if parts.count == 2, let hour = Int(parts[0]), let minute = Int(parts[1]) {
					defaultComponents = DateComponents(hour: hour, minute: minute)
				}
			}
			return ORKTimeOfDayAnswerFormat(defaultComponents: defaultComponents)

		case "continuousScale":
			let min = dict["min"] as? Double ?? 0.0
			let max = dict["max"] as? Double ?? 1.0
			guard min < max else {
				throw SurveyParserError.invalidScaleRange(questionId: questionId)
			}
			let minLabel = dict["minLabel"] as? String
			let maxLabel = dict["maxLabel"] as? String
			let defaultValue = dict["defaultValue"] as? Double ?? min
			let fractionDigits = dict["fractionDigits"] as? Int ?? 2
			return ORKContinuousScaleAnswerFormat(
				maximumValue: max,
				minimumValue: min,
				defaultValue: defaultValue,
				maximumFractionDigits: fractionDigits,
				vertical: false,
				maximumValueDescription: maxLabel,
				minimumValueDescription: minLabel
			)

		case "valuePicker":
			guard let choicesArray = dict["choices"] as? [[String: Any]], !choicesArray.isEmpty else {
				throw SurveyParserError.emptyChoices(questionId: questionId)
			}
			let textChoices = choicesArray.map { choice in
				ORKTextChoice(
					text: choice["text"] as? String ?? "",
					value: (choice["value"] as? String ?? "") as NSString
				)
			}
			return ORKValuePickerAnswerFormat(textChoices: textChoices)

		case "timeInterval":
			let defaultInterval = dict["defaultInterval"] as? TimeInterval ?? 0
			let step = dict["step"] as? Int ?? 1
			return ORKTimeIntervalAnswerFormat(defaultInterval: defaultInterval, step: step)

		case "textChoiceOther":
			guard let choicesArray = dict["choices"] as? [[String: Any]], !choicesArray.isEmpty else {
				throw SurveyParserError.emptyChoices(questionId: questionId)
			}
			let otherPlaceholder = dict["otherPlaceholder"] as? String ?? "Other"
			var textChoices: [ORKTextChoice] = choicesArray.map { choice in
				ORKTextChoice(
					text: choice["text"] as? String ?? "",
					value: (choice["value"] as? String ?? "") as NSString
				)
			}
			let otherChoice = ORKTextChoiceOther.choice(
				withText: "Other",
				detailText: nil,
				value: "other" as NSString,
				exclusive: false,
				textViewPlaceholderText: otherPlaceholder
			)
			textChoices.append(otherChoice)
			let styleStr = dict["style"] as? String ?? "singleChoice"
			let style: ORKChoiceAnswerStyle = styleStr == "multipleChoice" ? .multipleChoice : .singleChoice
			return ORKTextChoiceAnswerFormat(style: style, textChoices: textChoices)

		case "imageChoice":
			guard let choicesArray = dict["choices"] as? [[String: Any]], !choicesArray.isEmpty else {
				throw SurveyParserError.emptyChoices(questionId: questionId)
			}
			var imageChoices: [ORKImageChoice] = []
			for choice in choicesArray {
				let text = choice["text"] as? String ?? ""
				let value = (choice["value"] as? String ?? "") as NSString
				var image: UIImage?

				if let imageDict = choice["image"] as? [String: String] {
					if let sfSymbol = imageDict["sfSymbol"] {
						image = UIImage(systemName: sfSymbol)
					} else if let urlString = imageDict["url"],
						let url = URL(string: urlString),
						let data = try? Data(contentsOf: url) {
						image = UIImage(data: data)?.withRenderingMode(.alwaysOriginal)
					}
				}

				guard let validImage = image else {
					throw SurveyParserError.invalidImageChoice(questionId: questionId)
				}

				imageChoices.append(ORKImageChoice(normalImage: validImage, selectedImage: nil, text: text, value: value))
			}
			let styleStr = dict["style"] as? String ?? "singleChoice"
			let style: ORKChoiceAnswerStyle = styleStr == "multipleChoice" ? .multipleChoice : .singleChoice
			return ORKImageChoiceAnswerFormat(imageChoices: imageChoices, style: style, vertical: false)

		case "location":
			let format = ORKLocationAnswerFormat()
			format.useCurrentLocation = false
			format.placeholder = dict["placeholder"] as? String
			return format

		default:
			throw SurveyParserError.unknownQuestionType(type)
		}
	}
}
