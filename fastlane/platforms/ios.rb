platform :ios do
  desc 'Runs all the tests'
  lane :test do
    scan(scheme: ENV['GYM_SCHEME'], project: ENV['GYM_PROJECT'])
  end

  desc 'Take screenshots'
  lane :screenshot do
    devices = [
      'iPhone 7 Plus',
      'iPhone 6',
      'iPhone 5s',
      # 'iPhone 4s',
      'iPad Pro (9.7-inch)',
      'iPad Pro (12.9-inch)',
    ]
    snapshot(devices: devices,
             languages: ['en-US'],
             scheme: ENV['GYM_SCHEME'],
             project: ENV['GYM_PROJECT'],
             # concurrent_simulators: false,
             number_of_retries: 0)
  end

  desc 'Builds the app'
  lane :build do
    if ENV['TRAVIS_PULL_REQUEST'] == 'false'
      match(type: 'appstore', readonly: true)
    else
      export_options(method: 'development')
    end
    propagate_version
    gym(include_bitcode: true,
        include_symbols: true)
  end

  desc 'Submit a new Beta Build to Testflight'
  lane :beta do
    build
    testflight
  end

  desc 'Submit a new nightly Beta Build to Testflight'
  lane :nightly do
    build
    # TestFlight is returning 500 errors when we upload changelogs again.
    begin
      testflight(changelog: make_changelog,
                 distribute_external: false)
    rescue => error
      puts 'Changelog failed to upload:'
      puts error
    end
    generate_sourcemap
    upload_sourcemap_to_bugsnag
  end

  desc 'Bundle an iOS sourcemap'
  lane :sourcemap do
    generate_sourcemap
  end

  desc 'Upload dYSM symbols to Bugsnag from Apple'
  lane :refresh_dsyms do
    download_dsyms
    upload_symbols_to_bugsnag
    clean_build_artifacts
  end

  desc 'Run iOS builds or tests, as appropriate'
  lane :'ci-run' do
    # set up things so they can run
    authorize_ci_for_keys

    # and run
    auto_beta
  end
end
