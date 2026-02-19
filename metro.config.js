const { getDefaultConfig } = require("expo/metro-config")

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

// Fix @supabase/realtime-js: Metro fails to resolve "./lib/push" etc. when package exports
// are enabled. Disabling this uses classic resolution so relative requires resolve correctly.
config.resolver.unstable_enablePackageExports = false

// Fix web: "Cannot destructure property '_extends' of 'tslib.default' as it is undefined".
// Force tslib to resolve to the ES6 build so TypeScript helpers are properly exported.
const tslibEs6Path = require.resolve("tslib/tslib.es6.js")
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "tslib") {
    return { type: "sourceFile", filePath: tslibEs6Path }
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
