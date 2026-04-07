# Implementation Plan: Material Design Colors as Android Platform Colors

> **Related issue:** [#6919 — Material You alignment](https://github.com/StoDevX/AAO-React-Native/issues/6919)
>
> **Goal:** Replace all hardcoded color literals and `TEMP_ANDROID_*` placeholders in `modules/colors/platform.ts` with proper Android color resources, accessible via `PlatformColor('@color/...')`.

## Current State

`modules/colors/platform.ts` defines ~40 semantic color constants. On iOS, each uses `PlatformColor('systemBlue')` etc. On Android, most fall back to two placeholder constants:

- `TEMP_ANDROID_FOREGROUND` (`'black'`) — used by **18** color slots
- `TEMP_ANDROID_BACKGROUND` (`'white'`) — used by **17** color slots

Additionally:

- 2 colors use `@android:color/holo_*` references (`systemGreen`, `systemRed`)
- 1 color uses a hardcoded hex literal (`systemYellow`: `#FFEB3B`)
- 5 loose `android*` constants at the bottom of the file (`androidLightBackground`, `androidSeparator`, `androidDisabledIcon`, `androidTextColor`, `androidTabAccentColor`) — these are currently unused outside the file itself

The app theme is `Theme.AppCompat.DayNight.NoActionBar` (with a `Light.NoActionBar` override in `values-v23/`). There is no `values-night/` directory. The SDK targets are minSdk 21 / compileSdk 34 / targetSdk 34.

---

## Phase 1 — Define Material Design color resources

**Files changed:** `android/app/src/main/res/values/colors.xml`

Add a new section to `colors.xml` with an entry for every semantic color used in `platform.ts`. Use Material Design 2 palette values for the "adaptable" colors and appropriate neutral/alpha values for the semantic slots.

### Adaptable colors (Material Design 500 variants)

| Constant       | Resource name    | Light value | Source                  |
| -------------- | ---------------- | ----------- | ----------------------- |
| `systemBlue`   | `systemBlue`     | `#2196F3`   | MD2 Blue 500            |
| `systemBrown`  | `systemBrown`    | `#795548`   | MD2 Brown 500           |
| `systemCyan`   | `systemCyan`     | `#00BCD4`   | MD2 Cyan 500            |
| `systemGreen`  | `systemGreen`    | `#4CAF50`   | MD2 Green 500           |
| `systemIndigo` | `systemIndigo`   | `#3F51B5`   | MD2 Indigo 500          |
| `systemMint`   | `systemMint`     | `#009688`   | MD2 Teal 500            |
| `systemOrange` | `systemOrange`   | `#FF9800`   | MD2 Orange 500          |
| `systemPink`   | `systemPink`     | `#E91E63`   | MD2 Pink 500            |
| `systemPurple` | `systemPurple`   | `#9C27B0`   | MD2 Purple 500          |
| `systemRed`    | `systemRed`      | `#F44336`   | MD2 Red 500             |
| `systemTeal`   | `systemTeal`     | `#009688`   | MD2 Teal 500            |
| `systemYellow` | `systemYellow`   | `#FFEB3B`   | MD2 Yellow 500          |

### Gray scale

| Constant      | Resource name   | Light value | Notes                             |
| ------------- | --------------- | ----------- | --------------------------------- |
| `systemGray`  | `systemGray`    | `#9E9E9E`   | MD2 Grey 500                      |
| `systemGray2` | `systemGray2`   | `#757575`   | MD2 Grey 600                      |
| `systemGray3` | `systemGray3`   | `#616161`   | MD2 Grey 700                      |
| `systemGray4` | `systemGray4`   | `#BDBDBD`   | MD2 Grey 400                      |
| `systemGray5` | `systemGray5`   | `#E0E0E0`   | MD2 Grey 300                      |
| `systemGray6` | `systemGray6`   | `#F5F5F5`   | MD2 Grey 100                      |

### Semantic colors

| Constant                             | Resource name                        | Light value               | Notes                                |
| ------------------------------------ | ------------------------------------ | ------------------------- | ------------------------------------ |
| `label`                              | `label`                              | `#DE000000`               | 87% black (MD text primary)          |
| `secondaryLabel`                     | `secondaryLabel`                     | `#8A000000`               | 54% black (MD text secondary)        |
| `tertiaryLabel`                      | `tertiaryLabel`                      | `#61000000`               | 38% black (MD text disabled)         |
| `quaternaryLabel`                    | `quaternaryLabel`                    | `#1F000000`               | 12% black                            |
| `placeholderText`                    | `placeholderText`                    | `#61000000`               | 38% black (MD hint text)             |
| `tintColor`                          | `tintColor`                          | `#6E3A5D`                 | Matches existing `colorAccent`       |
| `systemFill`                         | `systemFill`                         | `#0A000000`               | 4% black overlay                     |
| `secondarySystemFill`                | `secondarySystemFill`                | `#0F000000`               | 6% black overlay                     |
| `tertiarySystemFill`                 | `tertiarySystemFill`                 | `#14000000`               | 8% black overlay                     |
| `quaternarySystemFill`               | `quaternarySystemFill`               | `#1A000000`               | 10% black overlay                    |
| `systemBackground`                   | `systemBackground`                   | `#FFFFFF`                 | White                                |
| `secondarySystemBackground`          | `secondarySystemBackground`          | `#F5F5F5`                 | MD2 Grey 100                         |
| `tertiarySystemBackground`           | `tertiarySystemBackground`           | `#FFFFFF`                 | White                                |
| `systemGroupedBackground`            | `systemGroupedBackground`            | `#F5F5F5`                 | MD2 Grey 100                         |
| `secondarySystemGroupedBackground`   | `secondarySystemGroupedBackground`   | `#FFFFFF`                 | White                                |
| `tertiarySystemGroupedBackground`    | `tertiarySystemGroupedBackground`    | `#F5F5F5`                 | MD2 Grey 100                         |
| `separator`                          | `separator`                          | `#1F000000`               | 12% black (MD divider)              |
| `opaqueSeparator`                    | `opaqueSeparator`                    | `#C6C6C8`                 | Opaque gray                          |
| `link`                               | `link`                               | `#2196F3`                 | MD2 Blue 500                         |

### Legacy android-specific constants

The five `android*` constants at the bottom of `platform.ts` can either be:

1. **Migrated** into the same resource system (recommended if they gain usage), or
2. **Left as-is** since they are currently not imported outside the file.

Verify whether any of these are imported elsewhere before deciding. If unused, remove them.

### Deliverables

- [ ] Updated `android/app/src/main/res/values/colors.xml` with all color entries above
- [ ] Verify the app builds: `cd android && ./gradlew assembleDebug`

---

## Phase 2 — Add dark mode variants

**Files created:** `android/app/src/main/res/values-night/colors.xml`

The app already uses `Theme.AppCompat.DayNight.NoActionBar`, so Android will automatically select `values-night/` resources when the device is in dark mode.

### Dark values

| Resource name                        | Dark value    | Notes                         |
| ------------------------------------ | ------------- | ----------------------------- |
| `label`                              | `#FFFFFFFF`   | White text on dark            |
| `secondaryLabel`                     | `#B3FFFFFF`   | 70% white                    |
| `tertiaryLabel`                      | `#80FFFFFF`   | 50% white                    |
| `quaternaryLabel`                    | `#4DFFFFFF`   | 30% white                    |
| `placeholderText`                    | `#80FFFFFF`   | 50% white                    |
| `tintColor`                          | `#BB86FC`     | MD2 dark theme accent         |
| `systemFill`                         | `#0AFFFFFF`   | 4% white overlay             |
| `secondarySystemFill`                | `#0FFFFFFF`   | 6% white overlay             |
| `tertiarySystemFill`                 | `#14FFFFFF`   | 8% white overlay             |
| `quaternarySystemFill`               | `#1AFFFFFF`   | 10% white overlay            |
| `systemBackground`                   | `#121212`     | MD2 dark surface             |
| `secondarySystemBackground`          | `#1E1E1E`     | Elevated surface             |
| `tertiarySystemBackground`           | `#2C2C2C`     | Further elevated             |
| `systemGroupedBackground`            | `#121212`     | MD2 dark surface             |
| `secondarySystemGroupedBackground`   | `#1E1E1E`     | Elevated surface             |
| `tertiarySystemGroupedBackground`    | `#2C2C2C`     | Further elevated             |
| `separator`                          | `#1FFFFFFF`   | 12% white                   |
| `opaqueSeparator`                    | `#38383A`     | Opaque dark gray             |
| `link`                               | `#BB86FC`     | MD2 dark accent              |
| `systemGray` through `systemGray6`   | *(inverted from light)* | Swap light↔dark appropriately |

The adaptable colors (blue, red, etc.) generally stay the same in light and dark modes (Material Design uses the same hue), so they do **not** need night overrides. Only semantic/surface colors need dark variants.

### Deliverables

- [ ] Create `android/app/src/main/res/values-night/colors.xml`
- [ ] Verify dark mode rendering on an Android emulator
- [ ] Resolve the `values-v23/styles.xml` inconsistency: it uses `Light.NoActionBar` instead of `DayNight.NoActionBar`, which would prevent night colors from working on API 23+. Either remove the v23 override or change it to also use `DayNight`.

---

## Phase 3 — Update `platform.ts` to use `PlatformColor('@color/...')`

**Files changed:** `modules/colors/platform.ts`

Replace every Android color reference with `PlatformColor('@color/<name>')`.

### Changes

1. **Remove** the `TEMP_ANDROID_FOREGROUND` and `TEMP_ANDROID_BACKGROUND` constants (lines 15–16).

2. **Remove** the `OpaqueColorValue` import if no longer needed.

3. **Replace** every `android:` branch. Before/after example:

   ```ts
   // Before
   export const systemBlue = Platform.select({
       ios: PlatformColor('systemBlue'),
       android: TEMP_ANDROID_FOREGROUND,
   })

   // After
   export const systemBlue = Platform.select({
       ios: PlatformColor('systemBlue'),
       android: PlatformColor('@color/systemBlue'),
   })
   ```

4. **Replace** the two `@android:color/holo_*` references:
   - `systemGreen`: `PlatformColor('@android:color/holo_green_light')` → `PlatformColor('@color/systemGreen')`
   - `systemRed`: `PlatformColor('@android:color/holo_red_light')` → `PlatformColor('@color/systemRed')`

5. **Replace** the hex literal for `systemYellow`:
   - `'#FFEB3B' as unknown as OpaqueColorValue` → `PlatformColor('@color/systemYellow')`

6. **Replace** `link`'s `PlatformColor('?attr/colorAccent')` with `PlatformColor('@color/link')` for consistency.

7. **Remove** the `default:` fallback branches on `systemGreen`, `systemRed`, and `label` (they had `default: TEMP_ANDROID_FOREGROUND`). With proper Android colors, no fallback is needed.

8. **Remove or migrate** the 5 `android*` constants at the bottom:
   - `androidLightBackground` → `@color/secondarySystemBackground` (if used)
   - `androidSeparator` → `@color/separator`
   - `androidDisabledIcon` → `@color/systemGray5`
   - `androidTextColor` → `@color/secondaryLabel`
   - `androidTabAccentColor` → `@color/systemYellow`

   If they have no external imports, simply remove them. If they do, replace with re-exports of the semantic constants.

### Deliverables

- [ ] Update all ~37 `Platform.select` blocks in `platform.ts`
- [ ] Remove `TEMP_ANDROID_*` constants and dead `OpaqueColorValue` import
- [ ] Remove or migrate the 5 `android*` constants
- [ ] Verify TypeScript compilation: `npx tsc --noEmit`
- [ ] Verify Android build: `cd android && ./gradlew assembleDebug`
- [ ] Visually verify colors on an Android device/emulator (light + dark)

---

## Phase 4 (optional) — Material You dynamic colors (API 31+)

**Files changed/created:**
- `android/app/src/main/res/values/attrs.xml` (new)
- `android/app/src/main/res/values-v31/themes.xml` (new)
- `modules/colors/platform.ts` (modified)

This phase enables dynamic theming on Android 12+ where colors adapt to the user's wallpaper via Material You.

### Step 4a — Define custom theme attributes

Create `android/app/src/main/res/values/attrs.xml`:

```xml
<resources>
    <attr name="systemBlue" format="color" />
    <attr name="systemGreen" format="color" />
    <attr name="systemRed" format="color" />
    <attr name="systemYellow" format="color" />
    <!-- ... one attr per adaptable color -->
</resources>
```

### Step 4b — Set default values in the base theme

In `values/styles.xml`, add the attributes with their static Material Design defaults:

```xml
<style name="AppTheme" parent="Theme.AppCompat.DayNight.NoActionBar">
    <!-- existing items -->
    <item name="systemBlue">@color/systemBlue</item>
    <item name="systemGreen">@color/systemGreen</item>
    <!-- ... -->
</style>
```

### Step 4c — Override with dynamic colors on API 31+

Create `android/app/src/main/res/values-v31/themes.xml`:

```xml
<style name="AppTheme" parent="Theme.Material3.DynamicColors.DayNight">
    <item name="systemBlue">?attr/colorPrimary</item>
    <item name="systemGreen">?attr/colorTertiary</item>
    <!-- Map semantic slots to Material 3 dynamic tokens -->
</style>
```

### Step 4d — Update `platform.ts` to use theme attributes

Change Android branches from `@color/` to `?attr/`:

```ts
export const systemBlue = Platform.select({
    ios: PlatformColor('systemBlue'),
    android: PlatformColor('?attr/systemBlue'),
})
```

Using `?attr/` means the color resolves at runtime from the current theme. On API < 31, it falls back to the static color from the base theme. On API 31+, it picks up the dynamic Material You color.

### Prerequisites

- Verify that `Theme.Material3.DynamicColors.DayNight` is available. This requires adding `com.google.android.material:material:1.6+` as a dependency in `android/app/build.gradle`.
- Test on API 31+ emulator to verify dynamic color adoption.
- Test on API < 31 emulator to verify fallback behavior.
- The Material 3 → Material Design color mapping will need design review (e.g., which dynamic token maps to "systemPink").

### Deliverables

- [ ] Create `values/attrs.xml` with all custom color attributes
- [ ] Update base theme in `values/styles.xml` with static defaults
- [ ] Create `values-v31/themes.xml` with dynamic color mappings
- [ ] Add Material Components dependency if not already present
- [ ] Update `platform.ts` to use `?attr/` references
- [ ] Test on API 31+ emulator (dynamic colors)
- [ ] Test on API 21–30 emulator (static fallback)
- [ ] Design review on Material 3 token mapping

---

## Summary

| Phase | Scope                          | Files touched | Risk  |
| ----- | ------------------------------ | ------------- | ----- |
| 1     | Define color resources         | 1 XML         | Low   |
| 2     | Add dark mode variants         | 1–2 XML       | Low   |
| 3     | Update `platform.ts`           | 1 TS          | Medium (visual regressions) |
| 4     | Material You dynamic colors    | 3 XML + 1 TS  | High (new dependency, API-gated) |

Phases 1–3 can be shipped together as a single PR. Phase 4 should be a separate PR after Phases 1–3 are verified.
