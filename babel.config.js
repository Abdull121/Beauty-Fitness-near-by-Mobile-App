// This file is used to configure Babel for a React Native project.

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo"],
    ],
  // plugins: [
  //   [
  //     'module:react-native-dotenv',
  //     {
  //       envName: 'APP_ENV',
  //       moduleName: '@env',
  //       path: '.env',
        
  //     },
  //   ],
  // ],

  };
};