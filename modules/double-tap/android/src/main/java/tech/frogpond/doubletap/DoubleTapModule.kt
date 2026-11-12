package tech.frogpond.doubletap

import android.annotation.SuppressLint
import android.content.Context
import android.view.GestureDetector
import android.view.MotionEvent
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

class DoubleTapModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DoubleTap")

    View(DoubleTapView::class) {
      Events("onDoubleTap", "onSingleTap")
    }
  }
}

/**
 * Reports a double tap anywhere on its React Native children, and where it
 * landed in the view's own coordinates, in density-independent pixels (React
 * Native's points), and a single tap that turned out not to be the first of
 * two.
 *
 * Android's GestureDetector counts the taps itself, and holds a single tap
 * back until the double-tap timeout has passed, so a double tap never
 * reports a single tap first. Every event of a gesture is shown to it before
 * the children see it, and the children see all of them as before: React
 * Native's touches are dispatched from the root view, not from here.
 */
@SuppressLint("ViewConstructor")
class DoubleTapView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val onDoubleTap by EventDispatcher()
  private val onSingleTap by EventDispatcher()

  private val detector = GestureDetector(
    context,
    object : GestureDetector.SimpleOnGestureListener() {
      override fun onDown(e: MotionEvent): Boolean = true

      override fun onSingleTapConfirmed(e: MotionEvent): Boolean {
        this@DoubleTapView.onSingleTap(emptyMap())
        return true
      }

      override fun onDoubleTap(e: MotionEvent): Boolean {
        val density = resources.displayMetrics.density
        // Qualified, since the listener has an onDoubleTap of its own.
        this@DoubleTapView.onDoubleTap(mapOf("x" to e.x / density, "y" to e.y / density))
        return true
      }
    }
  )

  override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
    detector.onTouchEvent(ev)
    super.dispatchTouchEvent(ev)
    // The detector needs the whole gesture, up to the finger lifting, so this
    // view takes it even when no child does. A scroll view around it can still
    // intercept a drag, which sends the detector a cancel.
    return true
  }
}
