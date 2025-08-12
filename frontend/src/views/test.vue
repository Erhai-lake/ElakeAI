<script>
import RightClickMenu from "@/components/RightClickMenu.vue"

export default {
	name: "test",
	components: {RightClickMenu},
	data() {
		return {
			list: [
				{ id: 1, name: "文件1" },
				{ id: 2, name: "文件2" }
			]
		}
	},
	methods: {
		onRightClick(event, item) {
			event.preventDefault()
			event.stopPropagation()
			this.$refs.menu.show(event.clientX, event.clientY, [
				{
					title: "打开",
					icon: {
						type: "svg",
						src: "#icon-new"
					},
					onClick: (key) => console.log("打开", key)
				},
				{
					title: "打开",
					icon: {
						type: "svg",
						src: "#icon-new"
					},
					color: "#1890ff",
					onClick: (key) => console.log("打开", key)
				},
				{
					title: "删除",
					icon: {
						type: "svg",
						src: "#icon-delete"
					},
					color: "red",
					onClick: (key) => console.log("删除", key)
				}
			], item.id)
		}
	}
}
</script>

<template>
	<div>
		<div
			v-for="item in list"
			:key="item.id"
			class="list-item"
			@contextmenu.prevent="onRightClick($event, item)">
			{{ item.name }}
		</div>
		<RightClickMenu ref="menu" />
	</div>
</template>

<style scoped lang="less">

</style>