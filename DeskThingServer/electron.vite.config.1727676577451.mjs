// electron.vite.config.ts
import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";
var __electron_vite_injected_dirname = "C:\\Users\\legom\\OneDrive\\Desktop\\Coding\\Website Development\\Carthing Laptop\\carthing\\DeskThingServer";
var packageJson = JSON.parse(readFileSync(resolve(__electron_vite_injected_dirname, "package.json"), "utf-8"));
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src")
      }
    },
    plugins: [react()],
    define: {
      "process.env.PACKAGE_VERSION": JSON.stringify(packageJson.version)
    }
  }
});
export {
  electron_vite_config_default as default
};
