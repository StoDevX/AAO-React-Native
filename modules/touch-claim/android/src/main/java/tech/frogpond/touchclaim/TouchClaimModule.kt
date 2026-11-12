package tech.frogpond.touchclaim

import android.annotation.SuppressLint
import android.content.Context
import android.view.MotionEvent
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.views.ExpoView
import kotlin.math.hypot
import kotlin.math.min

class TouchClaimModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TouchClaim")

    View(TouchClaimView::class) {}
  }
}

/**
 * Keeps the sheet or scroll view around its children from taking a touch on
 * them as a drag.
 *
 * A scroll view, or a bottom sheet's behaviour, takes a gesture by
 * intercepting it once the finger has moved past the touch slop, which
 * cancels React Native's own responder, so a gesture that turns the children
 * loses its touch. When a finger lands on this view, it asks every ancestor
 * not to intercept the rest of that gesture. Android clears the request when
 * the finger lifts, so the next touch starts afresh. React Native's touches
 * are dispatched from the root view, so they carry on untouched.
 *
 * Only a touch on the disc inscribed in the view claims: the corners of its
 * square leave the sheet and the scroll view their drag.
 */
@SuppressLint("ViewConstructor")
class TouchClaimView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  /** Whether the gesture under way began on the disc, and is this view's to keep. */
  private var claiming = false

  override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
    if (ev.actionMasked == MotionEvent.ACTION_DOWN) {
      claiming = isOnDisc(ev.x, ev.y)
      if (claiming) {
        parent?.requestDisallowInterceptTouchEvent(true)
      }
    }
    val handled = super.dispatchTouchEvent(ev)
    val wasClaiming = claiming
    if (ev.actionMasked == MotionEvent.ACTION_UP || ev.actionMasked == MotionEvent.ACTION_CANCEL) {
      claiming = false
    }
    // The rest of the gesture comes here only if this view takes its start; a
    // scroll view that took it instead would scroll from its own onTouchEvent,
    // which the request above does not stop.
    return handled || wasClaiming
  }

  /** Whether the point, in this view's coordinates, falls inside the circle that fits its bounds. */
  private fun isOnDisc(x: Float, y: Float): Boolean {
    val radius = min(width, height) / 2f
    return hypot(x - width / 2f, y - height / 2f) <= radius
  }
}
