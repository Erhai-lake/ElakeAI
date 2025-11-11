<script setup>
import { inject, onMounted, useSlots } from "vue"

/**
 * 标签页组件属性
 */
const props = defineProps({
	name: {
		type: String,
		required: true
	}
})

/**
 * 标签页插槽
 */
const slots = useSlots()

/**
 * 标签页注册函数
 */
const registerTab = inject("registerTab")

/**
 * 标签页激活名称函数
 */
const activeName = inject("activeName")

onMounted(() => {
	if (registerTab) {
		registerTab({
			name: props.name,
			labelSlot: slots.label
		})
	}
})
</script>

<template>
	<slot v-if="activeName && activeName() === name"/>
</template>