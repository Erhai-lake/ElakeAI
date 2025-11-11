<script setup>
import {ref, watch, onMounted} from "vue"
import Loading from "@/components/Loading.vue"
import InputText from "@/components/input/InputText.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import {publicRegistry} from "@/services/plugin/api/PublicClass"
import axios from "axios"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

const name = "PlantumlUrl"

/**
 * PlantUML URL 配置
 */
const plantumlUrl = ref("https://www.plantuml.com/plantuml/svg/{{encoded}}")

/**
 * 加载状态
 */
const loading = ref(false)

/**
 * 翻译
 * @param key {String} - 键
 * @param {Object} [params] - 插值参数, 例如 { name: "洱海" }
 * @returns {String} - 翻译后的文本
 */
const t = (key, params = {}) => {
	return i18nRegistry.translate(key, params)
}

/**
 * 读取配置
 */
const read = async () => {
	try {
		const PLANTUML_URL_DATA = await Dexie.configs.get("plantumlUrl")
		plantumlUrl.value = PLANTUML_URL_DATA ? PLANTUML_URL_DATA.value : plantumlUrl.value
	} catch (error) {
		Logger.error(`[${name}] PlantUML URL配置获取失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.PlantumlUrl.toast.getError")}`)
	}
}

/**
 * 应用配置
 */
const apply = publicRegistry.debounce(async () => {
	// 验证 PlantUML URL 是否为空
	if (!plantumlUrl.value) {
		plantumlUrl.value = "https://www.plantuml.com/plantuml/svg/{{encoded}}"
		toastRegistry.error(`[${name}] ${t("components.Options.PlantumlUrl.toast.EmptyError")}`)
		return
	}
	// 验证 PlantUML URL 是否以 https:// 或 http:// 开头
	if (!plantumlUrl.value.startsWith("https://") && !plantumlUrl.value.startsWith("http://")) {
		plantumlUrl.value = "https://www.plantuml.com/plantuml/svg/{{encoded}}"
		toastRegistry.error(`[${name}] ${t("components.Options.PlantumlUrl.toast.HeadError")}`)
		return
	}
	// 验证 PlantUML URL 是否包含 {{encoded}} 占位符
	if (!plantumlUrl.value.includes("{{encoded}}")) {
		plantumlUrl.value = "https://www.plantuml.com/plantuml/svg/{{encoded}}"
		toastRegistry.error(`[${name}] ${t("components.Options.PlantumlUrl.toast.PlaceholderError")}`)
		return
	}
	// 尝试访问 PlantUML URL 并检查响应状态是否为 200 OK
	loading.value = true
	try {
		const TEST_URL = plantumlUrl.value.replace("{{encoded}}", "SoWkIImgAStDuNgwRj6pZktFLwzNqBLJU3QdzsdNGY37Ik75-ktFDZQztpFhsOvDp-PFVZfxt_FETgx4v9BCiiIIL8HABYu84zE4fqjQdazeWsX_iditK1XPAL0jn6g8siczJtTD0ThsOl-KfxFdGMmB3V9vrZ7jsTGDpthNSQMaOh7R8JKl1UW90000")
		await axios.get(TEST_URL, {
			timeout: 10000,
			validateStatus: function (status) {
				return status >= 200 && status < 300
			}
		})
	} catch (error) {
		toastRegistry.error(`[${name}] ${t("components.Options.PlantumlUrl.toast.InvalidError")}`)
		return
	} finally {
		loading.value = false
	}
	try {
		await Dexie.configs.put({
			item: "plantumlUrl",
			value: JSON.parse(JSON.stringify(plantumlUrl.value))
		})
	} catch (error) {
		Logger.error(`[${name}] PlantUML URL配置应用失败`, {
			plantumlUrl: plantumlUrl.value,
			error
		})
		toastRegistry.error(`[${name}] ${t("components.Options.PlantumlUrl.toast.applyError")}`)
	}
}, 500)

/**
 * 监听输入框变化
 */
watch(() => plantumlUrl.value, () => {
	apply()
})

onMounted(() => {
	read()
})
</script>

<template>
	<Loading :loading="loading" class="plantuml-url">
		<input-text class="plantuml-url" v-model="plantumlUrl"/>
	</Loading>
</template>

<style scoped lang="less">
.plantuml-url {
	box-sizing: border-box;
	width: 100%;
}
</style>