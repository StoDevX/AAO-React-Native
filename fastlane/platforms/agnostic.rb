# These lanes are non-platform-specific
desc "Adds any unregistered devices to the provisioning profile"
lane :register do
  id = CredentialsManager::AppfileConfig.try_fetch_value(:app_identifier)
  new_devices = get_unprovisioned_devices_from_hockey(app_bundle_id: id)
  register_devices(devices: new_devices)
  match(force: true)
end

desc "Bump the version string to a new version"
lane :bump do |options|
  old_version = get_package_key(key: "version")
  UI.message("Current version: #{old_version}")
  version = options[:version] || UI.input("New version: ").strip
  UI.message("Upgrading from #{old_version} to #{version}")

  # update iOS version
  increment_version_number(version_number: version, xcodeproj: "./ios/AllAboutOlaf.xcodeproj")
  # update Android version
  set_gradle_version_name(version_name: version, gradle_path: "android/app/build.gradle")
  # update package.json version
  set_package_data(data: {"version": version})
end
