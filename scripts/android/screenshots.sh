#!/usr/bin/env bash
# Opens each route of an installed Android build by deep link and saves a
# screenshot of it, in light and dark, plus the device log, so a change can be
# looked at without a device. Runs inside the emulator job of
# .github/workflows/android.yml; usable against any adb-connected device.
#
# Usage: scripts/android/screenshots.sh <package> <scheme> <output-dir>
set -uo pipefail

package="$1"
scheme="$2"
out="$3"
mkdir -p "$out/light" "$out/dark"

# The screens a reader reaches from Home, and the ones a deep link opens on
# its own, and a detail screen or two opened by its parameter in the path.
routes=(
	''
	menus
	menus/stav-hall
	menus/the-cage
	calendar
	directory
	hours
	hours/all-spaces
	map
	more
	news
	newspaper
	transit
	streaming-media
	streaming-media/webcams
	contacts
	dictionary
	faq
	about
	balances
	course-search
	student-orgs
	student-work
	print-jobs
	support
	customize
	customize/app-icon
	hours/detail/The%20Cage
	dictionary/entry/AAC
	directory/named/PubSafe
	developer
	athletics
	report-problem
	edu.carleton/convocations
)

launch() {
	adb shell am force-stop "$package"
	if [ -z "$1" ]; then
		adb shell monkey -p "$package" -c android.intent.category.LAUNCHER 1 >/dev/null
	else
		adb shell am start -W -a android.intent.action.VIEW -d "$scheme://$1" "$package" >/dev/null
	fi
}

shoot() {
	local mode="$1"
	adb shell "cmd uimode night $( [ "$mode" = dark ] && echo yes || echo no )" >/dev/null
	for route in "${routes[@]}"; do
		name="${route:-home}"
		name="${name//\//__}"
		launch "$route"
		# A cold start loads the bundle, then the screen fetches its (mocked) data.
		sleep 6
		# The emulator's launcher sometimes stalls under the load and its "isn't
		# responding" dialog lands over the app. hide_error_dialogs stops most;
		# this closes one already up.
		adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS >/dev/null 2>&1 || true
		adb exec-out screencap -p >"$out/$mode/$name.png"
		# The view hierarchy with each view's bounds, for measuring layout --
		# where a title sits against the app bar's icons -- rather than eyeing
		# pixels. Once per screen is enough.
		if [ "$mode" = light ]; then
			adb shell uiautomator dump /sdcard/view.xml >/dev/null 2>&1 &&
				adb shell cat /sdcard/view.xml >"$out/$mode/$name.xml" || true
		fi
		# Whether the app is still in front, so a crash reads as one rather than as the launcher.
		top=$(adb shell dumpsys activity activities | grep -m1 -E 'topResumedActivity|mResumedActivity' || true)
		echo "$mode $name: $top" >>"$out/foreground.txt"
	done
}

# Prints "x y", the centre of the first view on screen whose text,
# content-desc or resource-id (a test tag) matches the regular expression $1.
find_view() {
	adb shell uiautomator dump /sdcard/view.xml >/dev/null 2>&1 || return 1
	adb shell cat /sdcard/view.xml | python3 -c '
import re, sys
pattern = re.compile(sys.argv[1])
for node in re.findall(r"<node [^>]*>", sys.stdin.read()):
    attrs = dict(re.findall(r"([\w-]+)=\"([^\"]*)\"", node))
    if any(pattern.fullmatch(attrs.get(key, "")) for key in ("text", "content-desc", "resource-id")):
        x0, y0, x1, y1 = map(int, re.findall(r"\d+", attrs["bounds"]))
        print((x0 + x1) // 2, (y0 + y1) // 2)
        break
' "$1"
}

# Scrolls down until a view matching $1 is on screen, and prints its centre.
scroll_to() {
	local at
	for _ in 1 2 3 4 5 6; do
		at=$(find_view "$1")
		if [ -n "$at" ]; then
			echo "$at"
			return 0
		fi
		adb shell input swipe 540 1800 540 700 300
		sleep 1
	done
	return 1
}

# The radio's Now Playing sheet, which no route opens: it sits behind dev
# mode, which Home's notice turns on from its long-press menu, and opens from
# the Now Playing bar that then shows on Home. The steps the iOS UI tests
# take (ModuleStreamingMediaTests). Runs after the other screens, since dev
# mode stays on. Says in radio.txt which step failed, if one did.
shoot_radio() {
	local at
	adb shell "cmd uimode night no" >/dev/null
	launch ''
	sleep 8
	at=$(scroll_to 'home-notice') || { echo 'radio: no notice on Home' >"$out/radio.txt"; return; }
	set -- $at
	adb shell input swipe "$1" "$2" "$1" "$2" 1500
	sleep 2
	at=$(find_view 'Enable dev mode') || true
	[ -n "$at" ] || { echo 'radio: no "Enable dev mode" in the notice menu' >"$out/radio.txt"; return; }
	adb shell input tap $at
	sleep 3
	at=$(find_view '.*Not Playing.*') || true
	[ -n "$at" ] || at=$(scroll_to '.*Not Playing.*') || { echo 'radio: no Now Playing bar on Home' >"$out/radio.txt"; return; }
	adb shell input tap $at
	sleep 5
	adb exec-out screencap -p >"$out/light/radio.png"
	adb shell uiautomator dump /sdcard/view.xml >/dev/null 2>&1 && adb shell cat /sdcard/view.xml >"$out/light/radio.xml" || true
	adb shell "cmd uimode night yes" >/dev/null
	sleep 3
	adb exec-out screencap -p >"$out/dark/radio.png"
	adb shell "cmd uimode night no" >/dev/null
	echo 'radio: shot' >"$out/radio.txt"
}

adb logcat -c
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0
# Not-responding and crash dialogs from other apps -- the emulator's launcher
# stalls on a slow runner -- would cover the screenshots. The app's own crash
# still shows: foreground.txt and errors.txt record it.
adb shell settings put global hide_error_dialogs 1

# The first launch, cold, timed.
adb shell am start -W -n "$package/.MainActivity" | tee "$out/cold-start.txt"
sleep 10

shoot light
shoot dark
shoot_radio
adb shell "cmd uimode night no" >/dev/null

adb logcat -d >"$out/logcat.txt"
# Crashes and JS errors, separated out so they are the first thing read.
grep -E 'FATAL EXCEPTION|AndroidRuntime|ReactNativeJS.*(Error|error|Warning)|E ReactNative|E unknown:ReactNative|SoLoader|UnsatisfiedLink' "$out/logcat.txt" >"$out/errors.txt" || true
echo "errors: $(wc -l <"$out/errors.txt") lines"
exit 0
