import { Preferences } from "@capacitor/preferences";
import { isNativePlatform } from "./platform";

export type AsyncStorageLike = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export const sessionStorageAdapter: AsyncStorageLike = {
  async getItem(key) {
    if (isNativePlatform()) {
      const result = await Preferences.get({ key });
      return result.value ?? null;
    }

    return window.localStorage.getItem(key);
  },
  async setItem(key, value) {
    if (isNativePlatform()) {
      await Preferences.set({ key, value });
      return;
    }

    window.localStorage.setItem(key, value);
  },
  async removeItem(key) {
    if (isNativePlatform()) {
      await Preferences.remove({ key });
      return;
    }

    window.localStorage.removeItem(key);
  },
};
