package tech.frogpond.dragtodismiss

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.view.MotionEvent
import android.view.VelocityTracker
import android.view.View
import android.view.ViewConfiguration
import android.view.ViewGroup
import android.view.animation.DecelerateInterpolator
import com.facebook.react.uimanager.events.NativeGestureUtil
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import kotlin.math.abs
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sign

class DragToDismissModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DragToDismiss")

    View(DragToDismissView::class) {
      Events("onDismiss", "onDragStart", "onDragCancel")
    }
  }
}

/**
 * Lets a vertical drag carry its React Native children away, as Photos does
 * with a picture: the children follow the finger and the view's own
 * background fades with the distance. Let go far enough, or fast enough, and
 * the children slide off and the view reports a dismissal; otherwise they
 * spring back.
 *
 * A scroll view inside that can still scroll the way the finger is going
 * takes the touch first, so a long or zoomed picture pans rather than leaving.
 *
 * The children move by translating the canvas they are drawn on, which React
 * Native never touches, so a re-render mid-drag cannot snap them back; their
 * own translation is left alone. The background stays put because the view
 * draws it itself, before its children. It fades through the background
 * drawable's alpha, which React Native's background drawable passes to the
 * colour it paints.
 */
@SuppressLint("ViewConstructor")
class DragToDismissView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val onDismiss by EventDispatcher()
  private val onDragStart by EventDispatcher()
  private val onDragCancel by EventDispatcher()

  private val touchSlop = ViewConfiguration.get(context).scaledTouchSlop
  private val density = resources.displayMetrics.density

  private var velocityTracker: VelocityTracker? = null
  private var downX = 0f
  private var downY = 0f
  /** The finger's y at which the children sit where they rest. */
  private var startY = 0f
  private var dragging = false
  /** The gesture under way was found not to be a drag down or up, so it is left alone until it ends. */
  private var declined = false
  private var dismissed = false

  /** How far the children are drawn from where they rest, in pixels. */
  private var offset = 0f
  /** The background's alpha, from 0 to 255, as this view last set it. */
  private var backgroundAlpha = 255
  private var animator: ValueAnimator? = null

  override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
    return track(ev)
  }

  @SuppressLint("ClickableViewAccessibility")
  override fun onTouchEvent(ev: MotionEvent): Boolean {
    track(ev)
    // Taking the gesture's start, when no child did, is what brings its moves here.
    return true
  }

  /** Follows one gesture, and returns whether it is a drag of this view's. */
  private fun track(ev: MotionEvent): Boolean {
    when (ev.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        dragging = false
        declined = dismissed || animator?.isRunning == true
        downX = ev.x
        downY = ev.y
        velocityTracker?.recycle()
        velocityTracker = VelocityTracker.obtain().also { it.addMovement(ev) }
      }
      MotionEvent.ACTION_POINTER_DOWN -> {
        // A second finger is a pinch, which is the scroll view's to zoom.
        if (!dragging) {
          declined = true
        }
      }
      MotionEvent.ACTION_MOVE -> {
        velocityTracker?.addMovement(ev)
        if (dragging) {
          move(ev.y - startY)
        } else if (!declined) {
          val dx = ev.x - downX
          val dy = ev.y - downY
          if (abs(dx) > touchSlop || abs(dy) > touchSlop) {
            if (abs(dy) > abs(dx) && !anyChildCanScroll(this, dy)) {
              begin(ev, dy)
            } else {
              declined = true
            }
          }
        }
      }
      MotionEvent.ACTION_UP -> {
        if (dragging) {
          val tracker = velocityTracker
          tracker?.addMovement(ev)
          tracker?.computeCurrentVelocity(1000)
          finish(tracker?.yVelocity ?: 0f)
          NativeGestureUtil.notifyNativeGestureEnded(this, ev)
        }
        reset()
      }
      MotionEvent.ACTION_CANCEL -> {
        if (dragging) {
          springBack()
          NativeGestureUtil.notifyNativeGestureEnded(this, ev)
        }
        reset()
      }
    }
    return dragging
  }

  private fun reset() {
    dragging = false
    declined = false
    velocityTracker?.recycle()
    velocityTracker = null
  }

  private fun begin(ev: MotionEvent, dy: Float) {
    dragging = true
    animator?.cancel()
    // Measured from where the drag was recognised, so the children do not jump by the slop.
    startY = downY + sign(dy) * touchSlop
    parent?.requestDisallowInterceptTouchEvent(true)
    // Cancels React Native's responder, as a scroll view does when it starts to scroll.
    NativeGestureUtil.notifyNativeGestureStarted(this, ev)
    move(ev.y - startY)
    onDragStart(emptyMap())
  }

  private fun finish(velocityY: Float) {
    val speed = velocityY / density
    val far = abs(offset) > height * DISMISS_DISTANCE
    val flung = abs(speed) > DISMISS_SPEED && (speed > 0) == (offset > 0)
    if (far || flung) {
      slideAway(downward = if (offset != 0f) offset > 0 else speed > 0)
    } else {
      springBack()
    }
  }

  private fun move(to: Float) {
    offset = to
    val fadeLength = height * FADE_DISTANCE
    val faded = if (fadeLength > 0) min(abs(to) / fadeLength, 1f) else 1f
    setBackgroundAlpha(((1 - faded) * 255).roundToInt())
    invalidate()
  }

  private fun springBack() {
    onDragCancel(emptyMap())
    animateTo(to = 0f, alpha = 255, duration = 350L)
  }

  private fun slideAway(downward: Boolean) {
    dismissed = true
    val distance = height.toFloat() * if (downward) 1 else -1
    animateTo(to = distance, alpha = 0, duration = 200L) {
      onDismiss(emptyMap())
    }
  }

  private fun animateTo(to: Float, alpha: Int, duration: Long, completion: (() -> Unit)? = null) {
    animator?.cancel()
    val fromOffset = offset
    val fromAlpha = backgroundAlpha
    animator = ValueAnimator.ofFloat(0f, 1f).apply {
      this.duration = duration
      interpolator = DecelerateInterpolator()
      addUpdateListener { animation ->
        val progress = animation.animatedValue as Float
        offset = fromOffset + (to - fromOffset) * progress
        setBackgroundAlpha((fromAlpha + (alpha - fromAlpha) * progress).roundToInt())
        invalidate()
      }
      addListener(object : AnimatorListenerAdapter() {
        private var cancelled = false

        override fun onAnimationCancel(animation: Animator) {
          cancelled = true
        }

        override fun onAnimationEnd(animation: Animator) {
          if (!cancelled) {
            completion?.invoke()
          }
        }
      })
      start()
    }
  }

  /**
   * React Native sets a new background drawable whenever the view's style
   * changes, which arrives opaque; this fades whichever is current.
   */
  private fun setBackgroundAlpha(alpha: Int) {
    backgroundAlpha = alpha.coerceIn(0, 255)
    background?.alpha = backgroundAlpha
  }

  override fun dispatchDraw(canvas: Canvas) {
    if (offset == 0f) {
      super.dispatchDraw(canvas)
      return
    }
    val saved = canvas.save()
    canvas.translate(0f, offset)
    super.dispatchDraw(canvas)
    canvas.restoreToCount(saved)
  }

  override fun onDetachedFromWindow() {
    animator?.cancel()
    animator = null
    super.onDetachedFromWindow()
  }

  /**
   * Whether any view under `view` could scroll the content the way a finger
   * moving by `dy` would take it: a drag down scrolls towards the top.
   */
  private fun anyChildCanScroll(view: ViewGroup, dy: Float): Boolean {
    val direction = if (dy > 0) -1 else 1
    val queue = ArrayDeque<View>()
    for (i in 0 until view.childCount) {
      queue.addLast(view.getChildAt(i))
    }
    while (queue.isNotEmpty()) {
      val next = queue.removeFirst()
      if (next.canScrollVertically(direction)) {
        return true
      }
      if (next is ViewGroup) {
        for (i in 0 until next.childCount) {
          queue.addLast(next.getChildAt(i))
        }
      }
    }
    return false
  }

  companion object {
    /** How far down or up a slow drag must go to dismiss, as a fraction of the view's height. */
    private const val DISMISS_DISTANCE = 0.15f
    /** How fast a flick must be moving, in dp a second, to dismiss from any distance. */
    private const val DISMISS_SPEED = 800f
    /** The distance, as a fraction of the view's height, at which the background has faded out. */
    private const val FADE_DISTANCE = 0.5f
  }
}
