import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { fileURLToPath, URL } from "node:url"

export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			// 路径别名
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	server: {
		// 端口
		port: 5173,
	}
})
