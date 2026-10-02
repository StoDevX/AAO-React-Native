import ExpoModulesCore
import UIKit

/// One quick action as JavaScript describes it.
struct QuickAction: Record {
	@Field var id: String = ""
	@Field var title: String = ""
	/// An SF Symbol name.
	@Field var symbol: String = ""
	/// The in-app route a tap opens, already percent-encoded. SceneDelegate
	/// reads it back out of `userInfo`.
	@Field var href: String = ""
}

public class QuickActionsModule: Module {
	public func definition() -> ModuleDefinition {
		Name("QuickActions")

		AsyncFunction("setQuickActions") { (actions: [QuickAction]) in
			UIApplication.shared.shortcutItems = actions.map { action in
				UIApplicationShortcutItem(
					type: action.id,
					localizedTitle: action.title,
					localizedSubtitle: nil,
					icon: UIApplicationShortcutIcon(systemImageName: action.symbol),
					userInfo: ["href": action.href as NSString]
				)
			}
		}.runOnQueue(.main)
	}
}
