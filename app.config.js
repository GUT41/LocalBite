/** Loads `.env` and exposes EXPO_PUBLIC_API_URL to the app via expo-constants. */
const appJson = require('./app.json');

module.exports = () => ({
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
    },
  },
});
