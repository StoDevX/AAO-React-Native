desc 'Bump the version string to a new version'
lane :bump do |options|
  old_version = package_get_data(key: :version)
  UI.message("Current version: #{old_version}")

  new_version = options[:version] || UI.input('New version: ').strip
  UI.message("Upgrading from #{old_version} to #{new_version}")

  # update iOS version
  increment_version_number(version_number: new_version, xcodeproj: ENV['GYM_PROJECT'])

  # update Android version
  set_gradle_version_name(version_name: new_version, gradle_file: lane_context[:GRADLE_FILE])

  # update package.json version
  package_set_data(data: {:version => new_version})
end

desc 'Adds any unregistered devices to the provisioning profile'
lane :register do
  id = CredentialsManager::AppfileConfig.try_fetch_value(:app_identifier)
  new_devices = get_unprovisioned_devices_from_hockey(app_bundle_id: id)
  register_devices(devices: new_devices)
  match(force: true)
end

desc 'Build the release notes: branch, commit hash, changelog'
lane :release_notes do |options|
  <<~END
  branch: #{git_branch}
  git commit: #{last_git_commit[:commit_hash]}

  ## Changelog
  #{changelog}
  END
end
