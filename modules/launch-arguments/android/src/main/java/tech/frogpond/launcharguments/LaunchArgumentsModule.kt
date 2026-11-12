package tech.frogpond.launcharguments

import android.content.pm.ApplicationInfo
import android.os.Bundle
import android.util.Log
import expo.modules.core.utilities.EmulatorUtilities
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject

/**
 * The launch's test and chaos settings, for JavaScript to read.
 *
 * iOS passes these as process arguments (`--uitesting`, `--chaos-seed 42`).
 * Android has no process arguments for an app, so they arrive as extras on
 * the intent that launched the activity, named as the iOS flags are without
 * their dashes:
 *
 * ```
 * adb shell am start -n <package>/.MainActivity \
 *   --ez uitesting true --es campus edu.stolaf --es chaos-seed 42
 * ```
 *
 * A flag is on when its extra is present and not false: `--ez uitesting true`
 * and `--es uitesting 1` both turn it on. A value may come as any extra type
 * (`--es`, `--ei`, `--ef`) and is read as text. An extra named with the
 * dashes (`--es --campus edu.stolaf`) is read too.
 *
 * The UI tests' in-place reset (UITestResetChannel.swift) rides on a Darwin
 * notification and a directory the simulator shares with the test runner,
 * neither of which Android has, so here a reset is never requested; a test
 * relaunches the activity instead.
 */
class LaunchArgumentsModule : Module() {
  /**
   * The extras of the intent that launched the activity, kept once found, so
   * an intent the activity is handed later (a deep link) cannot change them.
   */
  private var launchExtras: Bundle? = null

  private val extras: Bundle?
    get() {
      launchExtras?.let { return it }
      return appContext.currentActivity?.intent?.extras?.also { launchExtras = it }
    }

  override fun definition() = ModuleDefinition {
    Name("LaunchArguments")

    Events("onResetRequested")

    // There is no reset channel on Android, so nothing is left to clear and no
    // runner waits for an answer.
    AsyncFunction("finishReset") { _: String, _: String ->
    }

    Function("takePendingResetURL") {
      null as String?
    }

    // The campus a UI test names with `campus`, by domain. Nil outside UI tests.
    Function("uiTestCampus") {
      if (flag("uitesting")) value("campus") else null
    }

    // A request the fixtures could not answer. With no channel directory to
    // write it to, it goes to the log, one JSON object per line as the iOS
    // runner reads them, for the runner to collect with
    // `adb logcat -s LaunchArguments:W`.
    Function("reportMissingFixture") { campus: String, key: String ->
      if (flag("uitesting")) {
        val line = JSONObject().put("campus", campus).put("key", key).toString()
        Log.w(TAG, "missing-fixture $line")
      }
    }

    Constant("isUITesting") {
      flag("uitesting")
    }

    // Where a feature with fixtures gets its data: recorded live under
    // record-fixtures, served from its fixtures under uitesting, and the
    // network otherwise.
    Constant("fixtureMode") {
      when {
        flag("record-fixtures") -> "record"
        flag("uitesting") -> "serve"
        else -> "live"
      }
    }

    // A chaos run: the test driver drives the app while source/chaos injects
    // faults. See source/chaos/install.ts.
    Constant("isChaos") {
      flag("chaos")
    }

    Constant("chaosSeed") {
      value("chaos-seed")?.toIntOrNull() ?: 0
    }

    Constant("chaosLaunch") {
      value("chaos-launch")?.toIntOrNull() ?: 0
    }

    Constant("chaosMode") {
      if (flag("chaos-replay")) "replay" else "record"
    }

    Constant("chaosFaultRate") {
      value("chaos-fault-rate")?.toDoubleOrNull() ?: 0.25
    }

    Constant("chaosProfile") {
      if (value("chaos-profile") == "session") "session" else "fuzz"
    }

    // What the binary was built as. NODE_ENV only says how the JS was bundled,
    // and local builds embed a release bundle too.
    Constant("isSimulator") {
      EmulatorUtilities.isRunningOnEmulator()
    }

    Constant("isDebugNativeBuild") {
      val info = appContext.reactContext?.applicationInfo
      info != null && (info.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
    }
  }

  /** The extra named `name`, or `--name`, as text; null when the launch had neither. */
  @Suppress("DEPRECATION")
  private fun value(name: String): String? {
    val extras = extras ?: return null
    // Bundle.get is deprecated for its lack of type safety, which is the point
    // here: am start sends a number as a string, an int or a float, depending
    // on the flag it was given.
    val raw = extras.get(name) ?: extras.get("--$name") ?: return null
    return raw.toString()
  }

  /** Whether the extra named `name`, or `--name`, is present and not false. */
  private fun flag(name: String): Boolean {
    val text = value(name) ?: return false
    return text.lowercase() !in setOf("false", "0", "no")
  }

  companion object {
    private const val TAG = "LaunchArguments"
  }
}
