package tech.frogpond.messissuetile

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.os.Build
import android.util.LruCache
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.nio.ByteBuffer
import kotlin.math.max
import kotlin.math.roundToInt
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.runInterruptible
import kotlinx.coroutines.withContext

/**
 * Tiles' lead photos, fetched and decoded off the main thread straight to the size a tile draws
 * them at, and kept in memory. WordPress serves each photo as uploaded, often thousands of pixels
 * across: a full-size decode stalls scrolling, and a grid of them holds far more memory than the
 * screen shows. The cache lets a tile scrolled away and back show its photo at once.
 */
internal object TilePhotos {
  /** About forty grid photos; the system's own trimming empties it with the process. */
  private val cache = object : LruCache<String, Bitmap>(48 * 1024 * 1024) {
    override fun sizeOf(key: String, value: Bitmap): Int = value.allocationByteCount
  }

  private fun key(url: String, maxPixels: Int) = "$maxPixels|$url"

  fun cached(url: String, maxPixels: Int): ImageBitmap? = cache.get(key(url, maxPixels))?.asImageBitmap()

  fun clear() = cache.evictAll()

  /**
   * The photo at `url`, decoded no larger than `maxPixels` along its longer side. A download that
   * fails is tried again, after longer and longer waits, for as long as the caller's coroutine
   * runs -- a tile's, which ends when the tile leaves the screen -- so a tile shown offline fills
   * in once the connection returns. A photo that downloads but cannot be decoded is not tried
   * again, and gives null.
   */
  suspend fun load(url: String, maxPixels: Int): ImageBitmap? {
    cached(url, maxPixels)?.let { return it }
    var wait = 2_000L
    while (true) {
      val bytes = when (val fetched = fetch(url)) {
        is Fetch.Done -> fetched.bytes
        Fetch.Gone -> return null
        Fetch.Retry -> null
      }
      if (bytes != null) {
        val bitmap = withContext(Dispatchers.Default) { decode(bytes, maxPixels) } ?: return null
        cache.put(key(url, maxPixels), bitmap)
        return bitmap.asImageBitmap()
      }
      // Throws once the tile's coroutine is cancelled, ending the retries.
      delay(wait)
      wait = minOf(wait * 2, 60_000L)
    }
  }

  private sealed interface Fetch {
    class Done(val bytes: ByteArray) : Fetch

    /** The server answered, but not with a photo: trying again would not help. */
    data object Gone : Fetch

    /** No answer, or a passing failure: worth trying again. */
    data object Retry : Fetch
  }

  private suspend fun fetch(url: String): Fetch = runInterruptible(Dispatchers.IO) {
    var connection: HttpURLConnection? = null
    try {
      connection = (URL(url).openConnection() as HttpURLConnection).apply {
        connectTimeout = 15_000
        readTimeout = 20_000
        instanceFollowRedirects = true
      }
      val code = connection.responseCode
      when {
        code in 200..299 -> Fetch.Done(connection.inputStream.use { it.readBytes() })
        code == 408 || code == 429 || code >= 500 -> Fetch.Retry
        else -> Fetch.Gone
      }
    } catch (e: IOException) {
      Fetch.Retry
    } catch (e: IllegalArgumentException) {
      Fetch.Gone
    } finally {
      connection?.disconnect()
    }
  }

  /** The photo decoded at no more than `maxPixels` along its longer side, upright. */
  private fun decode(bytes: ByteArray, maxPixels: Int): Bitmap? {
    return try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        // ImageDecoder applies the photo's EXIF orientation and decodes straight to the size asked.
        val source = ImageDecoder.createSource(ByteBuffer.wrap(bytes))
        ImageDecoder.decodeBitmap(source) { decoder, info, _ ->
          val longer = max(info.size.width, info.size.height)
          if (longer > maxPixels) {
            val ratio = maxPixels.toFloat() / longer
            decoder.setTargetSize(
              max(1, (info.size.width * ratio).roundToInt()),
              max(1, (info.size.height * ratio).roundToInt())
            )
          }
          // Drawn through a colour filter into the tile's layer; a software bitmap draws anywhere.
          decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
        }
      } else {
        decodeSampled(bytes, maxPixels)
      }
    } catch (e: Exception) {
      null
    }
  }

  private fun decodeSampled(bytes: ByteArray, maxPixels: Int): Bitmap? {
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
    val longer = max(bounds.outWidth, bounds.outHeight)
    if (longer <= 0) return null
    var sample = 1
    while (longer / (sample * 2) >= maxPixels) sample *= 2
    val options = BitmapFactory.Options().apply { inSampleSize = sample }
    val decoded = BitmapFactory.decodeByteArray(bytes, 0, bytes.size, options) ?: return null
    val decodedLonger = max(decoded.width, decoded.height)
    if (decodedLonger <= maxPixels) return decoded
    val ratio = maxPixels.toFloat() / decodedLonger
    val scaled = Bitmap.createScaledBitmap(
      decoded,
      max(1, (decoded.width * ratio).roundToInt()),
      max(1, (decoded.height * ratio).roundToInt()),
      true
    )
    if (scaled !== decoded) decoded.recycle()
    return scaled
  }
}
