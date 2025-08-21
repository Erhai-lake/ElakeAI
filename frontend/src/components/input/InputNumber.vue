<script>
export default {
	name: "InputNumber",
	props: {
		// "input" 或 "slider"
		mode: {
			type: String,
			default: "input"
		},
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
		},
		disabled: {
			type: Boolean,
			default: false
		}
	},
	emits: ["update:modelValue", "input"],
	data() {
		return {
			isEditingValue: false
		}
	},
	methods: {
		/**
		 * 输入框模式
		 * @param event 输入事件
		 */
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
		},
		/**
		 * 启用编辑
		 */
		enableEdit() {
			if (this.disabled) return
			this.isEditingValue = true
			// 自动聚焦输入框
			this.$nextTick(() => {
				// 自动聚焦输入框
				const INPUT = this.$refs.valueInput
				INPUT && INPUT.focus()
			})
		},
		/**
		 * 禁用编辑
		 */
		disableEdit() {
			this.isEditingValue = false
		}
	}
}
</script>

<template>
	<!-- 输入框模式 -->
	<input
		v-if="mode === 'input'"
		type="number"
		:value="modelValue"
		:placeholder="placeholder"
		:min="min"
		:max="max"
		:step="step"
		:disabled="disabled"
		@input="onInput"/>
	<!-- 滑块模式 -->
	<div v-else-if="mode === 'slider'" class="slider-wrapper" :class="{ disabled }">
		<span v-if="!isEditingValue" class="value" @click="enableEdit">{{ modelValue }}</span>
		<input
			v-else
			ref="valueInput"
			class="value-input"
			type="number"
			:value="modelValue"
			:min="min"
			:max="max"
			:step="step"
			:disabled="disabled"
			@input="onInput"
			@blur="disableEdit"/>
		<div class="slider">
			<input
				type="range"
				:value="modelValue"
				:min="min"
				:max="max"
				:step="step"
				:disabled="disabled"
				@input="onInput"/>
		</div>
	</div>
</template>

<style scoped lang="less">
//输入框模式
input[type="number"] {
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

//滑块模式
.slider-wrapper {
	padding: 10px 12px;
	box-sizing: border-box;
	width: 100%;
	display: flex;
	align-items: center;
	gap: 10px;
	background-color: var(--background-color);
	color: var(--text-color);
	border: 1px solid #909399FF;
	border-radius: 8px;
	font-size: 14px;
	user-select: none;
	transition: all 0.15s;
	white-space: nowrap;

	.value {
		font-size: 14px;
		color: var(--text-color);
		min-width: 40px;
		text-align: center;
		cursor: pointer;
		user-select: none;
	}

	.value-input {
		width: 60px;
		padding: 0 6px;
		border: 1px solid #909399FF;
		border-radius: 4px;
		background-color: var(--background-color);
		color: var(--text-color);
		font-size: 14px;

		&:focus {
			border-color: var(--button-hover-background-color);
			box-shadow: 0 0 4px var(--button-hover-background-color);
			outline: none;
		}

		&:disabled {
			background-color: var(--disabled-background-color);
			color: var(--disabled-text-color);
			border-color: var(--border-color);
			cursor: not-allowed;
		}
	}

	.slider {
		flex: 1;
		position: relative;
		display: flex;
		align-items: center;

		input[type="range"] {
			-webkit-appearance: none;
			width: 100%;
			height: 6px;
			background: var(--border-color);
			border-radius: 3px;
			outline: none;
			cursor: pointer;

			&::-webkit-slider-thumb {
				-webkit-appearance: none;
				width: 16px;
				height: 16px;
				background: var(--button-hover-background-color);
				border-radius: 50%;
				box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
				cursor: pointer;
				transition: background 0.2s;
			}

			&::-webkit-slider-thumb:hover {
				background: var(--button-active-background-color);
			}

			&::-moz-range-thumb {
				width: 16px;
				height: 16px;
				background: var(--button-hover-background-color);
				border-radius: 50%;
				cursor: pointer;
			}
		}
	}

	&:focus-within {
		border-color: var(--button-hover-background-color);
		box-shadow: 0 0 4px var(--button-hover-background-color);
	}

	&.disabled {
		background-color: var(--disabled-background-color);
		color: var(--disabled-text-color);
		border-color: var(--border-color);
		cursor: not-allowed;

		.value {
			color: var(--disabled-text-color);
			cursor: not-allowed;
		}
	}
}
</style>