// electron.vite.config.ts
import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
var __electron_vite_injected_import_meta_url = "file:///C:/Users/legom/OneDrive/Desktop/Coding/DeskThing/DeskThing/DeskThingServer/electron.vite.config.ts";
var _filename = fileURLToPath(__electron_vite_injected_import_meta_url);
var __dirname = dirname(_filename);
var packageJson = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf-8"));
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/main/index.ts"),
          expressProcess: resolve(__dirname, "src/main/processes/expressProcess.ts"),
          appProcess: resolve(__dirname, "src/main/processes/appProcess.ts")
        }
      }
    },
    resolve: {
      alias: {
        "@shared": resolve("src/shared"),
        "@server": resolve("src/main"),
        "@processes": resolve("src/main/processes")
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/preload/index.ts"),
          loading: resolve(__dirname, "src/preload/loading.ts")
        }
      }
    },
    resolve: {
      alias: {
        "@shared": resolve("src/shared")
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@server": resolve("src/main"),
        "@shared": resolve("src/shared")
      }
    },
    plugins: [react()],
    define: {
      "process.env.PACKAGE_VERSION": JSON.stringify(packageJson.version)
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/renderer/index.html"),
          loading: resolve(__dirname, "src/renderer/loading.html")
        }
      }
    }
  }
});
export {
  electron_vite_config_default as default
};
