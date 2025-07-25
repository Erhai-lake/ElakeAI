<script>
import FoldingPanel from "@/components/FoldingPanel.vue"
import ThemeSelect from "@/components/options/ThemeSwitch.vue"
import LanguageSelect from "@/components/options/LanguageSelect.vue"
import ChatAIKey from "@/components/options/ChatsAIKey.vue"
import DefaultChatSettings from "@/components/options/DefaultChatSettings.vue"
import Log from "@/components/options/Log.vue"
import Button from "@/components/Button.vue"
import EventBus from "@/services/EventBus"
import {toastRegistry} from "@/services/plugin/api/ToastClass"

export default {
    name: "DeBUGView",
    inject: ["$DB"],
    components: {Log, DefaultChatSettings, Button, ChatAIKey, LanguageSelect, ThemeSelect, FoldingPanel},
    data() {
        return {
            toastOptions: {
                message: "测试",
                type: "success",
                position: "top",
                duration: 3000,
                dismissible: true
            },
            chats: [],
            configs: []
        }
    },
    created() {
        this.configsLoading()
        this.chatsLoading()
    },
    methods: {
        // 获取Configs数据库数据
        async configsLoading() {
            try {
                this.configs = await this.$DB.configs.toArray()
            } catch (error) {
                console.error("[DeBUG View] Configs数据获取错误", error)
                toastRegistry.error("[DeBUG View] Configs数据获取错误")
            }
        },
        // 清空Configs数据库数据
        async configsClear() {
            if (!confirm("确定要清空Configs数据库吗?")) return
            try {
                await this.$DB.configs.clear()
                await this.configsLoading()
                toastRegistry.success("Configs数据库已清空")
            } catch (error) {
                console.error("[DeBUG View] Configs数据清空错误", error)
                toastRegistry.error("[DeBUG View] Configs数据清空错误")
            }
        },
        // 删除Configs数据
        async configsDelete(item) {
            if (!confirm("确定要删除Configs数据吗?")) return
            try {
                await this.$DB.configs.delete(item)
                this.configs = this.configs.filter(config => config.item !== item)
                toastRegistry.success("数据删除成功")
            } catch (error) {
                console.error("[DeBUG View] Configs数据删除错误", error)
                toastRegistry.error("[DeBUG View] Configs数据删除错误")
            }
        },
        // 生成DEBUG聊天
        async generateDebugChat() {
            const DEBUG_CHAT = [
                {
                    title: "各种标题测试",
                    content: "# 你好!\n\n## 你好!!\n\n### 你好!!!\n\n#### 你好!!!!\n\n##### 你好!!!!!\n\n###### 你好!!!!!!",
                    model: {"platform": "ChatGPT", "model": "gpt-4o"}
                },
                {
                    title: "文字属性测试",
                    content: "加粗: **加粗**\n\n斜体: *斜体*\n\n删除线: ~~删除线~~",
                    model: {"platform": "ChatGPT", "model": "gpt-4o"}
                },
                {
                    title: "段落测试",
                    content: "123\n456\n\n489\n123\n\n456\n\n489",
                    model: {"platform": "ChatGPT", "model": "gpt-4o"}
                },
                {
                    title: "引用测试",
                    content: "单行引用:\n\n> 单行引用\n\n多行引用:\n\n> 多行引用\n> 多行引用\n> 多行引用\n\n嵌套引用:\n\n> 嵌套引用\n> > 嵌套引用\n> > > 嵌套引用",
                    model: {"platform": "ChatGPT", "model": "gpt-4o"}
                },
                {
                    title: "列表测试",
                    content: "无序列表\n\n* 11111\n* 22222\n* 33333\n* 44444\n* 55555\n\n有序列表\n\n1. 11111\n2. 22222\n3. 33333\n4. 44444\n5. 55555\n\n嵌套列表\n\n* 11111\n    * 2222",
                    model: {"platform": "ChatGPT", "model": "gpt-4o"}
                },
                {
                    title: "代码行测试",
                    content: "右边的代码: `print(\"你好, 世界!\")` 这个是Python!",
                    model: {"platform": "ChatGPT", "model": "gpt-4o"}
                },
                {
                    title: "代码块测试",
                    content: "代码块测试\n\n```js\nfunction hello() {\n  console.log(\"Hello, world!\")\n}\n```\n\n这是一段JavaScript代码, lang属性写的是js",
                    model: {"platform": "ChatGPT", "model": "gpt-4o"}
                },
                {
                    title: "分割行测试",
                    content: "分割行测试\n\n***\n\n123456789",
                    model: {"platform": "ChatGPT", "model": "gpt-4o"}
                },
                {
                    title: "链接测试",
                    content: "[Markdown语法](https://markdown.com.cn \"最好的markdown教程\")\n\n<https://markdown.com.cn>",
                    model: {"platform": "ChatGPT", "model": "gpt-4o"}
                },
                {
                    title: "图片测试",
                    content: "![图片](https://flagcdn.com/cn.svg \"中国国旗\")\n\n![图片](https://img.loliapi.com/i/pc/img462.webp \"二次元\")",
                    model: {"platform": "ChatGPT", "model": "gpt-4o"}
                },
                {
                    title: "表格测试",
                    content: "| Syntax      | Description | Test Text     |\n| :---        |    :----:   |          ---: |\n| Header      | Title       | Here's this   |\n| Paragraph   | Text        | And more      |",
                    model: {"platform": "ChatGPT", "model": "gpt-4o"}
                },
                {
                    title: "任务列表测试",
                    content: "- [x] Write the press release\n- [ ] Update the website\n- [ ] Contact the media",
                    model: {"platform": "ChatGPT", "model": "gpt-4o"}
                },
                {
                    title: "Emoji测试",
                    content: "去露营了！ :tent: 很快回来。",
                    model: {"platform": "ChatGPT", "model": "gpt-4o"}
                },
                {
                    title: "数学公式测试",
                    content: "假设$x=2$, 那么$x^2=?$\n\n$$\n\\frac{\\mathrm{d}}{\\mathrm{d}x}\\cos x=-\\sin x\n$$\n\nKaTeX:\n\n$$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$\n\nMathJax3:\n\n$$ \\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$",
                    model: {"platform": "ChatGPT", "model": "gpt-4o"}
                },
                {
                    title: "流程图测试",
                    content: "Mermaid\n\n```mermaid\nflowchart TD;A[Christmas] -->|Get money| B(Go shopping);B --> C{Let me think};C -->|One| D[Laptop];C -->|Two| E[iPhone];C -->|Three| F[fa:fa-car Car];C --> D((This is the <br  />text<br  /> in the circle))\n```\n\n```mermaid\ngraph TD; A[开始] --> B{是否登录？}; B -- 是 --> C[进入系统]; B -- 否 --> D[跳转登录页]; D --> E[登录后返回]; E --> C\n```\n\nFlowchart\n\n```flow\nst=>start: 开始\ne=>end: 结束\nop=>operation: 输入用户名和密码\ncond=>condition: 验证成功？\nerr=>operation: 提示错误\nlogin=>operation: 跳转首页\n\nst->op->cond\ncond(yes)->login->e\ncond(no)->err->op\n```\n\n```flow\nst=>start: 开始\ne=>end: 结束\nop=>operation: 输入用户名和密码\ncond=>condition: 验证成功？\nerr=>operation: 提示错误\nlogin=>operation: 跳转首页\n\nst->op->cond\ncond(yes)->login->e\ncond(no)->err->op\n```\n\nPlantUML\n\n```plantuml\n@startuml\nskinparam backgroundColor #EEEBDC\n\nskinparam sequenceArrowColor DeepSkyBlue\nskinparam sequenceActorBorderColor DeepSkyBlueskinparam sequenceActorBorderColor DeepSkyBlue\nskinparam sequenceLifeLineBorderColor blue\nskinparam sequenceLifeLineBackgroundColor #A9DCDF\nskinparam sequenceParticipantBorderColor DeepSkyBlue\nskinparam sequenceParticipantBackgroundColor DodgerBlue\nskinparam sequenceParticipantFontName Impact\nskinparam sequenceParticipantFontSize 17\nskinparam sequenceParticipantFontColor #A9DCDF\nskinparam sequenceActorBackgroundColor aqua\nskinparam sequenceActorFontColor DeepSkyBlue\nskinparam sequenceActorFontSize 17\nskinparam sequenceActorFontName Aapex\n\nactor User\nparticipant \"First Class\" as ParticipantA\nparticipant \"Second Class\" as ParticipantB\nparticipant \"Last Class\" as ParticipantC\n\nUser -> ParticipantA: DoWork\nactivate ParticipantA\n\nParticipantA -> ParticipantB: Create Request\nactivate ParticipantBv\nParticipantB -> ParticipantC: DoWork\nactivate ParticipantC\nParticipantC --> ParticipantB: WorkDone\ndestroy ParticipantC\nParticipantB --> ParticipantA: Request Created\ndeactivate ParticipantB\n\nParticipantA --> User: Done\ndeactivate ParticipantA\n@enduml",
                    model: {"platform": "ChatGPT", "model": "gpt-4o"}
                }
            ]
            for (const chat of DEBUG_CHAT) {
                await this.$DB.chats.add({
                    key: crypto.randomUUID(),
                    title: chat.title,
                    timestamp: Date.now(),
                    data: [
                        {
                            id: crypto.randomUUID(),
                            message: {content: chat.title, role: "user"},
                            timestamp: Date.now()
                        },
                        {
                            id: crypto.randomUUID(),
                            model: chat.model,
                            message: {reasoning: chat.content, content: chat.content, role: "assistant"},
                            timestamp: Date.now()
                        }
                    ]
                })
            }
            EventBus.emit("[update] chatListUpdate")
            await this.chatsLoading()
            toastRegistry.success("生成完毕")
        },
        // 获取Chats数据库数据
        async chatsLoading() {
            try {
                this.chats = await this.$DB.chats.toArray()
            } catch (error) {
                console.error("[DeBUG View] Chats数据获取错误", error)
                toastRegistry.error("[DeBUG View] Chats数据获取错误")
            }
        },
        // 清空Chats数据库数据
        async chatsClear() {
            if (!confirm("确定要清空Chats数据库吗?")) return
            try {
                await this.$DB.chats.clear()
                await this.chatsLoading()
                EventBus.emit("[update] chatListUpdate")
                toastRegistry.success("Chats数据库已清空")
            } catch (error) {
                console.error("[DeBUG View] Chats数据清空错误", error)
                toastRegistry.error("[DeBUG View] Chats数据清空错误")
            }
        },
        // 删除Chats数据
        async chatsDelete(item) {
            if (!confirm("确定要删除Chats数据吗?")) return
            try {
                await this.$DB.chats.delete(item)
                this.chats = this.chats.filter(chat => chat.key !== item)
                EventBus.emit("[update] chatListUpdate")
                toastRegistry.success("数据删除成功")
            } catch (error) {
                console.error("[DeBUG View] Chats数据删除错误", error)
                toastRegistry.error("[DeBUG View] Chats数据删除错误")
            }
        },
        // 处理Title输入框
        async handleTitleBlur(item, event) {
            const NEW_VALUE = event.target.value.trim()
            if (NEW_VALUE === item.title) return
            try {
                await this.$DB.chats.update(item.key, {title: NEW_VALUE})
                item.title = NEW_VALUE
                EventBus.emit("[update] chatListUpdate")
                toastRegistry.success("标题更新成功")
            } catch (error) {
                console.error("[DeBUG View] 标题更新错误", error)
                toastRegistry.error("[DeBUG View] 标题更新错误")
                event.target.value = item.title
            }
        },
        // 处理Data输入框
        async handleDataBlur(item, event) {
            const RAW_VALUE = event.target.value.trim()
            if (RAW_VALUE === JSON.stringify(item, null)) return
            try {
                const parsedData = JSON.parse(RAW_VALUE)
                await this.$DB.chats.update(item.key, parsedData)
                item.data = JSON.parse(JSON.stringify(parsedData))
                EventBus.emit("[update] chatListUpdate")
                toastRegistry.success("数据更新成功")
            } catch (error) {
                console.error("[DeBUG View] 数据更新错误", error)
                toastRegistry.error("[DeBUG View] JSON格式错误")
                event.target.value = JSON.stringify(item.data, null)
            }
        },
        // 处理设置Data输入框
        async handleConfigDataBlur(item, event) {
            const RAW_VALUE = event.target.value.trim()
            if (RAW_VALUE === JSON.stringify(item.value, null)) return
            try {
                const parsedData = JSON.parse(RAW_VALUE)
                await this.$DB.configs.update(item.item, parsedData)
                item.value = JSON.parse(JSON.stringify(parsedData))
                toastRegistry.success("数据更新成功")
            } catch (error) {
                console.error("[DeBUG View] 数据更新错误", error)
                toastRegistry.error("[DeBUG View] JSON格式错误")
                event.target.value = JSON.stringify(item.data, null)
            }
        }
    }
}
</script>

<template>
    <div class="DeBUGContainer">
        <FoldingPanel>
            <template #Title>Chats数据库</template>
            <template #Content>
                <div>
                    <Button @click="generateDebugChat">生成DEBUG聊天</Button>
                    <Button @click="chatsLoading">加载</Button>
                    <Button @click="chatsClear">清空</Button>
                </div>
                <table>
                    <thead>
                    <tr>
                        <th>key</th>
                        <th>title</th>
                        <th>data</th>
                        <th>Operation</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="(item, index) in chats" :key="index">
                        <td>{{ item.key }}</td>
                        <td>
                            <input
                                type="text"
                                style="width: 100%;"
                                :value="item.title"
                                @blur="handleTitleBlur(item, $event)">
                        </td>
                        <td>
                            <input
                                type="text"
                                style="width: 100%;"
                                :value="JSON.stringify(item, null)"
                                @blur="handleDataBlur(item, $event)">
                        </td>
                        <td>
                            <Button @click="chatsDelete(item.key)">删除</Button>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </template>
        </FoldingPanel>
        <FoldingPanel>
            <template #Title>Configs数据库</template>
            <template #Content>
                <div>
                    <Button @click="configsLoading">加载</Button>
                    <Button @click="configsClear">清空</Button>
                </div>
                <table>
                    <thead>
                    <tr>
                        <th>item</th>
                        <th>Value</th>
                        <th>Operation</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="(item, index) in configs" :key="index">
                        <td>{{ item.item }}</td>
                        <td class="Value" v-if="item.item === 'Theme'">
                            <ThemeSelect/>
                        </td>
                        <td class="Value" v-else-if="item.item === 'Language'">
                            <LanguageSelect/>
                        </td>
                        <td class="Value" v-else-if="item.item === 'DefaultChatSettings'">
                            <DefaultChatSettings/>
                        </td>
                        <td class="Value" v-else>
                            <input
                                type="text"
                                :name="item.item"
                                :value="JSON.stringify(item.value, null)"
                                @blur="handleConfigDataBlur(item, $event)">
                        </td>
                        <td>
                            <Button @click="configsDelete(item.item)">删除</Button>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </template>
        </FoldingPanel>
        <ChatAIKey/>
        <FoldingPanel :Height="600">
            <template #Title>Log</template>
            <template #Content>
                <Log/>
            </template>
        </FoldingPanel>
    </div>
</template>

<style scoped lang="less">
.DeBUGContainer {
    padding: 20px;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    text-align: center;

    th, td {
        border: 1px solid var(--border-color);
    }

    .Value {
        padding: 10px;
        display: flex;
        align-items: center;
        justify-content: center;

        input {
            text-align: center;
        }
    }
}

textarea {
    width: 100%;
    height: 150px;
    border: none;
    resize: none;
}
</style>