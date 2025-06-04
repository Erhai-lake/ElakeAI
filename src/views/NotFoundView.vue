<script>
import AIInput from "@/components/AIInput.vue"
import "@/assets/styles/markdown.less"

export default {
    name: "NotFoundView",
    components: {AIInput},
    methods: {
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
        }
    }
}
</script>

<template>
    <div class="NotFoundView">
        <!-- 顶部标题 -->
        <div class="TopTitle">页面消失大冒险</div>
        <!-- 消息列表 -->
        <div class="MessageList">
            <div class="Message user">
                <div class="MessageCard">
                    <div class="MessageContent">
                        <p>咦? 我要找的页面怎么不见了?</p>
                    </div>
                    <div class="MessageTime">{{ formatTimestamp(Date.now()) }}</div>
                </div>
            </div>
            <div class="Message assistant">
                <div class="MessageCard">
                    <div class="MessageContent">
                        <p>🔍 *侦探助手推了推眼镜*</p>
                        <p>让我看看...啊哈! 案情很清楚了!</p>
                        <p>这个页面可能:</p>
                        <ol>
                            <li>去度假了 🏖️</li>
                            <li>被外星人绑架了 👽</li>
                            <li>和你玩捉迷藏 🫣</li>
                            <li>迷路了 🗺️</li>
                        </ol>
                    </div>
                    <div class="MessageTime">{{ formatTimestamp(Date.now()) }}</div>
                </div>
            </div>
            <div class="Message user">
                <div class="MessageCard">
                    <div class="MessageContent">那现在怎么办? 我需要那个页面!</div>
                    <div class="MessageTime">{{ formatTimestamp(Date.now()) }}</div>
                </div>
            </div>
            <div class="Message assistant">
                <div class="MessageCard">
                    <div class="MessageContent">
                        <p>别担心! 我有几个建议:</p>
                        <ol>
                            <li>🧭 检查网址是否正确</li>
                            <li>🏠 返回<router-link to="/">首页</router-link>重新导航</li>
                            <li>⏳ 稍后再试, 也许页面正在休息</li>
                            <li>📞 联系网站管理员派搜救队</li>
                            <li>🍵 先喝杯茶冷静一下️</li>
                            <li>📽️ 看个
                                <a href="//www.bilibili.com/video/BV1UT42167xb" target="_blank">小短剧</a>
                                放松一下, 打发打发时间
                            </li>
                        </ol>
                    </div>
                    <div class="MessageTime">{{ formatTimestamp(Date.now()) }}</div>
                </div>
            </div>
            <div class="Message assistant">
                <div class="MessageCard">
                    <div class="MessageContent">
                        <p>PS: 如果你喜欢戏剧性, 可以想象这个页面正在:</p>
                        <p>🎭 参加百老汇演出</p>
                        <p>🚀 执行秘密太空任务</p>
                        <p>🏃 参加马拉松比赛</p>
                        <p>它很快就会回来的!</p>
                    </div>
                    <div class="MessageTime">{{ formatTimestamp(Date.now()) }}</div>
                </div>
            </div>
        </div>
        <div></div>
        <!-- 底部输入框 -->
        <div class="InputArea">
            <AIInput/>
        </div>
        <!-- AI提示信息 -->
        <div class="AIDisclaimer">*本小剧场纯属娱乐, 由DeepSeek生成, 页面可能只是被移动或删除了, 您可以在上面的输入框中, 重新问答!*</div>
    </div>
</template>

<style scoped lang="less">
.NotFoundView {
    position: relative;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-rows: auto 1fr auto auto;
    overflow: hidden;
}

.TopTitle {
    height: 65px;
    font-size: 18px;
    font-weight: bold;
    border-radius: 0 0 20px 20px;
    backdrop-filter: blur(10px);
    box-shadow: 0 6px 15px 0 var(--box-shadow-color);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
}

.MessageList {
    position: absolute;
    padding: 100px 50px 200px 50px;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
}

@media screen and (max-width: 768px) {
    .MessageList {
        padding: 100px 0 200px 0;
    }
}

.MessageCard {
    padding: 16px 20px;
    border-radius: 12px;
    position: relative;

    .user & {
        background-color: var(--chat-user-background-color);
        color: var(--chat-user-text-color);
        border-bottom-right-radius: 0;
    }

    .assistant & {
        background-color: var(--chat-assistant-background-color);
        color: var(--chat-assistant-text-color);
        border-bottom-left-radius: 0;
    }
}

.MessageContent {
    font-size: 16px;
    line-height: 1.5;
    word-wrap: break-word;
    overflow-wrap: break-word;
}

.MessageTime {
    margin-top: 8px;
    font-size: 12px;
    color: var(--chat-dialogue-time-text-color);
    text-align: right;
}

.InputArea {
    display: flex;
    align-items: center;
    justify-content: center;
}

.AIDisclaimer {
    padding: 10px 0;
    text-align: center;
    font-size: 12px;
    background-color: var(--background-color);
    color: var(--chat-disclaimer-text-color);
    user-select: none;
    z-index: 1;
}
</style>