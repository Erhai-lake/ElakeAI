import {defineConfig} from "vite"
import vue from "@vitejs/plugin-vue"
import {fileURLToPath, URL} from "node:url"
import {readFileSync} from "node:fs"

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"))

export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			// 路径别名
			"@": fileURLToPath(new URL("./src", import.meta.url))
		}
	},
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
	},
	server: {
		// 端口
		port: 5173,
	}
})
