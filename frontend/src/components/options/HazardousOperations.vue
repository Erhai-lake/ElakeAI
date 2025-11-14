<script setup>
import Button from "@/components/input/Button.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

const name = "HazardousOperations"

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
 * 所有表名
 */
const TABLE_NAMES = Dexie.tables.map(table => table.name)

/**
 * 清除指定表数据
 * @param table {String} - 表名
 */
const clearTable = async (table) => {
	if (!confirm(t("components.Options.HazardousOperations.confirmOperationTip"))) return
	try {
		await Dexie[table].clear()
		location.reload()
		toastRegistry.success(`[${name}] ${t("components.Options.HazardousOperations.toast.operationSuccess")}`)
	} catch (error) {
		Logger.error(`[${name}] 操作失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.HazardousOperations.toast.operationFailed")}`)
	}
}
</script>

<template>
	<div class="hazardous-operation">
		<Button v-for="table in TABLE_NAMES" :key="table" @click="clearTable(table)">
			{{ t("components.Options.HazardousOperations.prefix") + table }}
		</Button>
	</div>
</template>

<style scoped lang="less">
.hazardous-operation {
	display: flex;
	gap: 10px;
}
</style>