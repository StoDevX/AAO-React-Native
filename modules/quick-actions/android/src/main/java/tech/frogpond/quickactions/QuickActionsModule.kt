package tech.frogpond.quickactions

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Log
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.core.graphics.drawable.IconCompat
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import org.json.JSONObject

/** One quick action as JavaScript describes it. */
class QuickAction : Record {
  @Field
  val id: String = ""

  @Field
  val title: String = ""

  /** An SF Symbol's name on iOS; here, the name of a drawable of the app's, if it has one. */
  @Field
  val systemName: String? = null

  /** A custom symbol's name in the app's asset catalog on iOS; here, the name of a drawable of the app's. */
  @Field
  val assetName: String? = null

  /** The in-app route a tap opens, already percent-encoded. */
  @Field
  val href: String = ""
}

/**
 * The app icon's quick actions, as Android's dynamic shortcuts: the menu a
 * long press on the launcher icon opens.
 *
 * Each shortcut opens its route as a link into this app's own scheme, so it
 * reaches Expo Router the way any deep link does, from a cold launch or into
 * the running app, as SceneDelegate does on iOS.
 */
class QuickActionsModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("QuickActions")

    AsyncFunction("setQuickActions") { actions: List<QuickAction> ->
      val ctx = context
      val scheme = appScheme(ctx)
      // Launchers show only a few; the rest would be refused.
      val limit = ShortcutManagerCompat.getMaxShortcutCountPerActivity(ctx)
      val shortcuts = actions.take(limit).mapIndexed { rank, action ->
        val url = "$scheme://${action.href.trimStart('/')}"
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
          .setPackage(ctx.packageName)
        ShortcutInfoCompat.Builder(ctx, action.id)
          .setShortLabel(action.title)
          .setIcon(icon(ctx, action))
          .setIntent(intent)
          .setRank(rank)
          .build()
      }
      ShortcutManagerCompat.setDynamicShortcuts(ctx, shortcuts)
      Unit
    }
  }

  /**
   * The action's own drawable when the app has one by its name, so a symbol
   * can be given an Android twin, and the app's icon otherwise.
   */
  private fun icon(context: Context, action: QuickAction): IconCompat {
    for (name in listOfNotNull(action.assetName, action.systemName)) {
      val resource = drawableNamed(context, name)
      if (resource != 0) {
        return IconCompat.createWithResource(context, resource)
      }
    }
    return IconCompat.createWithResource(context, context.applicationInfo.icon)
  }

  /** A drawable whose name is `name` made a valid resource name: `fork.knife` looks for `fork_knife`. */
  @Suppress("DiscouragedApi")
  private fun drawableNamed(context: Context, name: String): Int {
    val resourceName = name.lowercase().replace(Regex("[^a-z0-9_]"), "_")
    return context.resources.getIdentifier(resourceName, "drawable", context.packageName)
  }

  /**
   * The app's URL scheme, which each app variant has its own of. Expo embeds
   * the app's config in the build's assets; without it, the package name,
   * which Expo's prebuild registers as a scheme too.
   */
  private fun appScheme(context: Context): String {
    try {
      val text = context.assets.open(CONFIG_FILE).bufferedReader(Charsets.UTF_8).use { it.readText() }
      val config = JSONObject(text)
      config.optJSONArray("scheme")?.optString(0)?.takeIf { it.isNotEmpty() }?.let { return it }
      config.optString("scheme").takeIf { it.isNotEmpty() }?.let { return it }
    } catch (e: Exception) {
      Log.w(TAG, "Could not read the app's scheme from its embedded config", e)
    }
    return context.packageName
  }

  companion object {
    private const val TAG = "QuickActions"
    private const val CONFIG_FILE = "app.config"
  }
}
