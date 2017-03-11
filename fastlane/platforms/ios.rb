platform :ios do
  desc 'Runs all the tests'
  lane :test do
    scan(
      scheme: ENV['GYM_SCHEME'],
      project: ENV['GYM_PROJECT'],
    )
  end

  desc 'Take screenshots'
  lane :screenshot do
    snapshot(
      devices: ['iPhone 7 Plus', 'iPhone 6', 'iPhone 5s', 'iPhone 4s'],
      languages: ['en-US'],
      scheme: ENV['GYM_SCHEME'],
      project: ENV['GYM_PROJECT'],
    )
  end

  desc 'Go rogue'
  lane :'go-rogue' do
    activate_rogue_team
  end

  desc 'Build, but rogue'
  lane :'build-rogue' do
    activate_rogue_team
    build
  end

  desc 'Provisions the profiles; bumps the build number; builds the app'
  lane :build do
    match(readonly: true)

    gym(export_method: 'ad-hoc')
  end

  desc 'Submit a new Beta Build to HockeyApp'
  lane :beta do
    activate_rogue_team

    set_version(
      version: lane_context[:VERSION_NUMBER],
      build: lane_context[:BUILD_NUMBER],
    )

    gym(export_method: 'ad-hoc')

    hockey(notes: release_notes)
  end

  private_lane :set_version do |options|
    increment_version_number(
      version_number: "#{options[:version]}.#{options[:build]}",
      xcodeproj: ENV['GYM_PROJECT'],
    )

    increment_build_number(
      build_number: build,
      xcodeproj: ENV['GYM_PROJECT'],
    )

    package_set_data(data: {version: "#{options[:version]}.#{options[:build]}"})
  end

  desc 'Fix keychain issues for iOS signing'
  private_lane :ci_keychains do
    keychain_name = ENV['MATCH_KEYCHAIN_NAME']
    password = ENV['MATCH_KEYCHAIN_PASSWORD']

    create_keychain(
      name: keychain_name,
      password: password,
      timeout: 3600,
    )

    match(readonly: true)
    sh("security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k #{password} #{keychain_name}")
  end

  desc 'Run iOS builds or tests, as appropriate'
  lane :'ci-run' do
    authorize_ci_for_keys
    ci_keychains

    if ENV['run_deploy'] == '1'
      auto_beta
    else
      build
    end
  end

  desc 'In case match needs to be updated - probably never needs to be run'
  lane :'update-match' do
    match
  end
end
