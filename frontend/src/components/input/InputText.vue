<script>
export default {
	name: "InputText",
	props: {
		modelValue: {
			type: String,
			default: ""
		},
		placeholder: {
			type: String,
			default: ""
		}
	},
	emits: ["update:modelValue", "input"],
	methods: {
		onInput(event) {
			const VALUE = event.target.value
			// v-model
			this.$emit("update:modelValue", VALUE)
			// 回调
			this.$emit("input", VALUE)
		}
	}
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
	border: 1px solid #909399FF;
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
}
</style>