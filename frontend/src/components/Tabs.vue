<script setup>
import {ref, provide} from "vue"

/**
 * 标签组件属性
 */
const props = defineProps({
	modelValue: {
		type: String,
		required: true
	}
})

/**
 * 标签组件事件
 */
const emit = defineEmits(["update:modelValue"])

/**
 * 标签组件数据
 */
const tabs = ref([])

/**
 * 注册标签页
 * @param tab - 标签页对象
 */
const registerTab = (tab) => {
	if (!tabs.value.find(t => t.name === tab.name)) {
		tabs.value.push(tab)
	}
}

/**
 * 更新激活的标签页
 * @param name - 标签页名称
 */
const updateValue = (name) => {
	emit("update:modelValue", name)
}

provide("registerTab", registerTab)
provide("activeName", () => props.modelValue)
</script>

<template>
	<div class="tabs">
		<div class="tab-labels">
			<button
				v-for="tab in tabs"
				:key="tab.name"
				:class="{ active: tab.name === modelValue }"
				@click="updateValue(tab.name)">
				<component :is="tab.labelSlot"/>
			</button>
		</div>
		<div class="tab-content">
			<slot/>
		</div>
	</div>
</template>

<style scoped lang="less">
.tabs {
	display: flex;
	flex-direction: column;
	height: 100%;

	.tab-labels {
		display: flex;
		border-bottom: 1px solid var(--border-color);

		button {
			padding: 8px 16px;
			background: none;
			border: none;
			border-bottom: 1px solid transparent;
			color: var(--text-color);
			font-size: 14px;
			cursor: pointer;
		}

		.active {
			border-bottom: 1px solid var(--theme-color);
		}
	}

	.tab-content {
		padding: 12px;
		height: 100%;
		overflow: auto;
	}
}
</style>