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

export default {
	name: "ChatConfigs",
	inject: ["$DB", "$log"],
	components: {FoldingPanel, SVGIcon, Selector, InputNumber, Button},
	props: {
		chatKey: {
			type: String,
			default: null
		},
		modelValue: {
			type: Boolean,
			default: false
		}
	},
	emits: ["update:modelValue"],
	data() {
		return {
			name: "ChatConfigs",
			configs: {
				temperature: 1,
				frequency_penalty: 0,
				top_p: 1,
				max_tokens: 2048,
				presence_penalty: 0
			},
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
			if (MESSAGE) {
				MESSAGE.message.role = role
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
		 * 移除消息
		 * @param id {String} - 消息ID
		 */
		remove(id) {
			this.chatRecords = this.chatRecords.filter(item => item.id !== id)
			this.chatData = this.chatData.filter(item => item.id !== id)
		},
		/**
		 * 加载聊天配置
		 */
		async loadChatConfig() {
			await this.loadGlobalConfig()
			try {
				const CHAT_DATA = await this.$DB.chats.get(this.chatKey)
				if (CHAT_DATA.configs) {
					this.configs = CHAT_DATA.configs
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
				const CHAT_DATA = await this.$DB.chats.get(this.chatKey)
				if (CHAT_DATA && CHAT_DATA.data) {
					this.chatData = CHAT_DATA.data
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
		getChatRecords:  publicRegistry.debounce(function(page = 1) {
			const PAGE_SIZE = 10
			const OFFSET = (page - 1) * PAGE_SIZE
			let records = JSON.parse(JSON.stringify(this.chatData))
			if (this.order.key === "desc") {
				records.reverse()
			}
			this.page = page
			this.totalPages = Math.ceil(records.length / PAGE_SIZE)
			this.chatRecords = records.slice(OFFSET, OFFSET + PAGE_SIZE)
		}, 100),
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
		 * 保存聊天配置
		 */
		async save() {
			try {
				await this.$DB.chats.update(this.chatKey, {
					data: JSON.parse(JSON.stringify(this.chatData)),
					configs: JSON.parse(JSON.stringify(this.configs))
				})
				this.close()
				EventBus.emit("[function] initChatView")
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
						<div
							class="chat-record-item"
							v-for="item in chatRecords"
							:key="item.id">
							<Selector
								unique-key="title"
								:selector-list="roleList"
								:selector-selected="{title: item.message.role}"
								@select="(role) => updateRoleSelected(role.title, item.id)"/>
							<textarea spellcheck="false" v-model="item.message.content"></textarea>
							<Button class="but" @click="remove(item.id)">
								<SVGIcon name="#icon-close"/>
							</Button>
						</div>
						<div class="pagination">
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
							<InputNumber @input="getChatRecords(page)" v-model="page" :min="1" :max="totalPages" mode="slider"/>
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

.chat-record-item {
	margin-bottom: 10px;
	display: grid;
	grid-template-columns: 100px 1fr 32px;
	gap: 10px;

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
	width: 100%;
	display: grid;
	grid-template-columns: 100px 100px 1fr 100px 200px;
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
	grid-template-columns: 1fr 1fr 1fr;
	gap: 20px;
}
</style>