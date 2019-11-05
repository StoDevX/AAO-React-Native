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
