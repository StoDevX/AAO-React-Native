package tech.frogpond.debugtools

import android.content.Context
import android.content.SharedPreferences
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * DebugSwift's controls, for JavaScript to reach.
 *
 * DebugSwift is an iOS-only Swift package, and Android has no in-app debugger
 * to stand in for it: its network, layout and logging tools are Android
 * Studio's, through `adb`. So DebugSwift is never available here and never
 * runs, and the Developer screen, which asks `isAvailable` first, leaves its
 * section out. The switch is still kept, so the JavaScript reads back what it
 * wrote, as it would on iOS.
 */
class DebugToolsModule : Module() {
  private val preferences: SharedPreferences?
    get() = appContext.reactContext?.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)

  override fun definition() = ModuleDefinition {
    Name("DebugTools")

    Function("isAvailable") {
      false
    }

    Function("isEnabled") {
      preferences?.getBoolean(ENABLED_KEY, false) ?: false
    }

    AsyncFunction("isRunning") {
      false
    }

    AsyncFunction("setEnabled") { enabled: Boolean ->
      preferences?.edit()?.putBoolean(ENABLED_KEY, enabled)?.apply()
      Unit
    }

    // Nothing to open: DebugSwift never runs on Android.
    AsyncFunction("openDebugger") {
    }

    // Nothing to show: DebugSwift never runs on Android.
    AsyncFunction("setFloatingButtonEnabled") { _: Boolean, _: String?, _: String? ->
    }
  }

  companion object {
    private const val PREFERENCES = "DebugTools"

    /** The Developer screen's switch, named as iOS names its UserDefaults key. */
    private const val ENABLED_KEY = "DebugSwiftEnabled"
  }
}
