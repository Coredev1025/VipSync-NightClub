const { getDefaultConfig } = require("expo/metro-config")

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

// Fix @supabase/realtime-js: Metro fails to resolve "./lib/push" etc. when package exports
// are enabled. Disabling this uses classic resolution so relative requires resolve correctly.
config.resolver.unstable_enablePackageExports = false

module.exports = config
