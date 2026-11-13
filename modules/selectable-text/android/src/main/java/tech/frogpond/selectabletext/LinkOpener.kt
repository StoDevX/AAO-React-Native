package tech.frogpond.selectabletext

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Log
import androidx.browser.customtabs.CustomTabsIntent

private const val TAG = "SelectableText"

/**
 * Opens a tapped link the way the iOS view does: a web link in an in-app
 * browser (a Custom Tab, Android's counterpart to the Safari view the app's
 * `openURLAction` opens), anything else -- `tel:`, `mailto:` -- in whatever
 * app handles it.
 */
internal fun openLink(context: Context, url: String) {
  val uri = Uri.parse(url)
  val scheme = uri.scheme?.lowercase()
  val needsNewTask = context !is Activity

  if (scheme == "http" || scheme == "https") {
    val customTab = CustomTabsIntent.Builder()
      .setShowTitle(true)
      .setColorScheme(CustomTabsIntent.COLOR_SCHEME_SYSTEM)
      .setShareState(CustomTabsIntent.SHARE_STATE_ON)
      .build()
    if (needsNewTask) {
      customTab.intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    try {
      customTab.launchUrl(context, uri)
      return
    } catch (e: ActivityNotFoundException) {
      // No browser offers Custom Tabs; a plain view intent may still find one.
      Log.w(TAG, "No Custom Tabs browser for $url", e)
    }
  }

  val intent = Intent(Intent.ACTION_VIEW, uri)
  if (needsNewTask) {
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
  }
  try {
    context.startActivity(intent)
  } catch (e: ActivityNotFoundException) {
    Log.w(TAG, "Nothing can open $url", e)
  }
}
