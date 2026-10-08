import Foundation
import UIKit

/// Lets the UI tests reset a running app and open a route in it, instead of
/// relaunching it. A launch with `--uitesting` and
/// `--uitest-reset-channel <directory>` listens for a Darwin notification
/// named after that directory, which the test runner posts once it has
/// written `request.json` there. The reply goes in the same directory, in a
/// file named after the request's id: `ok` once the app has torn down what the
/// previous test left and is about to reload its JavaScript, or `refused` when
/// the runner asked for a launch this one is not.
///
/// The simulator does not sandbox its apps, so the app can read and write a
/// directory in the runner's temporary directory.
final class UITestResetChannel {
	static let flag = "--uitest-reset-channel"

	/// What the runner asks for, as `uitests/UITestCase.swift` writes it.
	struct Request: Decodable {
		let id: String
		/// The deep link to open once the JavaScript has reloaded.
		let url: String
		/// The launch arguments the runner would cold-launch the app with. A
		/// reset can stand in for that launch only if they are this process's.
		let arguments: [String]
	}

	private let directory: URL
	private let name: String
	private let onRequest: (Request) -> Void

	/// The channel this launch was given, or nil when it was given none.
	static func open(onRequest: @escaping (Request) -> Void) -> UITestResetChannel? {
		let arguments = ProcessInfo.processInfo.arguments
		guard
			arguments.contains("--uitesting"),
			let index = arguments.firstIndex(of: flag),
			index + 1 < arguments.count
		else {
			return nil
		}
		return UITestResetChannel(directory: arguments[index + 1], onRequest: onRequest)
	}

	private init(directory: String, onRequest: @escaping (Request) -> Void) {
		self.directory = URL(fileURLWithPath: directory, isDirectory: true)
		self.name = Self.notificationName(directory: directory)
		self.onRequest = onRequest

		let callback: CFNotificationCallback = { _, observer, _, _, _ in
			guard let observer else { return }
			Unmanaged<UITestResetChannel>.fromOpaque(observer).takeUnretainedValue().receive()
		}
		CFNotificationCenterAddObserver(
			CFNotificationCenterGetDarwinNotifyCenter(),
			Unmanaged.passUnretained(self).toOpaque(),
			callback,
			name as CFString,
			nil,
			.deliverImmediately)
	}

	/// The Darwin notification's name for a channel directory. The runner
	/// builds the same name; see `UITestResetChannel` in `uitests/UITestCase.swift`.
	static func notificationName(directory: String) -> String {
		"AllAboutOlaf.uitest-reset:\(directory)"
	}

	func close() {
		CFNotificationCenterRemoveObserver(
			CFNotificationCenterGetDarwinNotifyCenter(),
			Unmanaged.passUnretained(self).toOpaque(),
			CFNotificationName(name as CFString),
			nil)
	}

	private func receive() {
		guard
			let data = try? Data(contentsOf: directory.appendingPathComponent("request.json")),
			let request = try? JSONDecoder().decode(Request.self, from: data)
		else {
			return
		}
		// Launched with other arguments -- another text size, or state kept
		// from the last launch -- the app is not the one the test asked for.
		guard request.arguments == Array(ProcessInfo.processInfo.arguments.dropFirst()) else {
			reply(to: request.id, "refused")
			return
		}
		onRequest(request)
	}

	/// Clears what JavaScript cannot reach and tells the runner the app is
	/// reloading. Run on the main queue, once JavaScript has unmounted every
	/// screen and cleared its own storage.
	@MainActor
	func finish(id: String, url: String) {
		// A screen's own modals went with the screen; this closes what UIKit
		// presented outside React -- an alert, a share sheet, a Safari view.
		let root = UIApplication.shared.connectedScenes
			.compactMap { $0 as? UIWindowScene }
			.flatMap { $0.windows }
			.first { $0.isKeyWindow }?
			.rootViewController
		let answer = {
			// What `--reset-state` clears at launch, as AppDelegate does it.
			if let bundleId = Bundle.main.bundleIdentifier {
				UserDefaults.standard.removePersistentDomain(forName: bundleId)
			}

			Self.setPendingURL(url)
			self.reply(to: id, "ok")
		}
		// Answer only once the dismissal is done. Even unanimated, a Safari
		// view is still presented when `dismiss` returns, and the next test
		// would then present its own sheets while it is being taken down.
		if let presented = root?.presentedViewController, !presented.isBeingDismissed {
			root?.dismiss(animated: false, completion: answer)
		} else {
			answer()
		}
	}

	private func reply(to id: String, _ answer: String) {
		try? Data(answer.utf8).write(to: directory.appendingPathComponent(id), options: .atomic)
	}

	// MARK: - The route to open after the reload

	private static let lock = NSLock()
	/// Written on the main queue and read on the JavaScript thread, always
	/// under `lock`.
	nonisolated(unsafe) private static var pendingURL: String?

	private static func setPendingURL(_ url: String) {
		lock.lock()
		defer { lock.unlock() }
		pendingURL = url
	}

	/// The deep link a reset asked for, once: the reloaded JavaScript opens it
	/// as though the app had been launched with it.
	static func takePendingURL() -> String? {
		lock.lock()
		defer { lock.unlock() }
		let url = pendingURL
		pendingURL = nil
		return url
	}
}
