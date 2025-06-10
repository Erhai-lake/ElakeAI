<script>
import FoldingPanel from "@/components/FoldingPanel.vue"
import ThemeSelect from "@/components/ThemeSwitch.vue"
import LanguageSelect from "@/components/LanguageSelect.vue"
import ChatAIKey from "@/components/ChatsAIKey.vue"
import Button from "@/components/Button.vue"
import EventBus from "@/services/EventBus"

export default {
    name: "DeBUGView",
    inject: ["$DB"],
    components: {Button, ChatAIKey, LanguageSelect, ThemeSelect, FoldingPanel},
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
        // Configs特殊处理
        Special(item) {
            switch (item) {
                case "Theme":
                    return false
                case "Language":
                    return false
                default:
                    return true
            }
        },
        // 获取Configs数据库数据
        async configsLoading() {
            try {
                this.configs = await this.$DB.Configs.toArray()
            } catch (error) {
                console.error("[DeBUG View] Configs数据获取错误", error)
                this.$toast.error("[DeBUG View] Configs数据获取错误")
            }
        },
        // 清空Configs数据库数据
        async configsClear() {
            if (!confirm("确定要清空Configs数据库吗?")) return
            try {
                await this.$DB.Configs.clear()
                await this.configsLoading()
                this.$toast.success("Configs数据库已清空")
            } catch (error) {
                console.error("[DeBUG View] Configs数据清空错误", error)
                this.$toast.error("[DeBUG View] Configs数据清空错误")
            }
        },
        // 删除Configs数据
        async configsDelete(item) {
            if (!confirm("确定要删除Configs数据吗?")) return
            try {
                await this.$DB.Configs.delete(item)
                this.configs = this.configs.filter(config => config.item !== item)
                this.$toast.success("数据删除成功")
            } catch (error) {
                console.error("[DeBUG View] Configs数据删除错误", error)
                this.$toast.error("[DeBUG View] Configs数据删除错误")
            }
        },
        // 生成DEBUG聊天
        async generateDebugChat() {
            const NEW_CHAY_KEY = crypto.randomUUID()
            const NEW_DATA = [{"id":"dbd95b4d-2f5c-4582-8ce8-6c1e923c7556","message":{"content":"1. 各种标题测试","role":"user"},"timestamp":1749554311703},{"id":"d76532b6-9294-40eb-b821-2a1cafba753d","model":{"largeModel":"ChatGPT","model":"gpt-4o"},"message":{"reasoning":"","content":"# 你好!\n\n## 你好!!\n\n### 你好!!!\n\n#### 你好!!!!\n\n##### 你好!!!!!\n\n###### 你好!!!!!!","role":"assistant"},"timestamp":1749554311703},{"id":"45b61ea8-2503-4883-8b24-6955c5d73eab","message":{"content":"2. 文字属性测试","role":"user"},"timestamp":1749554311703},{"id":"97979356-f1dc-4013-b945-f78ac41bcca8","model":{"largeModel":"ChatGPT","model":"gpt-4o"},"message":{"reasoning":"","content":"加粗: **加粗**\n\n斜体: *斜体*\n\n删除线: ~~删除线~~","role":"assistant"},"timestamp":1749554311703},{"id":"9dc01240-a0a5-45ce-a950-b0e00953e560","message":{"content":"3. 段落测试","role":"user"},"timestamp":1749554311703},{"id":"8f60a264-27ac-4b5f-90ee-bbe67722a59a","model":{"largeModel":"ChatGPT","model":"gpt-4o"},"message":{"reasoning":"","content":"123\n456\n\n489\n123\n\n456\n\n489","role":"assistant"},"timestamp":1749554311703},{"id":"9202cdad-76eb-4ec2-9111-a627cc36f63e","message":{"content":"4. 引用测试","role":"user"},"timestamp":1749554311703},{"id":"2756e9cb-3d21-4972-b5cb-860be74033eb","model":{"largeModel":"ChatGPT","model":"gpt-4o"},"message":{"reasoning":"","content":"单行引用:\n\n> 单行引用\n\n多行引用:\n\n> 多行引用\n> 多行引用\n> 多行引用\n\n嵌套引用:\n\n> 嵌套引用\n> > 嵌套引用\n> > > 嵌套引用","role":"assistant"},"timestamp":1749554311703},{"id":"b1dcfdcc-0356-4d7d-858d-e962a5c1fc2b","message":{"content":"5. 列表测试","role":"user"},"timestamp":1749554311703},{"id":"2911ea43-39a4-45fa-805f-5bc9b256a6cf","model":{"largeModel":"ChatGPT","model":"gpt-4o"},"message":{"reasoning":"","content":"无序列表\n\n* 11111\n* 22222\n* 33333\n* 44444\n* 55555\n\n有序列表\n\n1. 11111\n2. 22222\n3. 33333\n4. 44444\n5. 55555\n\n嵌套列表\n\n* 11111\n    * 2222","role":"assistant"},"timestamp":1749554311703},{"id":"909c098b-c167-4923-a0cd-426ca22115cf","message":{"content":"6. 代码行测试","role":"user"},"timestamp":1749554311703},{"id":"4caeb190-6bea-4faa-ac52-5a610cb150da","model":{"largeModel":"ChatGPT","model":"gpt-4o"},"message":{"reasoning":"","content":"`print(\"你好, 世界!\")`","role":"assistant"},"timestamp":1749554311703},{"id":"b82ee101-9d6e-4c0b-9f1b-b3bee10d3e92","message":{"content":"7. 代码块测试","role":"user"},"timestamp":1749554311703},{"id":"9055c5bc-3128-4938-b8de-c00c03903365","model":{"largeModel":"ChatGPT","model":"gpt-4o"},"message":{"reasoning":"","content":"```js\nfunction hello() {\n  console.log(\"Hello, world!\")\n}\n```\n\n这是一段JavaScript代码, lang属性写的是js","role":"assistant"},"timestamp":1749554311703},{"id":"c9d9d624-16f7-48e9-a75b-90df44044119","message":{"content":"8. 分割行测试","role":"user"},"timestamp":1749554311703},{"id":"d4b56822-5541-4832-9fef-b0a220fee885","model":{"largeModel":"ChatGPT","model":"gpt-4o"},"message":{"reasoning":"","content":"***","role":"assistant"},"timestamp":1749554311703},{"id":"afe43595-39f2-4ccd-be53-b7998aee3f62","message":{"content":"9. 链接测试","role":"user"},"timestamp":1749554311703},{"id":"3b669a66-4b79-48e3-8afc-1aa0b743b78e","model":{"largeModel":"ChatGPT","model":"gpt-4o"},"message":{"reasoning":"","content":"[Markdown语法](https://markdown.com.cn \"最好的markdown教程\")\n\n<https://markdown.com.cn>","role":"assistant"},"timestamp":1749554311703},{"id":"17436db5-7709-4223-86a1-a0350030a82e","message":{"content":"10. 图片测试","role":"user"},"timestamp":1749554311703},{"id":"4303af76-339a-403f-9944-fb569b613e81","model":{"largeModel":"ChatGPT","model":"gpt-4o"},"message":{"reasoning":"","content":"![图片](https://flagcdn.com/cn.svg \"中国国旗\")","role":"assistant"},"timestamp":1749554311703},{"id":"0f3e377a-60ab-4531-9f06-6970ebae4829","message":{"content":"11. 表格测试","role":"user"},"timestamp":1749554311703},{"id":"e5bbad0c-cbc0-4964-88b8-3d1b6f2337e9","model":{"largeModel":"ChatGPT","model":"gpt-4o"},"message":{"reasoning":"","content":"| Syntax      | Description | Test Text     |\n| :---        |    :----:   |          ---: |\n| Header      | Title       | Here's this   |\n| Paragraph   | Text        | And more      |","role":"assistant"},"timestamp":1749554311703},{"id":"166cd145-b911-46f7-86ea-089e607b55c3","message":{"content":"12. 任务列表测试","role":"user"},"timestamp":1749554311703},{"id":"1e24b8c6-b143-489c-acc8-997924ca034d","model":{"largeModel":"ChatGPT","model":"gpt-4o"},"message":{"reasoning":"","content":"- [x] Write the press release\n- [ ] Update the website\n- [ ] Contact the media","role":"assistant"},"timestamp":1749554311703},{"id":"27a2680b-d322-43df-81c7-6ff151fe3b92","message":{"content":"13. Emoji测试","role":"user"},"timestamp":1749554311703},{"id":"8b2eb798-2c4f-48f3-b340-1b093580241d","model":{"largeModel":"ChatGPT","model":"gpt-4o"},"message":{"reasoning":"","content":"去露营了！ :tent: 很快回来。","role":"assistant"},"timestamp":1749554311703},{"id":"3e9e56cd-959e-44e1-874a-89694a3deacb","message":{"content":"14. 数学公式测试","role":"user"},"timestamp":1749554311703},{"id":"455c5568-d7a8-4c3c-bd65-cd51ea239052","model":{"largeModel":"ChatGPT","model":"gpt-4o"},"message":{"reasoning":"","content":"假设$x=2$, 那么$x^2=?$\n\n$$\n\\frac{\\mathrm{d}}{\\mathrm{d}x}\\cos x=-\\sin x\n$$","role":"assistant"},"timestamp":1749554311703},{"id":"769ee97a-0d92-40be-8195-f1939fb3f153","message":{"content":"15. 流程图测试","role":"user"},"timestamp":1749554311703},{"id":"c242580a-1dbe-449c-a4da-3d5afa539f51","model":{"largeModel":"ChatGPT","model":"gpt-4o"},"message":{"reasoning":"","content":"```mermaid\nflowchart TD\n    A[Christmas] -->|Get money| B(Go shopping)\n    B --> C{Let me think}\n    C -->|One| D[Laptop]\n    C -->|Two| E[iPhone]\n    C -->|Three| F[fa:fa-car Car]\n    C --> D((This is the <br  />text<br  /> in the circle))\n```","role":"assistant"},"timestamp":1749554311703}]
            await this.$DB.Chats.add({
                key: NEW_CHAY_KEY,
                title: "DEBUG聊天",
                timestamp: Date.now(),
                data: NEW_DATA
            })
            EventBus.emit("[function] chatListGet")
            await this.chatsLoading()
            this.$toast.success("生成完毕")
        },
        // 获取Chats数据库数据
        async chatsLoading() {
            try {
                this.chats = await this.$DB.Chats.toArray()
            } catch (error) {
                console.error("[DeBUG View] Chats数据获取错误", error)
                this.$toast.error("[DeBUG View] Chats数据获取错误")
            }
        },
        // 清空Chats数据库数据
        async chatsClear() {
            if (!confirm("确定要清空Chats数据库吗?")) return
            try {
                await this.$DB.Chats.clear()
                await this.chatsLoading()
                EventBus.emit("[function] chatListGet")
                this.$toast.success("Chats数据库已清空")
            } catch (error) {
                console.error("[DeBUG View] Chats数据清空错误", error)
                this.$toast.error("[DeBUG View] Chats数据清空错误")
            }
        },
        // 删除Chats数据
        async chatsDelete(item) {
            if (!confirm("确定要删除Chats数据吗?")) return
            try {
                await this.$DB.Chats.delete(item)
                this.chats = this.chats.filter(chat => chat.key!== item)
                EventBus.emit("[function] chatListGet")
                this.$toast.success("数据删除成功")
            } catch (error) {
                console.error("[DeBUG View] Chats数据删除错误", error)
                this.$toast.error("[DeBUG View] Chats数据删除错误")
            }
        },
        // 处理Title输入框
        async handleTitleBlur(item, event) {
            const NEW_VALUE = event.target.value.trim()
            if (NEW_VALUE === item.title) return
            try {
                await this.$DB.Chats.update(item.key, {title: NEW_VALUE})
                item.title = NEW_VALUE
                EventBus.emit("[function] chatListGet")
                this.$toast.success("标题更新成功")
            } catch (error) {
                console.error("[DeBUG View] 标题更新错误", error)
                this.$toast.error("[DeBUG View] 标题更新错误")
                event.target.value = item.title
            }
        },
        // 处理Data输入框
        async handleDataBlur(item, event) {
            const RAW_VALUE = event.target.value.trim()
            if (RAW_VALUE === JSON.stringify(item, null)) return
            try {
                const parsedData = JSON.parse(RAW_VALUE)
                await this.$DB.Chats.update(item.key, parsedData)
                item.data = JSON.parse(JSON.stringify(parsedData))
                EventBus.emit("[function] chatListGet")
                this.$toast.success("数据更新成功")
            } catch (error) {
                console.error("[DeBUG View] 数据更新错误", error)
                this.$toast.error("[DeBUG View] JSON格式错误")
                event.target.value = JSON.stringify(item.data, null)
            }
        },
        // toast测试
        toastTest(id) {
            if (id === 1) {
                this.$toast.clear()
            } else {
                this.$toast.open(this.toastOptions)
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
                        <td class="Value" v-if="Special(item.item)">
                            <input type="text" :name="item.item" :value="item.value">
                        </td>
                        <td class="Value" v-if="item.item === 'Theme'">
                            <ThemeSelect/>
                        </td>
                        <td class="Value" v-if="item.item === 'Language'">
                            <LanguageSelect/>
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
        <FoldingPanel Height="500">
            <template #Title>Toast</template>
            <template #Content>
                <div>
                    <label for="message">
                        提示信息
                        <input type="text" v-model="toastOptions.message" id="message" style="margin: 20px 0">
                    </label>
                    <br>
                    <label for="type">
                        提示类型
                        <select v-model="toastOptions.type" id="type">
                            <option value="success">成功</option>
                            <option value="error">错误</option>
                            <option value="info">信息</option>
                            <option value="warning">警告</option>
                        </select>
                    </label>
                    <br>
                    <br>
                    <label for="position">
                        提示位置
                        <select v-model="toastOptions.position">
                            <option value="top">顶部居中</option>
                            <option value="top-left">顶部左</option>
                            <option value="top-right">顶部右</option>
                            <option value="bottom">底部居中</option>
                            <option value="bottom-left">底部左</option>
                            <option value="bottom-right">底部右</option>
                        </select>
                    </label>
                    <br>
                    <label for="duration">
                        提示时间
                        <input type="number" v-model="toastOptions.duration" id="duration" style="margin: 20px 0">
                    </label>
                    <br>
                    <label for="dismissible">
                        鼠标点击是否可以关闭
                        <input type="checkbox" v-model="toastOptions.dismissible" id="dismissible"
                               style="margin: 20px 0">
                    </label>
                </div>
                <textarea v-text="toastOptions"/>
                <div>
                    <Button @click="toastTest(1)">清空</Button>
                    <Button @click="toastTest">提示</Button>
                </div>
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