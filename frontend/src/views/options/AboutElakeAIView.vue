<script>
import axios from "axios"
import MarkdownIt from "markdown-it"
import Loading from "@/components/Loading.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"

export default {
	name: "AboutElakeAIView",
	inject: ["$log"],
	components: {Loading},
	data() {
		return {
			content: "",
			loading: true,
			error: null,
			isIframe: false,
			iframeUrl: "",
			baseUrl: "https://raw.githubusercontent.com/Erhai-lake/ElakeAI/refs/heads/master/"
		}
	},
	watch: {
		"$route.query.url": {
			immediate: true,
			handler() {
				this.loadFromRoute()
			}
		}
	},
	methods: {
		/**
		 * 翻译
		 * @param key {String} - 键
		 * @param {Object} [params] - 插值参数, 例如 { name: "洱海" }
		 * @returns {String} - 翻译后的文本
		 */
		t(key, params = {}) {
			return i18nRegistry.translate(key, params)
		},
		/**
		 * 加载 README.md
		 */
		async fetchMarkdown(file = "README.md") {
			this.loading = true
			this.error = null
			this.isIframe = false
			try {
				const RES = await axios.get(this.baseUrl + file)
				const MD = new MarkdownIt({
					linkify: true,
					html: true,
					breaks: true
				})
				this.content = MD.render(RES.data)
				// 渲染完成后, 挂载点击事件
				await this.$nextTick(() => {
					this.bindLinkEvents()
				})
			} catch (error) {
				this.error = `加载 ${file} 失败`
				this.$log.error(`[AboutElakeAIView] 加载 ${file} 失败`, error)
			} finally {
				this.loading = false
			}
		},
		/**
		 * 给渲染后的 a 标签绑定点击事件
		 */
		bindLinkEvents() {
			const CONTAINER = this.$el.querySelector(".content")
			if (!CONTAINER) return
			const LINKS = CONTAINER.querySelectorAll("a")
			LINKS.forEach(LINK => {
				LINK.addEventListener("click", event => {
					const HREF = LINK.getAttribute("href")
					event.preventDefault()
					this.$router.push({query: {url: HREF}})
				})
			})
		},
		/**
		 * 根据路由参数加载内容
		 */
		loadFromRoute() {
			const URL_PARAM = this.$route.query.url
			if (!URL_PARAM) {
				this.fetchMarkdown("README.md")
				return
			}
			if (/^https?:\/\//i.test(URL_PARAM)) {
				// 绝对链接
				if (/\.md$/i.test(URL_PARAM)) {
					// http/https 的 md 文件, 直接请求
					this.fetchMarkdownFromUrl(URL_PARAM)
				} else {
					// 非 md, iframe 打开
					this.isIframe = true
					this.iframeUrl = URL_PARAM
				}
			} else {
				// 相对 md 文件
				if (/\.md$/i.test(URL_PARAM)) {
					this.fetchMarkdown(URL_PARAM)
				} else {
					// 其他相对资源, iframe
					this.isIframe = true
					this.iframeUrl = this.baseUrl + URL_PARAM
				}
			}
		},
		/**
		 * 请求任意 md 文件(绝对路径)
		 */
		async fetchMarkdownFromUrl(fullUrl) {
			this.loading = true
			this.error = null
			this.isIframe = false
			try {
				const RES = await axios.get(fullUrl)
				const MD = new MarkdownIt({
					linkify: true,
					html: true,
					breaks: true
				})
				this.content = MD.render(RES.data)
				await this.$nextTick(() => this.bindLinkEvents())
			} catch (error) {
				this.error = `加载 ${fullUrl} 失败`
				this.$log.error(`[AboutElakeAIView] 加载 ${fullUrl} 失败`, error)
			} finally {
				this.loading = false
			}
		}
	}
}
</script>

<template>
	<Loading :loading="loading" :text="t('views.OptionsView.AboutElakeAIView.loading')">
		<div class="about-elake-ai-view">
			<div v-if="error" class="error">{{ error }}</div>
			<div v-else>
				<div v-if="isIframe" class="iframe-container">
					<iframe :src="iframeUrl" frameborder="0"></iframe>
				</div>
				<div v-else class="content" v-html="content"></div>
			</div>
		</div>
	</Loading>
</template>

<style scoped lang="less">
.about-elake-ai-view {
	padding: 20px;
	box-sizing: border-box;
	height: 100%;
	background-color: var(--sidebar-expand-container-background-color);
	border-radius: 8px;
	overflow: auto;

	.error {
		margin-top: 50px;
		text-align: center;
		font-size: 16px;
		color: #888;
	}

	.content {
		padding: 24px;
		border-radius: 8px;
		background-color: var(--background-color);
		box-shadow: 0 2px 8px var(--box-shadow-color);
		line-height: 1.6;
	}

	.iframe-container {
		width: 100%;
		min-height: 600px;

		iframe {
			width: 100%;
			height: 80vh;
		}
	}
}
</style>

<style lang="less">
.content {
	a {
		color: var(--theme-color);
	}

	h1, h2, h3, h4, h5, h6 {
		margin-top: 1.2em;
		margin-bottom: 0.6em;
		font-weight: 600;
	}

	ul, ol {
		padding-left: 1.5em;
	}
}
</style>
