platform :ios do
  desc 'Runs all the tests'
  lane :test do
    scan
  end

  desc 'Take screenshots'
  lane :screenshot do
    snapshot
  end

  desc 'Go rogue'
  lane :'go-rogue' do
    activate_rogue_team
  end

  desc 'In case match needs to be updated - rarely needs to be run'
  lane :"update-match" do
    match(readonly: false)
  end

  desc 'Provisions the profiles; bumps the build number; builds the app'
  lane :build do
    # make sure we have a copy of the data files
    bundle_data

    # Set up code signing correctly
    # (more information: https://codesigning.guide)
    match(readonly: true)

    # Build the app
    gym
  end

  desc 'Submit a new Beta Build to HockeyApp'
  lane :beta do
    build

    hockey(
      ipa: lane_context[SharedValues::IPA_OUTPUT_PATH],
      notes: release_notes
    )
  end

  desc 'Run iOS builds or tests, as appropriate'
  lane :'ci-run' do
    # set up things so they can run
    authorize_ci_for_keys
    ci_keychains
    activate_rogue_team

    # bump the app version
    set_version(version: current_bundle_version,
                build_number: current_build_number)

    # and run
    should_deploy = ENV['run_deploy'] == '1'
    if should_deploy
      auto_beta
    else
      build
    end
  end

  private_lane :set_version do |options|
    version = options[:version]
    build = options[:build_number]
    increment_version_number(version_number: "#{version}-build.#{build}",
                             xcodeproj: './ios/AllAboutOlaf.xcodeproj')
    increment_build_number(build_number: build,
                           xcodeproj: './ios/AllAboutOlaf.xcodeproj')
    set_package_data(data: { version: "#{version}-build.#{build}" })
  end

  desc 'Do CI-system keychain setup'
  private_lane :ci_keychains do
    keychain = ENV['MATCH_KEYCHAIN_NAME']
    password = ENV['MATCH_KEYCHAIN_PASSWORD']

    create_keychain(
      name: keychain,
      password: password,
      timeout: 3600
    )

    match(readonly: true)

    sh("security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k #{password} #{keychain}")
  end
end
