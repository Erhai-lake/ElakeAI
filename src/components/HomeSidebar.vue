<!--suppress TypeScriptValidateTypes -->
<script lang="ts">
import {defineComponent} from 'vue'
import {ChatDB} from '@/services/ChatDB'

interface ChatMessage {
    model: string
    messages: {
        content: string
        role: string
    }
    timestamp: number
}

interface ChatItem {
    key: string
    timestamp: number
    data: ChatMessage[]
}

interface ChatGroup {
    TimeRangeLabel: string
    Data: ChatItem[]
}

export default defineComponent({
    name: "HomeSidebar",
    data() {
        return {
            SidebarStatus: 1,
            ChatList: [] as ChatGroup[]
        }
    },
    mounted() {
        // try {
        // console.log(ChatDB.add({
        //     key: 'aa',
        //     title: '',
        //     data: [
        //         {
        //             model: 'gpt-3.5-turbo',
        //             messages: {
        //                 content: '你好',
        //                 role: 'user'
        //             },
        //             timestamp: 1741326699000
        //         }
        //     ]
        // }))
        // console.log(ChatDB.add({
        //     key: 'b',
        //     title: 'b',
        //     data: [
        //         {
        //             model: 'gpt-3.5-turbo',
        //             messages: {
        //                 content: '你好',
        //                 role: 'user'
        //             },
        //             timestamp: 1744005099000
        //         }
        //     ]
        // }))
        // console.log(ChatDB.add({
        //     key: 'c',
        //     title: 'c',
        //     data: [
        //         {
        //             model: 'gpt-3.5-turbo',
        //             messages: {
        //                 content: '你好',
        //                 role: 'user'
        //             },
        //             timestamp: 1746510934000
        //         }
        //     ]
        // }))
        // console.log(ChatDB.add({
        //     key: 'd',
        //     title: 'd',
        //     data: [
        //         {
        //             model: 'gpt-3.5-turbo',
        //             messages: {
        //                 content: '你好',
        //                 role: 'user'
        //             },
        //             timestamp: 1746597099000
        //         }
        //     ]
        // }))
        // } catch (error) {
        //     console.error('添加数据失败:', error)
        // }
        this.chatListGet()
    },
    methods: {
        /**
         * 侧边栏展开收起
         */
        sidebarSwitch() {
            const SIDEBAR_EXPAND = document.querySelector('.SidebarExpandContainer') as HTMLElement | null
            const SIDEBAR_STOW = document.querySelector('.SidebarStowContainer') as HTMLElement | null
            if (this.SidebarStatus === 1) {
                if (SIDEBAR_EXPAND) {
                    SIDEBAR_EXPAND.style.transform = 'translateX(-100%)'
                    setTimeout(() => {
                        this.SidebarStatus = 0
                    }, 100)
                }
            } else if (this.SidebarStatus === 0) {
                if (SIDEBAR_STOW) {
                    SIDEBAR_STOW.style.transform = 'translateX(-100%)'
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
                const CHAT_LIST = await ChatDB.getAll()
                const GROUPED_CHATS: Record<string, any[]> = {}
                for (const ITEM of CHAT_LIST) {
                    const TIME_RANGE_LABEL = this.getTimeRangeLabel(ITEM.data[ITEM.data.length - 1].timestamp)
                    if (!GROUPED_CHATS[TIME_RANGE_LABEL]) {
                        GROUPED_CHATS[TIME_RANGE_LABEL] = []
                    }
                    GROUPED_CHATS[TIME_RANGE_LABEL].push(ITEM)
                }
                // 将分组数据转换成数组并按时间排序
                this.ChatList = Object.entries(GROUPED_CHATS)
                    .map(([TimeRangeLabel, Data]) => {
                        // 计算 sortKey
                        let sortKey
                        if (TimeRangeLabel === "今天") {
                            sortKey = 0
                        } else if (TimeRangeLabel === "30天内") {
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
                console.error('获取数据失败:', error)
            }
        },
        /**
         * 获取时间范围标签
         * @param timestamp 时间戳
         */
        getTimeRangeLabel(timestamp: number): string {
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
                return "今天"
            }
            // 检查是否是30天内（不包括今天）
            const DIFF_DAYS = Math.floor((NOW - timestamp) / NOEDAYMS)
            if (DIFF_DAYS <= 30 && DIFF_DAYS > 0) {
                return "30天内"
            }
            // 否则返回年月格式 "YYYY-MM"
            const YEAR = DATE.getFullYear()
            const MONTH = String(DATE.getMonth() + 1).padStart(2, '0')
            return `${YEAR}-${MONTH}`
        }
    }
})
</script>

<template>
    <div class="SidebarExpandContainer" v-if="SidebarStatus === 1">
        <div class="SidebarTop">
            <div class="SidebarTopLogo"></div>
            <p>ElakeAI</p>
            <div class="SidebarNew">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-New"></use>
                </svg>
            </div>
            <div class="SidebarStow" @click="sidebarSwitch">
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
                    :key="titleIndex" :title="titleItem.title">
                    <p>{{ titleItem.title }}</p>
                    <div class="SidebarConversationListTitleMore">
                        <svg class="icon" aria-hidden="true">
                            <use xlink:href="#icon-More"></use>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
        <div class="SidebarPreset">
            <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-Preset"></use>
            </svg>
            <p>预设</p>
        </div>
        <div class="SidebarSetup">
            <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-Setup"></use>
            </svg>
            <p>设置</p>
        </div>
    </div>
    <div class="SidebarStowContainer" v-if="SidebarStatus === 0">
        <div class="SidebarTop">
            <div class="SidebarTopLogo"></div>
            <p>ElakeAI</p>
            <div class="SidebarNew">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-New"></use>
                </svg>
            </div>
            <div class="SidebarStow" @click="sidebarSwitch">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-Stow"></use>
                </svg>
            </div>
        </div>
        <div class="SidebarConversationList">
            对话框列表
        </div>
        <div class="SidebarPreset">
            <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-Preset"></use>
            </svg>
            <p>预设</p>
        </div>
        <div class="SidebarSetup">
            <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-Setup"></use>
            </svg>
            <p>设置</p>
        </div>
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

.SidebarExpandContainer {
    width: 256px;
    height: 100%;
    background-color: rgba(128, 206, 255, 30%);
    border-right: 1px solid rgba(0, 0, 0, 50%);
    display: grid;
    grid-template-rows: auto 1fr auto auto;
    user-select: none;
    transform: translateX(0%);
    transition: transform 0.3s ease;

    .SidebarTop {
        padding: 0 8px;
        border-bottom: 1px solid rgba(0, 0, 0, 50%);
        display: grid;
        grid-template-columns: 48px 1fr repeat(2, 32px);
        grid-template-rows: 64px;
        align-items: center;
        justify-items: center;

        p {
            margin: 0 20px;
            font-size: 18px;
            color: rgba(0, 0, 0, 60%);
        }

        .SidebarTopLogo {
            width: 48px;
            height: 48px;
            background-image: url("~@/assets/img/logo.png");
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center;
        }
    }

    .SidebarNew, .SidebarStow {
        cursor: pointer;
    }

    .SidebarConversationList {
        padding: 5px;
        white-space: nowrap;
        overflow: hidden auto;

        .SidebarConversationListTimeRangeLabel{
            p{
                padding: 10px 5px;
                color: rgba(0, 0, 0, 60%);
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
                    color: rgba(0, 0, 0, 100%);
                }

                .SidebarConversationListTitleMore {
                    display: none;
                }

                &:hover {
                    background-color: rgba(255, 255, 255, 50%);
                    transition: background-color 0.3s ease;

                    .SidebarConversationListTitleMore {
                        display: block;
                    }
                }
            }
        }
    }

    .SidebarPreset, .SidebarSetup {
        padding: 0 8px;
        border-top: 1px solid rgba(0, 0, 0, 50%);
        display: grid;
        grid-template-columns: 48px 1fr;
        grid-template-rows: 64px;
        gap: 8px;
        align-items: center;
        justify-items: center;
        cursor: pointer;
    }
}

.SidebarStowContainer {
    height: 100%;
    background-color: rgba(128, 206, 255, 30%);
    display: grid;
    border-right: 1px solid rgba(0, 0, 0, 50%);
    grid-template-rows: auto 1fr auto auto auto;
    user-select: none;
    transform: translateX(0%);
    transition: transform 0.3s ease;

    .SidebarTop {
        display: grid;
        grid-template-rows: 64px;
        align-items: center;
        justify-items: center;

        p {
            display: none;
        }

        .SidebarTopLogo {
            width: 48px;
            height: 48px;
            background-image: url("~@/assets/img/logo.png");
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center;
        }

        .SidebarNew, .SidebarStow {
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        }
    }

    .SidebarConversationList {
        display: none;
    }

    .SidebarPreset, .SidebarSetup {
        padding: 16px;
        gap: 8px;
        align-items: center;
        justify-items: center;
        cursor: pointer;

        p {
            display: none;
        }
    }
}
</style>