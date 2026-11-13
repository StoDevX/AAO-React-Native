package tech.frogpond.messissuetile

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.OptimizedRecord

/**
 * Where one stain sits, as shares of the tile's size. Worked out in TypeScript from the issue's
 * day, so the same issue always stains the same way.
 */
@OptimizedRecord
data class StainMark(
  @Field val x: Double = 0.5,
  @Field val y: Double = 0.5,
  /** The ring's radius, as a share of the tile's width */
  @Field val radius: Double = 0.24,
  /** Turns the ring's wobble, in degrees */
  @Field val rotation: Double = 0.0,
  /** Where the ring's drawn edge starts, and how much of the circle it runs, as shares of a turn */
  @Field val arcStart: Double = 0.0,
  @Field val arcLength: Double = 0.8
) : Record

/** A line where the sheet was once crumpled; see `SheetShape` in index.tsx. */
@OptimizedRecord
data class Crease(
  /** Where it crosses the sheet's middle, as a share of the sheet's height */
  @Field val position: Double = 0.5,
  /** Its slope, in degrees from level */
  @Field val angle: Double = 0.0,
  /** How deep it shows, from faint to plain */
  @Field val strength: Double = 0.5
) : Record

/** A corner turned down, as a handled sheet's are. */
enum class DogEar(val value: String) : Enumerable {
  TOP_RIGHT("topRight"),
  BOTTOM_RIGHT("bottomRight"),
  BOTTOM_LEFT("bottomLeft")
}

/**
 * How one issue's sheet has been handled, worked out in TypeScript from the issue's day so a
 * sheet looks the same every time it is drawn.
 */
@OptimizedRecord
data class SheetShape(
  /** Degrees the whole sheet sits turned, either way */
  @Field val tilt: Double = 0.0,
  @Field val dogEar: DogEar? = null,
  @Field val creases: List<Crease> = emptyList(),
  /** Seeds the small wander of the sheet's edges */
  @Field val edgeSeed: Double = 0.0,
  /** Degrees the part below the fold bends back */
  @Field val bend: Double = 6.0
) : Record

/** What an issue's tile shows for the stories read: coffee rings, tea rings, or nothing. */
enum class StainKind(val value: String) : Enumerable {
  COFFEE("coffee"),
  TEA("tea"),
  NONE("none")
}

/**
 * How a tile tints its lead photo: by the appearance, in the light appearance's tone in both, or
 * in sepia.
 */
enum class PhotoTone(val value: String) : Enumerable {
  AUTO("auto"),
  COLOR("color"),
  SEPIA("sepia")
}

/**
 * A grid tile, or the top tile: a tall sheet for a narrow window, and for a wide one a strip
 * where the window is short, or a broadsheet where it is not.
 */
enum class TileLayout(val value: String) : Enumerable {
  GRID("grid"),
  TOP_PORTRAIT("topPortrait"),
  TOP_LANDSCAPE("topLandscape"),
  TOP_BROADSHEET("topBroadsheet");

  /** Width over height: a grid tile is a tall sheet, the top tile nearly square, or wide. */
  val aspect: Float
    get() = when (this) {
      GRID -> 2f / 3f
      TOP_PORTRAIT -> 0.96f
      // Wide enough to sit on a landscape screen under the app bar and the switch.
      TOP_LANDSCAPE -> 2.4f
      // The same page with room for its photo and story, short enough to leave a tablet's grid in view.
      TOP_BROADSHEET -> 1.75f
    }

  /**
   * The width, in dp, the sheet's type sizes are written for: the widest it is on a phone, or for
   * the broadsheet, which no phone has room for, the width its type suits.
   */
  private val phoneWidth: Float
    get() = when (this) {
      GRID -> 195f
      TOP_PORTRAIT -> 400f
      TOP_LANDSCAPE -> 600f
      TOP_BROADSHEET -> 500f
    }

  /**
   * How many times the phone's sizes a sheet `width` dp across sets its type: more on a wider
   * sheet, never less on a narrower one.
   */
  fun typeScale(width: Float): Float = maxOf(1f, width / phoneWidth)

  val isTop: Boolean
    get() = this != GRID
}
