<script>
export default {
	name: "Tabs",
	props: {
		modelValue: {
			type: String,
			required: true
		}
	},
	emits: ["update:modelValue"],
	data() {
		return {
			tabs: []
		}
	},
	provide() {
		return {
			registerTab: this.registerTab,
			activeName: () => this.modelValue
		}
	},
	methods: {
		registerTab(tab) {
			if (!this.tabs.find(t => t.name === tab.name)) {
				this.tabs.push(tab)
			}
		},
		updateValue(name) {
			this.$emit("update:modelValue", name)
		}
	}
}
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
			border-bottom: 1px solid #80ceff;
		}
	}

	.tab-content {
		padding: 12px;
	}
}
</style>