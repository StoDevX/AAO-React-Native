# Get the current "app bundle" version
def current_bundle_version
	case lane_context[:PLATFORM_NAME]
	when :android
		get_gradle_version_name(gradle_path: lane_context[:GRADLE_FILE])
	when :ios
		get_info_plist_value(path: 'ios/AllAboutOlaf/Info.plist',
		                     key: 'CFBundleShortVersionString')
	else
		get_package_key(key: :version)
	end
end

# Get the current "app bundle" version code (mostly for Sentry)
def current_bundle_code
	case lane_context[:PLATFORM_NAME]
	when :android
		get_gradle_version_code(gradle_path: lane_context[:GRADLE_FILE])
	when :ios
		get_info_plist_value(path: 'ios/AllAboutOlaf/Info.plist',
		                     key: 'CFBundleVersion')
	else
		raise 'wtf'
	end
end

# Generate build number
def build_number
	# Should last until ~2080 for Android.
	old_version_number = DateTime.now.to_time.to_i - DateTime.parse("2014-01-01").to_time.to_i

	# With the old version number scheme, we'll pass this version number at 2022-03-29T06:13:20Z.
	changeover = 260000000

	# Instead of using up a version number every second, now compute the number of hours since
	# the changeover point and add that to the changeover.
	#
	# This means that as long as the iOS and Android builds start within an hour of each other,
	# they will use the same distribution code.
	new_version_number = ((old_version_number - changeover) / 3600) + changeover

	if old_version_number > changeover
		new_version_number
	else
		old_version_number
	end

	# After the changeover point, we could adjust the logic to just
	# (DateTime.now.to_time.to_i - DateTime.parse("2022-03-29T06:13:20Z").to_time.to_i) / 3600 + 260000000
end

# Copy the package.json version into the other version locations
def propagate_version(**args)
	version = get_package_key(key: :version)

	UI.message "Propagating version: #{version}"
	UI.message 'into the Info.plist and build.gradle files'

	number = build_number
	UI.message "Version code is #{number}"

	version = "#{version.split('-')[0]}-pre" if should_nightly?
	UI.message "Actually putting #{version} into the binaries (because we're doing a nightly)"

	# encode build number into js-land --- we've already fetched it, so we'll
	# never set the "+" into the binaries
	unless version.include? '+'
		# we always want the CI build number in js-land
		set_package_data(data: { version: "#{version}+#{number}" })
	end

	case lane_context[:PLATFORM_NAME]
	when :android
		set_gradle_version_name(version_name: version, gradle_path: lane_context[:GRADLE_FILE])
		set_gradle_version_code(version_code: number, gradle_path: lane_context[:GRADLE_FILE])
	when :ios
		# we're splitting here because iTC can't handle versions with dashes in them
		increment_version_number(version_number: version.split('-')[0], xcodeproj: ENV['XCODE_PROJECT'])
		increment_build_number(build_number: number, xcodeproj: ENV['XCODE_PROJECT'])
	end
end
