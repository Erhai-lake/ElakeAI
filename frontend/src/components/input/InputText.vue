<script setup>
defineProps({
	modelValue: {
		type: String,
		default: ""
	},
	placeholder: {
		type: String,
		default: ""
	}
})

const emit = defineEmits(["update:modelValue", "input"])

const onInput = (event) => {
	const value = event.target.value
	// v-model
	emit("update:modelValue", value)
	// 回调
	emit("input", value)
}
</script>

<template>
	<input type="text" :value="modelValue" :placeholder="placeholder" @input="onInput"/>
</template>

<style scoped lang="less">
input {
	padding: 10px 12px;
	background-color: var(--background-color);
	color: var(--text-color);
	border: 1px solid var(--border-color);
	border-radius: 8px;
	font-size: 14px;
	user-select: none;
	transition: all 0.15s;
	white-space: nowrap;
	outline: none;

	&:focus {
		border-color: var(--button-hover-background-color);
		box-shadow: 0 0 4px var(--button-hover-background-color);
	}

	&:disabled {
		background-color: var(--disabled-background-color);
		color: var(--disabled-text-color);
		border-color: var(--border-color);
		cursor: not-allowed;
	}
}
</style>