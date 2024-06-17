import { setData, getData } from './dataHandler.js';

const getPreferenceData = async () => {
    try {
      const preferences = getData('DeskThingPreferences');
      return preferences || {};
    } catch (error) {
      console.error('Error getting DeskThing preferences from file:', error);
      throw error;
    }
  };
  
  const setPreferenceData = async (pref) => {
    try {
      setData('DeskThingPreferences', pref);
      return { success: true };
    } catch (error) {
      console.error('Error setting DeskThing preferences in file:', error);
      throw error;
    }
  };

  const addApp = async (app, index = null) => {
    const preferences = await getPreferenceData();
    if (!preferences.preferredApps.includes(app)) {
        if (index !== undefined && index >= 0 && index < preferences.preferredApps.length) {
            preferences.preferredApps[index] = app;
          } else {
            preferences.preferredApps.push(app);
          }
      await setPreferenceData(preferences);
    }
    return preferences;
  };
  
  const removeApp = async (app) => {
    const preferences = await getPreferenceData();
    const index = preferences.preferredApps.indexOf(app);
    if (index !== -1) {
      preferences.preferredApps.splice(index, 1);
      await setPreferenceData(preferences);
    }
    return preferences;
  };

  const getModules = async () => {
    const preferences = await getPreferenceData();
    const apps = preferences.modules
    return apps;
  };
  const setModules = async (modules) => {
    const preferences = await getPreferenceData();
    preferences.modules = modules;
    await setPreferenceData(preferences);
    return preferences;
  };

export {
    getPreferenceData,
    setPreferenceData,
    addApp,
    removeApp,
    getModules,
    setModules
}