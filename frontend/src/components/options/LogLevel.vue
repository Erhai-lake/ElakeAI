<script>
import Selector from "@/components/input/Selector.vue";

export default {
	name: "LogLevel",
	inject: ["$DB", "$log"],
	components: {Selector},
	data() {
		return {
			logLevel: [
				{
					title: "debug",
				},
				{
					title: "info",
				},
				{
					title: "warn",
				},
				{
					title: "error",
				}
			],
			selected: "debug"
		}
	},
	async created() {
		// 初始化日志级别
		try {
			const LOG_LEVEL = await this.$DB.configs.get("logLevel")
			this.selected = LOG_LEVEL ? LOG_LEVEL.value : "warn"
		} catch (error) {
			this.$log.error(`[${this.name}] 日志级别获取失败`, error)
		}
	},
	methods: {
		/**
		 * 更新选中的日志级别
		 * @param selected {Object} - 选中的日志级别
		 */ async updateSelectedLevel(selected) {
			this.selected = selected.title
			try {
				// 保存设置
				await this.$DB.configs.put({
					item: "logLevel",
					value: this.selected
				})
			} catch (error) {
				this.$log.error(`[${this.name}] 日志级别设置失败`, error)
			}
		}
	}
}
</script>

<template>
	<Selector
		class="selector"
		unique-key="title"
		:selector-list="logLevel"
		:selector-selected="{title: selected}"
		:num="4"
		@update:selectorSelected="updateSelectedLevel"/>
</template>

<style scoped lang="less">
.selector {
	width: 200px;
}
</style>