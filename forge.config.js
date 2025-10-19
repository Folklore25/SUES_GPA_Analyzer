const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: './logo.ico', // Set the application icon
    extraResource: [
    ],
    // Ignore unnecessary files to reduce package size
    ignore: [
      '^/node_modules/playwright/.local-browsers',
      '^/node_modules/playwright/screenshots',
      '^/node_modules/playwright/tools',
      '^/node_modules/playwright/docs',
      '^/node_modules/playwright/types',
      '^/node_modules/playwright/.*\\.md',
      '^/node_modules/playwright/.*\\.txt',
      '^/node_modules/playwright/.*\\.js\\.map'
    ],
    // Add afterPack hook to run removeLocales.js script
    afterPack: async (context) => {
      const fs = require("fs");
      
      // Ensure the locales directory exists
      const localeDir = path.join(context.appOutDir, "locales");
      
      // Check if the directory exists
      if (!fs.existsSync(localeDir)) {
        console.log("Locales directory not found, skipping locale removal");
        return;
      }
      
      // Read the directory
      const files = fs.readdirSync(localeDir);
      
      //files is array of filenames (basename form)
      if (!(files && files.length)) return;
      
      for (let i = 0, len = files.length; i < len; i++) {
        // zh 和 en 开头的都不删
        if (!(files[i].startsWith("en") || files[i].startsWith("zh"))) {
          fs.unlinkSync(path.join(localeDir, files[i]));
          console.log(`Removed locale file: ${files[i]}`);
        }
      }
      
      console.log("Finished removing unnecessary locale files");
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        // An URL to an ICO file to use as the application icon (displayed in Control Panel)
        iconUrl: 'https://raw.githubusercontent.com/Folklore25/sues-gpa-analyzer/main/logo.ico',
        // The ICO file to use as the icon for the generated Setup.exe
        setupIcon: './logo.ico'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    }
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'Folklore25',
          name: 'sues-gpa-analyzer'
        },
        prerelease: false,
        draft: false
      }
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
