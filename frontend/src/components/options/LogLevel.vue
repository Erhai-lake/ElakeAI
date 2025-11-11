<script setup>
import { ref, onMounted } from "vue"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"
import Selector from "@/components/input/Selector.vue"

/**
 * 日志级别选择器组件
 */
const props = defineProps({
	prefix: {
		type: Boolean,
		default: false
	}
})

/**
 * 日志级别列表
 */
const logLevel = ref([
	{ title: "debug" },
	{ title: "info" },
	{ title: "warn" },
	{ title: "error" }
])

/**
 * 选中的日志级别
 */
const selected = ref("debug")

/**
 * 初始化日志级别
 */
const initLogLevel = async () => {
	try {
		const LOG_LEVEL = await Dexie.configs.get("logLevel")
		selected.value = LOG_LEVEL ? LOG_LEVEL.value : "warn"
	} catch (error) {
		Logger.error(`[LogLevel] 日志级别获取失败`, error)
	}
}

/**
 * 更新选中的日志级别
 * @param selectedItem {Object} - 选中的日志级别
 */
const updateSelectedLevel = async (selectedItem) => {
	selected.value = selectedItem.title
	try {
		// 保存设置
		await Dexie.configs.put({
			item: "logLevel",
			value: selected.value
		})
	} catch (error) {
		Logger.error(`[LogLevel] 日志级别设置失败`, error)
	}
}

/**
 * 计算选中的显示文本
 * @function selectedDisplay
 * @returns {Object} - 选中的日志级别显示文本
 */
const selectedDisplay = () => {
	return props.prefix ? { title: `级别 ${selected.value}` } : { title: selected.value }
}

onMounted(() => {
	initLogLevel()
})
</script>

<template>
	<Selector
		class="selector"
		unique-key="title"
		:selector-list="logLevel"
		:selector-selected="selectedDisplay()"
		:num="4"
		@update:selectorSelected="updateSelectedLevel"/>
</template>

<style scoped lang="less">
.selector {
	width: 200px;
}
</style>