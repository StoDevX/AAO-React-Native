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

# Set when a screenshot fails or the app has left the front, which is how a
# crash shows. Every route is still tried, so one run shows them all, and the
# script then exits with it, so the job fails.
failed=0

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
		if ! adb exec-out screencap -p >"$out/$mode/$name.png"; then
			echo "$mode $name: the screenshot failed" >&2
			failed=1
		fi
		# Whether the app is still in front, so a crash reads as one rather than as the launcher.
		top=$(adb shell dumpsys activity activities | grep -m1 -E 'topResumedActivity|mResumedActivity' || true)
		echo "$mode $name: $top" >>"$out/foreground.txt"
		case "$top" in
		*"$package/"*) ;;
		*)
			echo "$mode $name: the app is not in front" >&2
			failed=1
			;;
		esac
	done
}

adb logcat -c
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0

# The first launch, cold, timed.
adb shell am start -W -n "$package/.MainActivity" | tee "$out/cold-start.txt"
sleep 10

shoot light
shoot dark
adb shell "cmd uimode night no" >/dev/null

adb logcat -d >"$out/logcat.txt"
# Crashes and JS errors, separated out so they are the first thing read.
grep -E 'FATAL EXCEPTION|AndroidRuntime|ReactNativeJS.*(Error|error|Warning)|E ReactNative|E unknown:ReactNative|SoLoader|UnsatisfiedLink' "$out/logcat.txt" >"$out/errors.txt" || true
echo "errors: $(wc -l <"$out/errors.txt") lines"
exit "$failed"
