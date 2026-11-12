package tech.frogpond.messissuetile

import android.graphics.Bitmap
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageShader
import androidx.compose.ui.graphics.Outline
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.ShaderBrush
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.TileMode
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import java.util.Random
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.sin

/** Where the sheet is folded, as a share of its height. */
internal const val FOLD_LINE = 0.7f

/**
 * The sheet's colours in one appearance. Light is warm newsprint with near-black ink; dark is dark
 * grey paper with pale ink. These are the paper's own colours, not theme roles: newsprint looks
 * like newsprint under any wallpaper.
 */
internal class PaperPalette(dark: Boolean) {
  val paper: Color
  val ink: Color
  val rule: Color
  val columnRule: Color
  val special: Color
  val edgeNear: Color
  val edgeFar: Color
  val shadow: Color
  val crease: Color
  val placeholder: Color

  init {
    if (dark) {
      paper = Color(0.173f, 0.169f, 0.161f)
      ink = Color(0.914f, 0.902f, 0.875f)
      rule = Color(0.741f, 0.722f, 0.678f)
      columnRule = Color(0.29f, 0.282f, 0.267f)
      special = Color(1.0f, 0.42f, 0.369f)
      edgeNear = Color(0.22f, 0.216f, 0.204f)
      edgeFar = Color(0.267f, 0.259f, 0.243f)
      shadow = Color.Black.copy(alpha = 0.6f)
      crease = Color.Black.copy(alpha = 0.35f)
      placeholder = Color(0.22f, 0.216f, 0.204f)
    } else {
      paper = Color(0.945f, 0.925f, 0.878f)
      ink = Color(0.086f, 0.075f, 0.059f)
      rule = Color(0.086f, 0.075f, 0.059f)
      columnRule = Color(0.788f, 0.757f, 0.69f)
      special = Color(0.753f, 0.224f, 0.169f)
      edgeNear = Color(0.867f, 0.839f, 0.769f)
      edgeFar = Color(0.784f, 0.753f, 0.686f)
      shadow = Color.Black.copy(alpha = 0.25f)
      crease = Color.Black.copy(alpha = 0.12f)
      placeholder = Color(0.878f, 0.855f, 0.8f)
    }
  }

  companion object {
    private val light = PaperPalette(false)
    private val darkPalette = PaperPalette(true)

    fun of(dark: Boolean): PaperPalette = if (dark) darkPalette else light
  }
}

/**
 * Noise tiled over every sheet: fine speckle for the pulp, streaks for its fibres, and a coarser
 * grain for photos. Made once in memory rather than shipped as files, so the module carries no
 * assets. Each pixel is black or white at a small alpha, so it darkens and lightens the paper
 * under plain source-over drawing: blend modes such as multiply and soft light behave differently
 * before Android 10, and would turn the paper itself translucent there.
 */
internal object Textures {
  private const val SIDE = 256

  private fun noise(stretchX: Int, strength: Float, seed: Long): ShaderBrush {
    val random = Random(seed)
    // One value per stretched column, so fibres run as horizontal streaks.
    val columns = (SIDE + stretchX - 1) / stretchX
    val pixels = IntArray(SIDE * SIDE)
    for (y in 0 until SIDE) {
      val row = FloatArray(columns) { random.nextFloat() }
      for (x in 0 until SIDE) {
        val grey = row[x / stretchX]
        val alpha = ((grey - 0.5f) * 2f * strength).let { if (it < 0) -it else it }
        val a = (alpha.coerceIn(0f, 1f) * 255).toInt()
        val c = if (grey > 0.5f) 0xFF else 0x00
        pixels[y * SIDE + x] = (a shl 24) or (c shl 16) or (c shl 8) or c
      }
    }
    val bitmap = Bitmap.createBitmap(pixels, SIDE, SIDE, Bitmap.Config.ARGB_8888)
    return ShaderBrush(ImageShader(bitmap.asImageBitmap(), TileMode.Repeated, TileMode.Repeated))
  }

  val pulp: ShaderBrush by lazy { noise(stretchX = 1, strength = 0.09f, seed = 1) }
  val fibres: ShaderBrush by lazy { noise(stretchX = 9, strength = 0.06f, seed = 2) }
  val grain: ShaderBrush by lazy { noise(stretchX = 1, strength = 0.22f, seed = 3) }
}

/** A small xorshift generator, so a sheet's edges wander the same way every time. */
internal class SeededRandom(seed: Int) {
  private var state: Int = if (seed == 0) 0x9E3779B9.toInt() else seed

  /** A number in [0, 1). */
  fun next(): Float {
    state = state xor (state shl 13)
    state = state xor (state ushr 17)
    state = state xor (state shl 5)
    return (state.toUInt().toDouble() / UInt.MAX_VALUE.toDouble()).toFloat()
  }
}

/**
 * A sheet's outline: a rectangle whose edges wander by half a dp or so, as cut newsprint's do,
 * with one corner turned down when the sheet has one. A [Shape], so it clips the sheet, shapes
 * its elevation shadow and bounds its ripple.
 */
internal class PaperOutline(
  private val seed: Int,
  private val dogEar: DogEar?,
  /** How far along each edge a turned corner reaches */
  private val earSize: Dp
) : Shape {
  override fun createOutline(size: Size, layoutDirection: LayoutDirection, density: Density): Outline {
    return Outline.Generic(path(size, density))
  }

  fun path(size: Size, density: Density): Path {
    val random = SeededRandom(seed)
    val step = with(density) { 12.dp.toPx() }
    val wander = with(density) { 0.6.dp.toPx() }
    val ear = with(density) { earSize.toPx() }

    fun edge(start: Offset, end: Offset): List<Offset> {
      val length = hypot(end.x - start.x, end.y - start.y)
      // A layout can measure a zero-size sheet before its real one; an edge of no length has no
      // direction to wander in.
      if (length <= 0f) return listOf(start)
      val count = max((length / step).toInt(), 1)
      // Level with the edge, so the wander never cuts into the sheet's corners.
      val normal = Offset(-(end.y - start.y) / length, (end.x - start.x) / length)
      return (0 until count).map { index ->
        val t = index.toFloat() / count
        val shift = if (index == 0) 0f else (random.next() * 2 - 1) * wander
        Offset(
          start.x + (end.x - start.x) * t + normal.x * shift,
          start.y + (end.y - start.y) * t + normal.y * shift
        )
      }
    }

    val topLeft = Offset(0f, 0f)
    val topRight = Offset(size.width, 0f)
    val bottomRight = Offset(size.width, size.height)
    val bottomLeft = Offset(0f, size.height)

    // Each corner, or the two points of its turned-down cut.
    fun corner(point: Offset, which: DogEar, before: Offset, after: Offset): List<Offset> {
      if (which != dogEar) return listOf(point)
      return listOf(toward(point, before, ear), toward(point, after, ear))
    }

    val points = mutableListOf<Offset>()
    points += edge(topLeft, topRight)
    points += corner(topRight, DogEar.TOP_RIGHT, topLeft, bottomRight)
    points += edge(topRight, bottomRight).drop(1)
    points += corner(bottomRight, DogEar.BOTTOM_RIGHT, topRight, bottomLeft)
    points += edge(bottomRight, bottomLeft).drop(1)
    points += corner(bottomLeft, DogEar.BOTTOM_LEFT, bottomRight, topLeft)
    points += edge(bottomLeft, topLeft).drop(1)

    return Path().apply {
      points.forEachIndexed { index, point ->
        if (index == 0) moveTo(point.x, point.y) else lineTo(point.x, point.y)
      }
      close()
    }
  }

  override fun equals(other: Any?): Boolean =
    other is PaperOutline && other.seed == seed && other.dogEar == dogEar && other.earSize == earSize

  override fun hashCode(): Int = (seed * 31 + (dogEar?.hashCode() ?: 0)) * 31 + earSize.hashCode()
}

private fun toward(from: Offset, to: Offset, distance: Float): Offset {
  val length = hypot(to.x - from.x, to.y - from.y)
  if (length <= 0f) return from
  return Offset(
    from.x + (to.x - from.x) / length * distance,
    from.y + (to.y - from.y) / length * distance
  )
}

/** The paper itself: its colour, pulp and fibres. */
internal fun DrawScope.drawPaper(palette: PaperPalette) {
  drawRect(palette.paper)
  drawRect(Textures.pulp)
  drawRect(Textures.fibres)
}

/**
 * The underside of a turned-down corner: a triangle of paper lying on the sheet, a shade darker,
 * with a soft shadow along its fold.
 */
internal fun DrawScope.drawDogEarFlap(dogEar: DogEar?, earSize: Dp, palette: PaperPalette) {
  if (dogEar == null) return
  val ear = earSize.toPx()
  val w = size.width
  val h = size.height
  val (corner, a, b) = when (dogEar) {
    DogEar.TOP_RIGHT -> Triple(Offset(w, 0f), Offset(w - ear, 0f), Offset(w, ear))
    DogEar.BOTTOM_RIGHT -> Triple(Offset(w, h), Offset(w, h - ear), Offset(w - ear, h))
    DogEar.BOTTOM_LEFT -> Triple(Offset(0f, h), Offset(ear, h), Offset(0f, h - ear))
  }
  // The flap is the cut corner folded over its own crease, onto the sheet.
  val tip = Offset(a.x + b.x - corner.x, a.y + b.y - corner.y)
  val flap = Path().apply {
    moveTo(a.x, a.y)
    lineTo(tip.x, tip.y)
    lineTo(b.x, b.y)
    close()
  }
  // A soft shadow, as strokes widening and fading round the flap.
  for ((width, alpha) in listOf(4.dp to 0.25f, 2.5.dp to 0.35f, 1.dp to 0.5f)) {
    drawPath(flap, palette.shadow.copy(alpha = palette.shadow.alpha * alpha), style = Stroke(width.toPx()))
  }
  drawPath(flap, palette.edgeNear)
}

/**
 * The lines of an old crumple, laid over everything on the sheet -- the photo and the type too --
 * as a soft shadow on one side of each line and a faint catch of light on the other. Each line is
 * a few strokes widening and fading, which reads as a blur on every Android version.
 */
internal fun DrawScope.drawCreases(creases: List<Crease>, dark: Boolean) {
  if (creases.isEmpty()) return
  val shadow = if (dark) 0.35f else 0.14f
  val light = if (dark) 0.06f else 0.35f
  for (crease in creases) {
    val strength = crease.strength.toFloat().coerceIn(0f, 1f)
    for ((width, share) in listOf(6.dp to 0.3f, 4.dp to 0.4f, 2.dp to 0.5f)) {
      val (from, to) = creaseLine(crease, (-1.2).dp.toPx())
      drawLine(
        Color.Black.copy(alpha = shadow * strength * share), from, to,
        strokeWidth = width.toPx(), cap = StrokeCap.Round
      )
    }
    for ((width, share) in listOf(2.5.dp to 0.4f, 1.dp to 0.7f)) {
      val (from, to) = creaseLine(crease, 1.2.dp.toPx())
      drawLine(
        Color.White.copy(alpha = light * strength * share), from, to,
        strokeWidth = width.toPx(), cap = StrokeCap.Round
      )
    }
  }
}

/**
 * The crease as a line across the whole sheet through its point on the sheet's middle, moved
 * `shift` pixels to one side of itself.
 */
private fun DrawScope.creaseLine(crease: Crease, shift: Float): Pair<Offset, Offset> {
  val angle = crease.angle * PI / 180
  val centre = Offset(size.width / 2, crease.position.toFloat() * size.height)
  val reach = size.width + size.height
  val dx = (cos(angle) * reach).toFloat()
  val dy = (sin(angle) * reach).toFloat()
  val nx = (-sin(angle) * shift).toFloat()
  val ny = (cos(angle) * shift).toFloat()
  return Offset(centre.x - dx + nx, centre.y - dy + ny) to Offset(centre.x + dx + nx, centre.y + dy + ny)
}

/** The shade a fold casts: a dark line along the fold, then a shadow fading down the bent part. */
internal fun DrawScope.drawFoldShade(palette: PaperPalette) {
  val y = size.height * FOLD_LINE
  val line = 1.dp.toPx()
  drawRect(palette.crease, topLeft = Offset(0f, y - line), size = Size(size.width, line))
  val fade = (size.height - y) * 0.3f
  if (fade > 0f) {
    drawRect(
      Brush.verticalGradient(
        listOf(palette.crease.copy(alpha = palette.crease.alpha * 0.6f), Color.Transparent),
        startY = y,
        endY = y + fade
      ),
      topLeft = Offset(0f, y),
      size = Size(size.width, fade)
    )
  }
}
