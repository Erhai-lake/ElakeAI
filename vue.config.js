const {defineConfig} = require("@vue/cli-service")
module.exports = defineConfig({
	productionSourceMap: false,
	transpileDependencies: true,
	configureWebpack: {
		plugins: [
			new (require("webpack").DefinePlugin)({
				__VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
				__VUE_PROD_DEVTOOLS__: JSON.stringify(false)
			})
		],
		performance: {
			maxEntrypointSize: 1024000,
			maxAssetSize: 1024000
		},
		optimization: {
			splitChunks: {
				chunks: "all"
			}
		}
	},
	publicPath: "./",
	outputDir: "dist_vue"
})
