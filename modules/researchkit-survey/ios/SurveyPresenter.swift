import UIKit
import ResearchKit
import ExpoModulesCore

final class SurveyPresenter: NSObject {
	static let shared = SurveyPresenter()

	private var currentPromise: Promise?
	private var taskViewController: ORKTaskViewController?

	private override init() {
		super.init()
	}

	func present(definition: [String: Any], promise: Promise) {
		guard currentPromise == nil else {
			promise.reject("SURVEY_IN_PROGRESS", "A survey is already being presented")
			return
		}

		do {
			let task = try SurveyParser.parse(definition)
			currentPromise = promise

			DispatchQueue.main.async { [weak self] in
				self?.presentTask(task)
			}
		} catch {
			promise.reject("PARSE_ERROR", error.localizedDescription)
		}
	}

	private func presentTask(_ task: ORKOrderedTask) {
		guard let rootVC = UIApplication.shared.connectedScenes
			.compactMap({ $0 as? UIWindowScene })
			.flatMap({ $0.windows })
			.first(where: { $0.isKeyWindow })?
			.rootViewController else {
			currentPromise?.reject("NO_ROOT_VC", "Cannot find root view controller")
			currentPromise = nil
			return
		}

		let taskVC = ORKTaskViewController(task: task, taskRun: nil)
		taskVC.delegate = self
		taskVC.modalPresentationStyle = .fullScreen
		self.taskViewController = taskVC

		var presenter = rootVC
		while let presented = presenter.presentedViewController {
			presenter = presented
		}
		presenter.present(taskVC, animated: true)
	}

	private func extractAnswers(from taskResult: ORKTaskResult) -> [String: Any] {
		var answers: [String: Any] = [:]

		for stepResult in taskResult.results ?? [] {
			guard let stepResult = stepResult as? ORKStepResult else { continue }
			for result in stepResult.results ?? [] {
				let key = result.identifier

				if let boolResult = result as? ORKBooleanQuestionResult,
				   let value = boolResult.booleanAnswer {
					answers[key] = value.boolValue
				} else if let choiceResult = result as? ORKChoiceQuestionResult,
						  let choices = choiceResult.choiceAnswers as? [String] {
					if choices.count == 1 {
						answers[key] = choices[0]
					} else {
						answers[key] = choices
					}
				} else if let scaleResult = result as? ORKScaleQuestionResult,
						  let value = scaleResult.scaleAnswer {
					// ORKScaleAnswerFormat and ORKContinuousScaleAnswerFormat both
					// produce ORKScaleQuestionResult, so one branch must serve both;
					// doubleValue loses no information for either since JS numbers
					// don't distinguish int from double.
					answers[key] = value.doubleValue
				} else if let textResult = result as? ORKTextQuestionResult,
						  let value = textResult.textAnswer {
					answers[key] = value
				} else if let numericResult = result as? ORKNumericQuestionResult,
						  let value = numericResult.numericAnswer {
					answers[key] = value.doubleValue
				} else if let dateResult = result as? ORKDateQuestionResult,
						  let value = dateResult.dateAnswer {
					let formatter = ISO8601DateFormatter()
					answers[key] = formatter.string(from: value)
				} else if let timeResult = result as? ORKTimeOfDayQuestionResult,
						  let components = timeResult.dateComponentsAnswer {
					let hour = components.hour ?? 0
					let minute = components.minute ?? 0
					answers[key] = String(format: "%02d:%02d", hour, minute)
				} else if let intervalResult = result as? ORKTimeIntervalQuestionResult,
						  let value = intervalResult.intervalAnswer {
					answers[key] = value.doubleValue
				} else if let locationResult = result as? ORKLocationQuestionResult,
						  let location = locationResult.locationAnswer {
					answers[key] = [
						"latitude": location.coordinate.latitude,
						"longitude": location.coordinate.longitude
					]
				}
			}
		}

		return answers
	}
}

extension SurveyPresenter: ORKTaskViewControllerDelegate {
	func taskViewController(
		_ taskViewController: ORKTaskViewController,
		didFinishWith reason: ORKTaskViewControllerFinishReason,
		error: Error?
	) {
		let result: [String: Any]

		switch reason {
		case .completed:
			let answers = extractAnswers(from: taskViewController.result)
			result = ["completed": true, "answers": answers]
		case .discarded, .failed, .earlyTermination, .saved:
			result = ["completed": false, "answers": [:]]
		@unknown default:
			result = ["completed": false, "answers": [:]]
		}

		taskViewController.dismiss(animated: true) { [weak self] in
			self?.currentPromise?.resolve(result)
			self?.currentPromise = nil
			self?.taskViewController = nil
		}
	}
}
