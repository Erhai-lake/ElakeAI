<script>
export default {
	name: "InputCheckbox",
	props: {
		modelValue: {
			type: [Boolean, Array],
			default: false
		},
		value: {
			type: [String, Number, Boolean, Object],
			default: null
		},
		disabled: {
			type: Boolean,
			default: false
		},
		titleLocation: {
			type: String,
			default: "left"
		}
	},
	emits: ["update:modelValue", "change"],
	computed: {
		checked() {
			if (Array.isArray(this.modelValue)) {
				return this.modelValue.includes(this.value)
			}
			return this.modelValue
		}
	},
	methods: {
		onChange(event) {
			let newValue
			if (Array.isArray(this.modelValue)) {
				const ARR = [...this.modelValue]
				if (event.target.checked) {
					if (!ARR.includes(this.value)) ARR.push(this.value)
				} else {
					const I = ARR.indexOf(this.value)
					if (I > -1) ARR.splice(I, 1)
				}
				newValue = ARR
			} else {
				newValue = event.target.checked
			}
			this.$emit("update:modelValue", newValue)
			this.$emit("change", event)
		}
	}
}
</script>

<template>
	<label class="checkbox-wrapper">
		<span class="title" v-if="titleLocation === 'left'" :class="{ 'left-title': $slots.default }"><slot/></span>
		<input type="checkbox" :value="value" :checked="checked" :disabled="disabled" @change="onChange"/>
		<span class="custom-checkbox"></span>
		<span class="title" v-if="titleLocation === 'right'" :class="{ 'right-title': $slots.default }"><slot/></span>
	</label>
</template>

<style scoped lang="less">
.checkbox-wrapper {
	display: inline-flex;
	align-items: center;
	cursor: pointer;
	line-height: 1;

	input[type="checkbox"] {
		display: none;

		&:checked + .custom-checkbox::after {
			opacity: 1;
		}

		&:disabled + .custom-checkbox {
			cursor: not-allowed;
			opacity: 0.6;
		}
	}

	.custom-checkbox {
		display: inline-block;
		width: 20px;
		height: 20px;
		box-sizing: border-box;
		vertical-align: middle;
		border: 2px solid var(--border-color);
		border-radius: 4px;
		position: relative;
		cursor: pointer;

		&::after {
			content: "";
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 10px;
			height: 10px;
			background-color: var(--background-color-anti);
			border-radius: 2px;
			opacity: 0;
			transition: opacity 0.2s;
		}
	}

	.title {
		line-height: 20px;
	}

	.left-title {
		margin-right: 8px;
	}

	.right-title {
		margin-left: 8px;
	}
}
</style>