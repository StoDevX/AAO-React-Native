package tech.frogpond.messissuetile

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sin

/** A ring's three inks: the faint wash inside it, the soft halo along its edge, and the edge. */
private class StainInks(val fill: Color, val halo: Color, val edge: Color) {
  companion object {
    private fun rgba(r: Int, g: Int, b: Int, a: Float) = Color(r, g, b).copy(alpha = a)

    private val coffeeLight = StainInks(rgba(160, 105, 50, 0.10f), rgba(125, 78, 32, 0.22f), rgba(110, 66, 25, 0.45f))
    private val teaLight = StainInks(rgba(200, 150, 60, 0.08f), rgba(185, 135, 50, 0.20f), rgba(165, 115, 35, 0.35f))
    private val coffeeDark = StainInks(rgba(150, 100, 60, 0.10f), rgba(170, 115, 70, 0.22f), rgba(200, 145, 95, 0.42f))

    // Tea's amber glows on grey paper, so it is drawn thin and quiet there, with no halo.
    private val teaDark = StainInks(rgba(150, 130, 95, 0.05f), Color.Transparent, rgba(165, 145, 110, 0.22f))

    fun of(kind: StainKind, dark: Boolean): StainInks? = when (kind) {
      StainKind.NONE -> null
      StainKind.COFFEE -> if (dark) coffeeDark else coffeeLight
      StainKind.TEA -> if (dark) teaDark else teaLight
    }
  }
}

/** A ring bigger than this looks like a saucer, not a cup, on the wide top tile. */
private val LARGEST_RADIUS = 46.dp

/** The rings a cup leaves, drawn over the sheet and clipped with it. */
internal fun DrawScope.drawStains(marks: List<StainMark>, kind: StainKind, dark: Boolean) {
  val inks = StainInks.of(kind, dark) ?: return
  if (marks.isEmpty()) return
  for (mark in marks) {
    val radius = min(mark.radius.toFloat() * size.width, LARGEST_RADIUS.toPx())
    val centre = Offset(mark.x.toFloat() * size.width, mark.y.toFloat() * size.height)
    val ring = ringPoints(centre, radius, mark.rotation * PI / 180)
    drawPath(closed(ring), inks.fill)
    val edge = arc(ring, mark.arcStart, mark.arcLength)
    if (inks.halo.alpha > 0f) {
      // The halo, soft as a blur: strokes widening and fading.
      for ((width, share) in listOf(9.dp to 0.3f, 7.dp to 0.4f, 4.dp to 0.5f)) {
        drawPath(
          edge, inks.halo.copy(alpha = inks.halo.alpha * share),
          style = Stroke(width.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round)
        )
      }
    }
    drawPath(edge, inks.edge, style = Stroke(1.3.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round))
  }
}

/** A slightly wobbly circle, as a cup's rim leaves it. */
private fun ringPoints(centre: Offset, radius: Float, phase: Double): List<Offset> =
  (0..72).map { step ->
    val angle = step / 72.0 * 2 * PI
    val wobble = 1 + 0.025 * sin(2 * angle + phase) + 0.015 * sin(5 * angle + phase * 1.7)
    val r = radius * wobble
    Offset((centre.x + r * cos(angle)).toFloat(), (centre.y + r * sin(angle)).toFloat())
  }

private fun closed(points: List<Offset>): Path = Path().apply {
  points.forEachIndexed { index, point ->
    if (index == 0) moveTo(point.x, point.y) else lineTo(point.x, point.y)
  }
  close()
}

/** The part of the ring whose edge shows: a worn ring is never drawn all the way round. */
private fun arc(points: List<Offset>, start: Double, length: Double): Path {
  val count = points.size - 1
  val first = (start * count).toInt().mod(count)
  val steps = (length * count).toInt().coerceAtLeast(0)
  return Path().apply {
    for (index in 0..steps) {
      val point = points[(first + index) % count]
      if (index == 0) moveTo(point.x, point.y) else lineTo(point.x, point.y)
    }
  }
}
