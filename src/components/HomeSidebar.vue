<script>
import {defineComponent} from "vue"

export default defineComponent({
    name: "HomeSidebar",
    inject: ["$DB"],
    data() {
        return {
            SidebarStatus: 1,
            ChatList: []
        }
    },
    mounted() {
        // try {
        // this.$DB.Chats.add({
        //     key: "aa_bb_cc",
        //     title: "abc*2",
        //     data: [{
        //         model: "gpt-3.5-turbo",
        //         messages: {
        //             content: "你好",
        //             role: "user"
        //         },
        //         timestamp: 1741326699000
        //     }]
        // })
        // console.log(this.$ChatDB.add({
        //     key: "c",
        //     title: "c",
        //     data: [
        //         {
        //             model: "gpt-3.5-turbo",
        //             messages: {
        //                 content: "你好",
        //                 role: "user"
        //             },
        //             timestamp: 1746959840000
        //         }
        //     ]
        // }))
        // console.log(ChatDB.add({
        //     key: "c",
        //     title: "c",
        //     data: [
        //         {
        //             model: "gpt-3.5-turbo",
        //             messages: {
        //                 content: "你好",
        //                 role: "user"
        //             },
        //             timestamp: 1746510934000
        //         }
        //     ]
        // }))
        // console.log(ChatDB.add({
        //     key: "d",
        //     title: "d",
        //     data: [
        //         {
        //             model: "gpt-3.5-turbo",
        //             messages: {
        //                 content: "你好",
        //                 role: "user"
        //             },
        //             timestamp: 1746597099000
        //         }
        //     ]
        // }))
        // } catch (error) {
        //     console.error("添加数据失败:", error)
        // }


        // 判断是否为移动端
        if (window.innerWidth < 768) {
            this.SidebarStatus = 0
        }
        // 初始化时获取聊天列表
        this.chatListGet()
    },
    methods: {
        /**
         * 侧边栏展开收起
         */
        sidebarSwitch() {
            const SIDEBAR_EXPAND = document.querySelector(".SidebarExpandContainer")
            const SIDEBAR_STOW = document.querySelector(".SidebarStowContainer")
            if (this.SidebarStatus === 1) {
                if (SIDEBAR_EXPAND) {
                    SIDEBAR_EXPAND.style.transform = "translateX(-100%)"
                    setTimeout(() => {
                        this.SidebarStatus = 0
                    }, 100)
                }
            } else if (this.SidebarStatus === 0) {
                if (SIDEBAR_STOW) {
                    SIDEBAR_STOW.style.transform = "translateX(-100%)"
                    setTimeout(() => {
                        this.SidebarStatus = 1
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
                const GROUPED_CHATS = {}
                for (const ITEM of CHAT_LIST) {
                    const SAFE_KEY = this.getTimeRangeLabel(ITEM.data[ITEM.data.length - 1].timestamp)
                    GROUPED_CHATS[SAFE_KEY] = GROUPED_CHATS[SAFE_KEY] || []
                    GROUPED_CHATS[SAFE_KEY].push({
                        key: String(ITEM.key),
                        title: ITEM.title
                    })
                }
                // 将分组数据转换成数组并按时间排序
                this.ChatList = Object.entries(GROUPED_CHATS)
                    .map(([TimeRangeLabel, Data]) => {
                        // 计算 sortKey
                        let sortKey
                        if (TimeRangeLabel === this.$t("components.HomeSidebar.timeRangeLabel.1")) {
                            sortKey = 0
                        } else if (TimeRangeLabel === this.$t("components.HomeSidebar.timeRangeLabel.30")) {
                            sortKey = 1
                        } else {
                            const [year, month] = TimeRangeLabel.split("-").map(Number)
                            sortKey = 2 + new Date(year, month - 1).getTime()
                        }
                        return {TimeRangeLabel, Data, sortKey}
                    })
                    .sort((a, b) => a.sortKey - b.sortKey)
                    .map(({TimeRangeLabel, Data}) => ({TimeRangeLabel, Data}))
            } catch (error) {
                console.error("[Language Switch] 聊天列表获取错误", error)
                this.$toast.error("[Language Switch] 聊天列表获取错误")
            }
        },
        /**
         * 获取时间范围标签
         * @param timestamp 时间戳
         */
        getTimeRangeLabel(timestamp) {
            const NOW = Date.now()
            const NOEDAYMS = 24 * 60 * 60 * 1000
            const DATE = new Date(timestamp)
            const NOW_DATE = new Date(NOW)
            // 检查是否是今天
            if (
                DATE.getDate() === NOW_DATE.getDate() &&
                DATE.getMonth() === NOW_DATE.getMonth() &&
                DATE.getFullYear() === NOW_DATE.getFullYear()
            ) {
                return this.$t("components.HomeSidebar.timeRangeLabel.1")
            }
            // 检查是否是30天内（不包括今天）
            const DIFF_DAYS = Math.floor((NOW - timestamp) / NOEDAYMS)
            if (DIFF_DAYS <= 30 && DIFF_DAYS > 0) {
                return this.$t("components.HomeSidebar.timeRangeLabel.30")
            }
            // 否则返回年月格式 "YYYY-MM"
            const YEAR = DATE.getFullYear()
            const MONTH = String(DATE.getMonth() + 1).padStart(2, "0")
            return `${YEAR}-${MONTH}`
        },
        /**
         * 打开聊天
         * @param key 聊天ID
         */
        openChat(key) {
            this.$toast.success(key)
        }
    }
})
</script>

<template>
    <div class="SidebarContainer SidebarExpandContainer" v-if="SidebarStatus === 1">
        <div class="SidebarTop">
            <div class="SidebarTopLogo"></div>
            <p>ElakeAI</p>
            <router-link to="/" class="SidebarNew" :title="$t('components.HomeSidebar.function.new')">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-New"></use>
                </svg>
            </router-link>
            <div class="SidebarStow" :title="$t('components.HomeSidebar.function.stow')" @click="sidebarSwitch">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-Stow"></use>
                </svg>
            </div>
        </div>
        <div class="SidebarConversationList">
            <div
                class="SidebarConversationListTimeRangeLabel"
                v-for="(timeRangeLabelItem, timeRangeLabelIndex) in this.ChatList"
                :key="timeRangeLabelIndex">
                <p>{{ timeRangeLabelItem.TimeRangeLabel }}</p>
                <div
                    class="SidebarConversationListTitle"
                    v-for="(titleItem, titleIndex) in timeRangeLabelItem.Data"
                    :key="titleIndex" :title="titleItem.title" @click="openChat(titleItem.key)">
                    <p>{{ titleItem.title }}</p>
                    <div class="SidebarConversationListTitleMore">
                        <svg class="icon" aria-hidden="true">
                            <use xlink:href="#icon-More"></use>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
        <div class="SidebarPreset" :title="$t('components.HomeSidebar.function.preset')">
            <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-Preset"></use>
            </svg>
            <p>{{ $t("components.HomeSidebar.function.preset") }}</p>
        </div>
        <router-link to="/options" class="SidebarSetup" :title="$t('components.HomeSidebar.function.options')">
            <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-Setup"></use>
            </svg>
            <p>{{ $t("components.HomeSidebar.function.options") }}</p>
        </router-link>
    </div>
    <div class="SidebarContainer SidebarStowContainer" v-if="SidebarStatus === 0">
        <div class="SidebarTopLogo"></div>
        <router-link to="/" class="SidebarNew" :title="$t('components.HomeSidebar.function.new')">
            <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-New"></use>
            </svg>
        </router-link>
        <div class="SidebarExpand" :title="$t('components.HomeSidebar.function.expand')" @click="sidebarSwitch">
            <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-Stow"></use>
            </svg>
        </div>
        <div class="SidebarPreset" :title="$t('components.HomeSidebar.function.preset')">
            <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-Preset"></use>
            </svg>
        </div>
        <div></div>
        <router-link to="/options" class="SidebarSetup" :title="$t('components.HomeSidebar.function.options')">
            <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-Setup"></use>
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
        padding: 5px;
        white-space: nowrap;
        overflow: hidden auto;

        .SidebarConversationListTimeRangeLabel {
            p {
                padding: 10px 5px;
                color: var(--sidebar-expand-container-text-color);
            }

            .SidebarConversationListTitle {
                padding: 0 20px;
                height: 38px;
                display: grid;
                grid-template-columns: 1fr auto;
                align-items: center;
                border-radius: 15px;
                cursor: pointer;

                p {
                    overflow: hidden;
                    color: var(--text-color);
                }

                .SidebarConversationListTitleMore {
                    display: none;
                }

                &:hover {
                    background-color: var(--sidebar-item-hover-background-color);

                    .SidebarConversationListTitleMore {
                        display: block;
                    }
                }
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