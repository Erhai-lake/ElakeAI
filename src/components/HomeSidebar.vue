<script>
import {defineComponent} from "vue"
import EventBus from "@/services/EventBus"
import {useRoute} from "vue-router";

export default defineComponent({
    name: "HomeSidebar",
    inject: ["$DB"],
    data() {
        return {
            route: useRoute(),
            sidebarStatus: 1,
            chatList: []
        }
    },
    mounted() {
        // 判断是否为移动端
        if (window.innerWidth < 768) {
            this.sidebarStatus = 0
        }
        // 初始化时获取聊天列表
        this.chatListGet()
        // 监听更新列表事件
        EventBus.on("[function] chatListGet", this.chatListGet)
    },
    beforeUnmount() {
        // 移除更新列表事件监听
        EventBus.off("[function] chatListGet", this.chatListGet)
    },
    async created() {
        if (!this.route.params.key) return
        const CHAT_DATA = await this.$DB.Chats.get(this.route.params.key)
        console.log("CHAT_DATA", CHAT_DATA)
    },
    methods: {
        /**
         * 侧边栏展开收起
         */
        sidebarSwitch() {
            const SIDEBAR_EXPAND = document.querySelector(".SidebarExpandContainer")
            const SIDEBAR_STOW = document.querySelector(".SidebarStowContainer")
            if (this.sidebarStatus === 1) {
                if (SIDEBAR_EXPAND) {
                    SIDEBAR_EXPAND.style.transform = "translateX(-100%)"
                    setTimeout(() => {
                        this.sidebarStatus = 0
                    }, 100)
                }
            } else if (this.sidebarStatus === 0) {
                if (SIDEBAR_STOW) {
                    SIDEBAR_STOW.style.transform = "translateX(-100%)"
                    setTimeout(() => {
                        this.sidebarStatus = 1
                    }, 100)
                }
            }
        },
        /**
         * 获取聊天列表
         */
        async chatListGet() {
            try {
                const CHAT_LIST = await this.$DB.Chats.toArray()
                let GROUPED_CHATS = []
                for (const ITEM of CHAT_LIST) {
                    GROUPED_CHATS = GROUPED_CHATS || []
                    GROUPED_CHATS.push({
                        key: String(ITEM.key),
                        title: ITEM.title,
                        length: ITEM.data.length,
                        timestamp: ITEM.timestamp,
                    })
                }
                // 按时间排序
                this.chatList = GROUPED_CHATS.sort((a, b) => b.timestamp - a.timestamp)
            } catch (error) {
                console.error("[Home Sidebar] 聊天列表获取错误", error)
                this.$toast.error(`[Home Sidebar] ${this.$t("components.HomeSidebar.toast.errorGettingChatList")}`)
            }
        },
        // 格式化时间戳
        formatTimestamp(timestamp) {
            const DATE = new Date(timestamp)
            const YEAR = DATE.getFullYear()
            const MONTH = String(DATE.getMonth() + 1).padStart(2, "0")
            const DAY = String(DATE.getDate()).padStart(2, "0")
            const HOURS = String(DATE.getHours()).padStart(2, "0")
            const MINUTES = String(DATE.getMinutes()).padStart(2, "0")
            const SECONDS = String(DATE.getSeconds()).padStart(2, "0")
            return `${YEAR}-${MONTH}-${DAY} ${HOURS}:${MINUTES}:${SECONDS}`
        },
        /**
         * 打开聊天
         * @param key 聊天ID
         */
        openChat(key) {
            this.$router.push(`/chat/${key}`)
        },
        /**
         * 删除聊天
         * @param key 聊天ID
         */
        async deleteChat(key) {
            try {
                await this.$DB.Chats.delete(key)
                this.$toast.success(`[Home Sidebar] ${this.$t("components.HomeSidebar.toast.successDeletingChatList")}`)
                await this.chatListGet()
            } catch (error) {
                console.error("[Home Sidebar] 聊天列表删除错误", error)
                this.$toast.error(`[Home Sidebar] ${this.$t("components.HomeSidebar.toast.errorDeletingChatList")}`)
            }
        }
    }
})
</script>

<template>
    <div class="SidebarContainer SidebarExpandContainer" v-if="sidebarStatus === 1">
        <div class="SidebarTop">
            <div class="SidebarTopLogo"></div>
            <p>ElakeAI</p>
            <router-link to="/" class="SidebarNew" :title="$t('components.HomeSidebar.function.new')">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-new"></use>
                </svg>
            </router-link>
            <div class="SidebarStow" :title="$t('components.HomeSidebar.function.stow')" @click="sidebarSwitch">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-stow"></use>
                </svg>
            </div>
        </div>
        <div class="SidebarConversationList">
            <div
                class="ConversationCard"
                :class="{'Active': route.params.key === chatItem.key}"
                v-for="chatItem in chatList"
                :key="chatItem.key"
                @click="openChat(chatItem.key)">
                <p class="Title" :title="chatItem.title">{{ chatItem.title }}</p>
                <div class="Bottom">
                    <p>{{ $t("components.HomeSidebar.numberOfConversations", {num: chatItem.length}) }}</p>
                    <p>{{ formatTimestamp(chatItem.timestamp) }}</p>
                </div>
                <div
                    class="ConversationDelete"
                    :title="$t('components.HomeSidebar.function.delete')"
                    @click.stop="deleteChat(chatItem.key)">
                    <svg class="icon" aria-hidden="true">
                        <use xlink:href="#icon-delete"></use>
                    </svg>
                </div>
            </div>
        </div>
        <div class="SidebarPreset" :title="$t('components.HomeSidebar.function.preset')">
            <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-preset"></use>
            </svg>
            <p>{{ $t("components.HomeSidebar.function.preset") }}</p>
        </div>
        <router-link to="/options" class="SidebarSetup" :title="$t('components.HomeSidebar.function.options')">
            <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-setup"></use>
            </svg>
            <p>{{ $t("components.HomeSidebar.function.options") }}</p>
        </router-link>
    </div>
    <div class="SidebarContainer SidebarStowContainer" v-if="sidebarStatus === 0">
        <div class="SidebarTopLogo"></div>
        <router-link to="/" class="SidebarNew" :title="$t('components.HomeSidebar.function.new')">
            <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-new"></use>
            </svg>
        </router-link>
        <div class="SidebarExpand" :title="$t('components.HomeSidebar.function.expand')" @click="sidebarSwitch">
            <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-expand"></use>
            </svg>
        </div>
        <div class="SidebarPreset" :title="$t('components.HomeSidebar.function.preset')">
            <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-preset"></use>
            </svg>
        </div>
        <div></div>
        <router-link to="/options" class="SidebarSetup" :title="$t('components.HomeSidebar.function.options')">
            <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-setup"></use>
            </svg>
        </router-link>
    </div>
</template>

<style scoped lang="less">
.icon {
    width: 2em;
    height: 2em;
    vertical-align: -0.15em;
    fill: currentColor;
    overflow: hidden;
}

.SidebarContainer {
    height: 100%;
    background-color: var(--sidebar-expand-container-background-color);
    border-right: 1px solid var(--border-color);
    display: grid;
    user-select: none;
    transform: translateX(0%);
    transition: transform 0.3s ease;

    .SidebarTopLogo {
        width: 48px;
        height: 48px;
        background-image: url("~@/assets/images/logo.png");
        background-size: cover;
        background-repeat: no-repeat;
        background-position: center;
    }

    .SidebarNew, .SidebarStow, .SidebarPreset, .SidebarSetup {
        cursor: pointer;
    }
}

.SidebarExpandContainer {
    width: 256px;
    grid-template-rows: auto 1fr auto auto;

    .SidebarTop {
        padding: 0 8px;
        border-bottom: 1px solid var(--border-color);
        display: grid;
        grid-template-rows: 64px;
        align-items: center;
        justify-items: center;
        grid-template-columns: 48px 1fr repeat(2, 32px);

        p {
            margin: 0 20px;
            font-size: 18px;
            color: var(--text-color);
        }
    }

    .SidebarConversationList {
        padding: 0 20px;
        white-space: nowrap;
        overflow: hidden auto;
    }

    .ConversationCard {
        position: relative;
        padding: 10px;
        margin: 20px 0;
        border: 2px solid var(--border-color);
        border-radius: 10px;
        overflow: hidden;
        cursor: pointer;

        &.Active {
            border-color: #80ceff;
        }

        &:hover {
            background-color: var(--sidebar-item-hover-background-color);

            .Title {
                color: var(--text-color-Anti);
            }

            .Bottom {
                color: var(--sidebar-expand-container-info-text-color-Anti);
            }

            .ConversationDelete {
                opacity: 1;
            }
        }

        .Title {
            color: var(--text-color);
            font-size: 16px;
            font-weight: bold;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .Bottom {
            margin-top: 10px;
            color: var(--sidebar-expand-container-info-text-color);
            font-size: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .ConversationDelete{
            position: absolute;
            top: 0;
            right: 0;
            opacity: 0;

            svg {
                width: 24px;
                height: 24px;
            }
        }
    }

    .SidebarPreset, .SidebarSetup {
        padding: 0 8px;
        border-top: 1px solid var(--border-color);
        display: grid;
        grid-template-columns: 48px 1fr;
        grid-template-rows: 64px;
        align-items: center;
        justify-items: center;
    }
}

.SidebarStowContainer {
    width: 64px;
    grid-template-rows: auto auto auto auto 1fr auto;
    justify-items: center;

    .SidebarTopLogo {
        margin: 15px 0;
    }

    .SidebarNew, .SidebarExpand, .SidebarPreset, .SidebarSetup {
        padding: 5px;
        margin: 10px 0;
        border-radius: 10px;

        &:hover {
            background-color: var(--sidebar-item-hover-background-color);
        }
    }
}
</style>