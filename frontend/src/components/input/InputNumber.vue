<script>
export default {
	name: "InputNumber",
	props: {
		modelValue: {
			type: [Number, String],
			default: ""
		},
		placeholder: {
			type: String,
			default: ""
		},
		min: {
			type: Number,
			default: -Infinity
		},
		max: {
			type: Number,
			default: Infinity
		},
		step: {
			type: Number,
			default: 1
		}
	},
	emits: ["update:modelValue", "input"],
	methods: {
		onInput(event) {
			let value = event.target.value
			// 空值允许
			if (value === "") {
				this.$emit("update:modelValue", "")
				this.$emit("input", "")
				return
			}
			// 转数字
			value = Number(value)
			// 非数字直接忽略
			if (isNaN(value)) return
			// 限制边界
			if (value < this.min) value = this.min
			if (value > this.max) value = this.max
			// 更新
			this.$emit("update:modelValue", value)
			this.$emit("input", value)
		}
	}
}
</script>

<template>
	<input
		type="number"
		:value="modelValue"
		:placeholder="placeholder"
		:min="min"
		:max="max"
		:step="step"
		@input="onInput"/>
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

	&:disabled {
		background-color: var(--disabled-background-color);
		color: var(--disabled-text-color);
		border-color: var(--border-color);
		cursor: not-allowed;
	}
}
</style>