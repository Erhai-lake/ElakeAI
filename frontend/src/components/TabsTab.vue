<script>
export default {
	name: "TabsTab",
	props: {
		name: {
			type: String,
			required: true
		}
	},
	inject: ["registerTab", "activeName"],
	created() {
		this.registerTab({
			name: this.name,
			labelSlot: this.$slots.label
		})
	}
}
</script>

<template>
	<slot v-if="activeName() === name"/>
</template>