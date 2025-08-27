<script>
import Button from "@/components/input/Button.vue"
import InputNumber from "@/components/input/InputNumber.vue"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import Selector from "@/components/input/Selector.vue"
import SVGIcon from "@/components/SVGIcon.vue"
import EventBus from "@/services/EventBus"
import FoldingPanel from "@/components/FoldingPanel.vue"
import {publicRegistry} from "@/services/plugin/api/PublicClass"
import InputText from "@/components/input/InputText.vue"
import draggable from "vuedraggable"

export default {
	name: "ChatConfigs",
	inject: ["$DB", "$log"],
	components: {InputText, FoldingPanel, SVGIcon, Selector, InputNumber, Button, draggable},
	props: {
		chatKey: {
			type: String,
			default: null
		},
		modelValue: {
			type: Boolean,
			default: false
		}
		,
		type: {
			type: String,
			default: "chat"
		}
	},
	emits: ["update:modelValue"],
	data() {
		return {
			name: "ChatConfigs",
			chatTitle: "",
			configs: {
				temperature: 1,
				frequency_penalty: 0,
				top_p: 1,
				max_tokens: 2048,
				presence_penalty: 0
			},
			originalChatData: [],
			chatData: [],
			chatRecords: [],
			page: 1,
			totalPages: 0,
			orderList: [
				{
					key: "asc",
					title: "正序"
				},
				{
					key: "desc",
					title: "倒序"
				}
			],
			order: {
				key: "asc",
				title: "正序"
			},
			roleList: [
				{
					title: "user"
				},
				{
					title: "assistant"
				},
				{
					title: "system"
				}
			]
		}
	},
	watch: {
		async modelValue(newVal) {
			if (newVal) {
				await this.init()
			}
		}
	},
	computed: {
		/**
		 * 计算可见页码
		 */
		visiblePages() {
			const PAGES = []
			const LEFT = Math.max(2, this.page - 2)
			const RIGHT = Math.min(this.totalPages, this.page + 2)
			// 首页
			PAGES.push(1)
			if (LEFT > 2) PAGES.push("...")
			// 中间页
			for (let i = LEFT; i <= RIGHT; i++) {
				PAGES.push(i)
			}
			// 尾页
			if (RIGHT < this.totalPages - 1) PAGES.push("...")
			if (this.totalPages > 1) PAGES.push(this.totalPages)
			return PAGES
		}
	},
	async created() {
		if (this.chatKey) {
			await this.init()
		}
	},
	methods: {
		/**
		 * 翻译
		 * @param key {String} - 键
		 * @param {Object} [params] - 插值参数, 例如 { name: "洱海" }
		 * @returns {String} - 翻译后的文本
		 */
		t(key, params = {}) {
			return i18nRegistry.translate(key, params)
		},
		/**
		 * 初始化组件
		 */
		async init() {
			await this.loadChatData()
			await this.loadChatConfig()
			this.page = 1
			this.getChatRecords(this.page, "asc")
		},
		/**
		 * 更新选中角色
		 * @param role {Object} - 角色
		 * @param id {String} - 消息ID
		 */
		updateRoleSelected(role, id) {
			const MESSAGE = this.chatData.find(item => item.id === id)
			if (!MESSAGE) return
			MESSAGE.message.role = role
			const ORIGINAL = this.originalChatData.find(item => item.id === id)
			// 处理 model
			if (role === "user" || role === "system") {
				// 移除 model
				delete MESSAGE.model
			} else if (role === "assistant") {
				if (ORIGINAL && ORIGINAL.model) {
					// 原本有 model, 恢复
					MESSAGE.model = {...ORIGINAL.model}
				} else if (!MESSAGE.model) {
					// 原本没有, 新建
					MESSAGE.model = {platform: "", model: ""}
				}
			}
			const RECORD = this.chatRecords.find(item => item.id === id)
			if (RECORD) {
				RECORD.message.role = MESSAGE.message.role
				RECORD.model = MESSAGE.model
			}
		},
		/**
		 * 更新排序类型
		 * @param order {Object} - 排序类型
		 */
		updateOrderSelected(order) {
			this.order = order
			this.getChatRecords(this.page)
		},
		/**
		 * 加载全局配置
		 */
		async loadGlobalConfig() {
			try {
				const GLOBAL_CONFIG = await this.$DB.configs.get("chatConfigs")
				if (GLOBAL_CONFIG && GLOBAL_CONFIG.value) {
					this.configs = GLOBAL_CONFIG.value
				}
			} catch (error) {
				this.$log.error(`[${this.name}] 获取全局配置失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.ChatConfigs.toast.getError")}`)
			}
		},
		/**
		 * 加载聊天配置
		 */
		async loadChatConfig() {
			await this.loadGlobalConfig()
			try {
				let chatData = null
				if (this.type === "chat") {
					chatData = await this.$DB.chats.get(this.chatKey)
				} else if (this.type === "mask") {
					chatData = await this.$DB.masks.get(this.chatKey)
				}
				if (chatData && chatData.configs) {
					this.chatTitle = chatData.title
					this.configs = chatData.configs
				}
			} catch (error) {
				this.$log.error(`[${this.name}] 获取聊天配置失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.ChatConfigs.toast.getError")}`)
			}
		},
		/**
		 * 加载聊天数据
		 */
		async loadChatData() {
			try {
				let chatData = null
				if (this.type === "chat") {
					chatData = await this.$DB.chats.get(this.chatKey)
				} else if (this.type === "mask") {
					chatData = await this.$DB.masks.get(this.chatKey)
				}
				if (chatData && chatData.data) {
					this.chatData = chatData.data
					this.originalChatData = JSON.parse(JSON.stringify(this.chatData))
				}
			} catch (error) {
				this.$log.error(`[${this.name}] 获取聊天数据失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.ChatConfigs.toast.getError")}`)
			}
		},
		/**
		 * 分页获取聊天记录
		 * @param page {Number} - 页码
		 */
		getChatRecords: publicRegistry.debounce(function (page = 1) {
			const PAGE_SIZE = 10
			const OFFSET = (page - 1) * PAGE_SIZE
			let records = this.chatData.slice()
			if (this.order.key === "desc") {
				records.reverse()
			}
			this.page = page
			this.totalPages = Math.ceil(records.length / PAGE_SIZE)
			this.chatRecords = records.slice(OFFSET, OFFSET + PAGE_SIZE)
		}, 100),
		/**
		 * 新增聊天记录
		 */
		addChatRecord() {
			const MESSAGE = {
				id: crypto.randomUUID(),
				message: {
					role: "user",
					content: ""
				},
				status: "done",
				timestamp: Date.now()
			}
			this.chatData.push(MESSAGE)
			const PAGE_SIZE = 10
			this.totalPages = Math.ceil(this.chatData.length / PAGE_SIZE)
			this.order.key === "asc" ? this.getChatRecords(this.totalPages) : this.getChatRecords(1)
		},
		/**
		 * 移除消息
		 * @param id {String} - 消息ID
		 */
		remove(id) {
			this.chatRecords = this.chatRecords.filter(item => item.id !== id)
			this.chatData = this.chatData.filter(item => item.id !== id)
		},
		/**
		 * 拖动结束
		 */
		onDragEnd() {
			// 重新拼接 chatData
			const PAGE_SIZE = 10
			let records = this.chatData.slice()
			if (this.order.key === "desc") {
				records.reverse()
			}
			// 替换掉当前页的数据
			const OFFSET = (this.page - 1) * PAGE_SIZE
			records.splice(OFFSET, this.chatRecords.length, ...this.chatRecords)
			// 再反转回去
			if (this.order.key === "desc") {
				records.reverse()
			}
			this.chatData = records
		},
		/**
		 * 移动
		 * @param id {String} - 消息ID
		 * @param type {String} - 移动类型
		 */
		move(id, type) {
			const PAGE_SIZE = 10
			const INDEX_ALL = this.chatData.findIndex(item => item.id === id)
			if (INDEX_ALL === -1) return
			let newIndex = INDEX_ALL
			const IS_DESC = this.order.key === "desc"
			// 移动数据
			if (type === "up") {
				if (IS_DESC && INDEX_ALL < this.chatData.length - 1) {
					[this.chatData[INDEX_ALL], this.chatData[INDEX_ALL + 1]] = [this.chatData[INDEX_ALL + 1], this.chatData[INDEX_ALL]]
					newIndex = INDEX_ALL + 1
				} else if (!IS_DESC && INDEX_ALL > 0) {
					[this.chatData[INDEX_ALL - 1], this.chatData[INDEX_ALL]] = [this.chatData[INDEX_ALL], this.chatData[INDEX_ALL - 1]]
					newIndex = INDEX_ALL - 1
				} else return
			} else if (type === "down") {
				if (IS_DESC && INDEX_ALL > 0) {
					[this.chatData[INDEX_ALL - 1], this.chatData[INDEX_ALL]] = [this.chatData[INDEX_ALL], this.chatData[INDEX_ALL - 1]]
					newIndex = INDEX_ALL - 1
				} else if (!IS_DESC && INDEX_ALL < this.chatData.length - 1) {
					[this.chatData[INDEX_ALL], this.chatData[INDEX_ALL + 1]] = [this.chatData[INDEX_ALL + 1], this.chatData[INDEX_ALL]]
					newIndex = INDEX_ALL + 1
				} else return
			}
			// 当前页索引范围
			const PAGE_START = IS_DESC
				? this.chatData.length - this.page * PAGE_SIZE
				: (this.page - 1) * PAGE_SIZE
			const PAGE_END = PAGE_START + PAGE_SIZE - 1
			// 判断是否需要翻页
			if (!IS_DESC) {
				if (newIndex < PAGE_START && this.page > 1) {
					this.page--
				} else if (newIndex > PAGE_END && this.page < this.totalPages) {
					this.page++
				}
			} else {
				if (newIndex < PAGE_START && this.page < this.totalPages) {
					this.page++
				} else if (newIndex > PAGE_END && this.page > 1) {
					this.page--
				}
			}
			// 更新当前页显示
			this.getChatRecords(this.page)
		},
		/**
		 * 保存聊天配置
		 */
		async save() {
			try {
				// 检查标题是否为空
				if (!this.chatTitle.trim()) {
					this.chatTitle = this.t("components.AIInput.newChat")
				}
				// 检查是否为面具
				if (this.type === "chat") {
					await this.$DB.chats.update(this.chatKey, {
						title: this.chatTitle,
						data: JSON.parse(JSON.stringify(this.chatData)),
						configs: JSON.parse(JSON.stringify(this.configs))
					})
					EventBus.emit("[function] initChatView")
					EventBus.emit("[update] chatListUpdate")
				} else if (this.type === "mask") {
					await this.$DB.masks.update(this.chatKey, {
						title: this.chatTitle,
						data: JSON.parse(JSON.stringify(this.chatData)),
						configs: JSON.parse(JSON.stringify(this.configs))
					})
					EventBus.emit("[update] maskListUpdate")
				}
				this.close()
				toastRegistry.success(`[${this.name}] ${this.t("views.ChatConfigs.toast.saveSuccess")}`)
			} catch (error) {
				this.$log.error(`[${this.name}] 保存聊天配置失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.ChatConfigs.toast.saveError")}`)
			}
		},
		/**
		 * 关闭
		 */
		close() {
			this.$emit("update:modelValue", false)
		},
		/**
		 * 保存到面具
		 */
		async saveMask() {
			try {
				await this.$DB.masks.add({
					key: crypto.randomUUID(),
					title: this.chatTitle,
					data: JSON.parse(JSON.stringify(this.chatData)),
					configs: JSON.parse(JSON.stringify(this.configs))
				})
				EventBus.emit("[update] maskListUpdate")
				toastRegistry.success(`[${this.name}] ${this.t("views.ChatConfigs.toast.saveMaskSuccess")}`)
			} catch (error) {
				this.$log.error(`[${this.name}] 保存面具失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.ChatConfigs.toast.saveMaskError")}`)
			}
		}
	}
}
</script>

<template>
	<transition name="fade">
		<div class="chat-configs" v-if="modelValue" @click="close">
			<div class="chat-configs-content" @click.stop>
				<h2>{{ t("views.ChatConfigs.chatSetup") }}</h2>
				<div class="chat-configs-content-container">
					<div class="container">
						<div class="item">
							<p>{{ t("views.ChatConfigs.chatTitle") }}</p>
							<InputText v-model="chatTitle"/>
						</div>
					</div>
					<div class="container">
						<draggable
							v-model="chatRecords"
							item-key="id"
							handle=".move"
							animation="200"
							ghost-class="dragging-ghost"
							chosen-class="dragging-chosen"
							@end="onDragEnd">
							<template #item="{element}">
								<div class="chat-record-item">
									<SVGIcon name="#icon-move" class="move"/>
									<div class="move-button">
										<Button class="but" @click="move(element.id, 'up')">
											<SVGIcon name="#icon-upArrow"/>
										</Button>
										<Button class="but" @click="move(element.id, 'down')">
											<SVGIcon name="#icon-downArrow"/>
										</Button>
									</div>
									<Selector
										unique-key="title"
										:selector-list="roleList"
										:selector-selected="{title: element.message.role}"
										@select="(role) => updateRoleSelected(role.title, element.id)"/>
									<div class="input-container" v-if="element.message.role === 'assistant'">
										<InputText v-model="element.model.platform"/>
										<InputText v-model="element.model.model"/>
									</div>
									<div v-else></div>
									<textarea spellcheck="false" v-model="element.message.content"></textarea>
									<Button class="but" @click="remove(element.id)">
										<SVGIcon name="#icon-close"/>
									</Button>
								</div>
							</template>
						</draggable>
						<hr>
						<div class="pagination">
							<Button @click="addChatRecord()">新增</Button>
							<Selector
								unique-key="key"
								:selector-list="orderList"
								:selector-selected="order"
								@select="updateOrderSelected"/>
							<Button @click="getChatRecords(page - 1)" :disabled="page === 1">
								上一页
							</Button>
							<div class="page-btn-container">
								<Button
									v-for="num in visiblePages"
									:key="num"
									:class="['page-btn', { active: num === page, ellipsis: num === '...' }]"
									@click="getChatRecords(num)"
									:disabled="num === '...'">
									{{ num }}
								</Button>
							</div>
							<Button @click="getChatRecords(page + 1)" :disabled="page === totalPages">
								下一页
							</Button>
							<InputNumber
								@input="getChatRecords(page)"
								v-model="page"
								:min="1"
								:max="totalPages"
								mode="slider"/>
						</div>
					</div>
					<div class="container">
						<div class="item">
							<p>{{ t("views.ChatConfigs.temperature") }} [<em>temperature</em>]</p>
							<InputNumber
								v-model="configs.temperature"
								mode="slider"
								:min="0.1"
								:max="2"
								:step="0.1"/>
						</div>
						<div class="item">
							<p>{{ t("views.ChatConfigs.top_p") }} [<em>top_p</em>]</p>
							<InputNumber
								v-model="configs.top_p"
								mode="slider"
								:min="0.1"
								:max="1"
								:step="0.1"/>
						</div>
						<div class="item">
							<p>{{ t("views.ChatConfigs.max_tokens") }} [<em>max_tokens</em>]</p>
							<InputNumber
								v-model="configs.max_tokens"
								:min="1"
								:max="4096"/>
						</div>
						<div class="item">
							<p>{{ t("views.ChatConfigs.presence_penalty") }} [<em>presence_penalty</em>]</p>
							<InputNumber
								v-model="configs.presence_penalty"
								mode="slider"
								:min="-2"
								:max="2"
								:step="0.1"/>
						</div>
						<div class="item">
							<p>{{ t("views.ChatConfigs.frequency_penalty") }} [<em>frequency_penalty</em>]</p>
							<InputNumber
								v-model="configs.frequency_penalty"
								mode="slider"
								:min="-2"
								:max="2"
								:step="0.1"/>
						</div>
					</div>
					<div class="container">
					</div>
				</div>
				<div class="but">
					<Button @click="close">{{ t("views.ChatConfigs.close") }}</Button>
					<Button @click="save">{{ t("views.ChatConfigs.save") }}</Button>
					<Button @click="saveMask">{{ t("views.ChatConfigs.saveMask") }}</Button>
					<Button @click="loadGlobalConfig">{{ t("views.ChatConfigs.global") }}</Button>
				</div>
			</div>
		</div>
	</transition>
</template>

<style scoped lang="less">
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
	opacity: 1;
}

.chat-configs {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(127, 127, 127, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 4;
}

.chat-configs-content {
	position: absolute;
	top: 50%;
	left: 50%;
	padding: 20px;
	width: 80%;
	height: 80%;
	transform: translate(-50%, -50%);
	background-color: var(--background-color);
	border-radius: 12px;
	display: grid;
	grid-template-rows: 50px 1fr 50px;
	z-index: 5;

	h2 {
		text-align: center;
	}

	.chat-configs-content-container {
		padding: 0 20px;
		overflow: hidden auto;
	}
}

.dragging-chosen {
	background-color: var(--theme-color);
}

.dragging-ghost {
	opacity: 0.5;
	background-color: var(--theme-color);
}

.chat-record-item {
	margin-bottom: 10px;
	display: grid;
	grid-template-columns: auto auto 100px auto 1fr auto;
	align-items: center;
	gap: 5px;

	.move {
		cursor: move;
	}

	.move-button {
		button {
			height: 22px;
		}

		button:first-child {
			border-radius: 8px 8px 0 0;
		}

		button:last-child {
			border-radius: 0 0 8px 8px;
		}
	}

	.input-container {
		margin-left: 5px;
		display: grid;
		grid-template-columns: 100px 150px;
		gap: 5px;
	}

	textarea {
		padding: 10px 12px;
		box-sizing: border-box;
		width: 100%;
		height: 45px;
		background-color: var(--background-color);
		color: var(--text-color);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		font-size: 14px;
		resize: none;

		&:focus {
			outline: none;
			border-color: var(--button-hover-background-color);
			box-shadow: 0 0 4px var(--button-hover-background-color);
		}
	}

	.but {
		width: 100%;
		height: 45px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
}

.pagination {
	margin-top: 20px;
	width: 100%;
	display: grid;
	grid-template-columns: 100px 100px auto 1fr auto auto;
	gap: 10px;

	.page-btn-container {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;

		.page-btn {
			padding: 10px;
		}

		.page-btn.active {
			background-color: var(--theme-color);
			color: var(--text-color-anti);
		}

		.page-btn.ellipsis {
			cursor: default;
			background: transparent;
			border: none;
		}
	}
}

.container {
	padding: 20px;
	margin-bottom: 20px;
	border-radius: 10px;
	background-color: rgba(127, 127, 127, 0.5);
	border: 1px solid var(--border-color);
}

.item {
	padding: 10px;
	display: grid;
	grid-template-columns: 1fr 200px;
	align-items: center;
	gap: 10px;
	border-bottom: 1px solid var(--border-color);
	border-top: 1px solid var(--border-color);
	white-space: nowrap;
}

.but {
	padding: 10px;
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 20px;
}
</style>