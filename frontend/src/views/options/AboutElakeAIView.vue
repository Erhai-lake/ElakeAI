<script setup>
import { nextTick, ref, watch, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import axios from "axios"
import MarkdownIt from "markdown-it"
import Loading from "@/components/Loading.vue"
import { i18nRegistry } from "@/services/plugin/api/I18nClass"
import Logger from "@/services/Logger"

/**
 * 路由服务
 */
const route = useRoute()
const router = useRouter()

/**
 * 关于 ElakeAI 的内容
 */
const content = ref("")

/**
 * 加载状态
 */
const loading = ref(true)

/**
 * 错误信息
 */
const error = ref(null)

/**
 * 是否是 Iframe
 */
const isIframe = ref(false)

/**
 * 如果是 Iframe, 则存储 Iframe URL
 */
const iframeUrl = ref("")

/**
 * 基础 URL
 */
const baseUrl = "https://raw.githubusercontent.com/Erhai-lake/ElakeAI/refs/heads/master/"

/**
 * 翻译函数
 * @function t
 * @param {string} key - 翻译键值
 * @param {Object} params - 翻译参数
 * @returns {string} - 翻译后的字符串
 */
const t = (key, params = {}) => {
	return i18nRegistry.translate(key, params)
}

/**
 * 加载 Markdown 文件
 * @function fetchMarkdown
 * @param file {string} - Markdown 文件路径
 */
const fetchMarkdown = async (file = "README.md") => {
	loading.value = true
	error.value = null
	isIframe.value = false
	try {
		const response = await axios.get(baseUrl + file)
		const md = new MarkdownIt({
			linkify: true,
			html: true,
			breaks: true
		})
		content.value = md.render(response.data)
		// 渲染完成后, 挂载点击事件
		await nextTick(() => {
			bindLinkEvents()
		})
	} catch (err) {
		error.value = `加载 ${file} 失败`
		Logger.error(`[AboutElakeAIView] 加载 ${file} 失败`, err)
	} finally {
		loading.value = false
	}
}

/**
 * 给渲染后的 a 标签绑定点击事件
 * @function bindLinkEvents
 */
const bindLinkEvents = () => {
	const container = document.querySelector(".content")
	if (!container) return
	const links = container.querySelectorAll("a")
	links.forEach(link => {
		link.addEventListener("click", event => {
			const href = link.getAttribute("href")
			event.preventDefault()
			router.push({ query: { url: href } })
		})
	})
}

/**
 * 请求任意 md 文件(绝对路径)
 * @function fetchMarkdownFromUrl
 * @param fullUrl {string} - 完整的 URL 地址
 */
const fetchMarkdownFromUrl = async (fullUrl) => {
	loading.value = true
	error.value = null
	isIframe.value = false
	try {
		const response = await axios.get(fullUrl)
		const md = new MarkdownIt({
			linkify: true,
			html: true,
			breaks: true
		})
		content.value = md.render(response.data)
		await nextTick(() => bindLinkEvents())
	} catch (err) {
		error.value = `加载 ${fullUrl} 失败`
		Logger.error(`[AboutElakeAIView] 加载 ${fullUrl} 失败`, err)
	} finally {
		loading.value = false
	}
}

/**
 * 根据路由参数加载内容
 * @function loadFromRoute
 */
const loadFromRoute = () => {
	const urlParam = route.query.url
	if (!urlParam) {
		fetchMarkdown("README.md")
		return
	}
	if (/^https?:\/\//i.test(urlParam)) {
		// 绝对链接
		if (/\.md$/i.test(urlParam)) {
			// http/https 的 md 文件, 直接请求
			fetchMarkdownFromUrl(urlParam)
		} else {
			// 非 md, iframe 打开
			isIframe.value = true
			iframeUrl.value = urlParam
		}
	} else {
		// 相对 md 文件
		if (/\.md$/i.test(urlParam)) {
			fetchMarkdown(urlParam)
		} else {
			// 其他相对资源, iframe
			isIframe.value = true
			iframeUrl.value = baseUrl + urlParam
		}
	}
}

watch(() => route.query.url, () => {
	loadFromRoute()
})

onMounted(() => {
	loadFromRoute()
})
</script>

<template>
	<Loading :loading="loading" :text="t('views.OptionsView.AboutElakeAIView.loading')">
		<div class="about-elake-ai-view">
			<div v-if="error" class="error">{{ error }}</div>
			<div v-else>
				<div v-if="isIframe" class="iframe-container">
					<iframe :src="iframeUrl"></iframe>
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
