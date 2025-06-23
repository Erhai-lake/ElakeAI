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
	mounted() {
		this.registerTab({
			name: this.name,
			labelSlot: this.$slots.label
		})
	}
}
</script>

<template>
	<div v-if="activeName() === name">
		<slot/>
	</div>
</template>

<style scoped lang="less">
</style>