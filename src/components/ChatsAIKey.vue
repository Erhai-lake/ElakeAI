<script>
import FoldingPanel from "@/components/FoldingPanel.vue"
import Balance from "@/services/api/Balance"

export default {
    name: "ChatAIKey",
    components: {FoldingPanel},
    inject: ["$DB"],
    data() {
        return {
            status: {
                // 下拉列表状态
                modelStatus: false,
                // 新增表单状态
                addFormStatus: false,
                // 编辑表单状态
                editFormStatus: false
            },
            // 模型列表
            modelList: [
                {
                    name: "DeepSeek",
                    logo: "https://chat.deepseek.com/favicon.svg",
                    url: "https://api.deepseek.com"
                },
                {
                    name: "ChatGPT",
                    logo: "https://cdn.oaistatic.com/assets/favicon-miwirzcw.ico",
                    url: "https://api.openai.com"
                }
            ],
            // 选中的模型
            selectedModel: {
                name: "DeepSeek",
                logo: "https://chat.deepseek.com/favicon.svg",
                url: "https://api.deepseek.com"
            },
            // Key池
            keyPools: [],
            // 操作选择
            operationSelection: [],
            // 新增表单数据
            newKey: {
                value: "",
                remark: "",
                url: "",
                enabled: true
            },
            // 编辑表单数据
            editKey: {
                key: "",
                value: "",
                remark: "",
                url: ""
            }
        }
    },
    watch: {
        // 监听模型变化
        selectedModel(newVal) {
            this.selectModel(newVal)
        }
    },
    created() {
        // 初始化Key池
        this.loadKeyPools()
    },
    computed: {
        // 是否全选
        isAllSelected() {
            return this.keyPools.length > 0 &&
                this.keyPools.every(item =>
                    this.operationSelection.includes(item.key)
                )
        }
    },
    methods: {
        // 点击外部关闭下拉列表
        handleClickOutside(e) {
            if (!this.$el.contains(e.target)) {
                this.status.modelStatus = false
            }
        },
        // 选择模型
        selectModel(selectModel) {
            if (!selectModel) return
            if (selectModel === this.selectedModel.name) return
            this.selectedModel = selectModel
            this.operationSelection = []
            this.status.modelStatus = false
            this.loadKeyPools()
        },
        // 加载Key池
        async loadKeyPools() {
            try {
                this.keyPools = await this.$DB.APIKeys.where("model").equals(this.selectedModel.name).toArray()
                for (const item of this.keyPools) {
                    if (!item.enabled) {
                        item.balance = "0"
                        continue
                    }
                    const BALANCE = await this.getKeyBalance(item.key)
                    item.balance = BALANCE
                    if (!BALANCE) {
                        item.enabled = false
                        item.balance = "0"
                    }
                }
            } catch (error) {
                console.error("[Chats AI Key] 加载Key池错误", error)
                this.$toast.error("[Chats AI Key] 加载Key池错误")
            }
        },
        // 获取Key余额
        async getKeyBalance(key) {
            try {
                const KEY_DATA = await this.$DB.APIKeys.get(key)
                const BALANCE = await Balance.getBalance(KEY_DATA.model ,KEY_DATA.value, KEY_DATA.url)
                if (!BALANCE) {
                    this.$toast.warning(this.$t("components.ChatAIKey.toast.errorKeyDisabled", {key: key}))
                    await this.$DB.APIKeys.update(KEY_DATA.key, {enabled: false})
                    return false
                }
                return BALANCE.balance
            } catch (error) {
                console.error("[Chats AI Key] 获取Key余额错误", error)
                this.$toast.error("[Chats AI Key] 获取Key余额错误")
            }
        },
        // 添加新Key
        async addNewKey() {
            // 禁止key空
            if (!this.newKey.value) {
                this.$toast.warning(this.$t("components.ChatAIKey.toast.keyNull"))
                return
            }
            // url空则使用默认url
            if (!this.newKey.url) {
                this.newKey.url = this.selectedModel.url
            }
            // 校验url
            if (!this.isValidUrl(this.newKey.url)) {
                this.$toast.warning(this.$t("components.ChatAIKey.toast.invalidUrl"))
                return
            }
            // 删除Url末尾的/
            if (this.newKey.url.endsWith("/")) {
                this.newKey.url = this.newKey.url.slice(0, -1)
            }
            try {
                // 写入数据库
                await this.$DB.APIKeys.add({
                    key: crypto.randomUUID(),
                    model: this.selectedModel.name,
                    value: this.newKey.value,
                    remark: this.newKey.remark || "",
                    url: this.newKey.url,
                    enabled: this.newKey.enabled
                })
                // 写入Key池
                this.keyPools.push({...this.newKey})
                // 重置表单
                this.newKey = {key: "", value: "", remark: "", url: "", enabled: true}
                this.status.addFormStatus = false
                this.$toast.success(this.$t("components.ChatAIKey.toast.addKeySuccess"))
            } catch (error) {
                console.error("[Chats AI Key] 添加Key错误", error)
                this.$toast.error("[Chats AI Key] 添加Key错误")
            }
        },
        // Key脱敏显示
        maskKey(key) {
            if (!key) return ""
            if (key.length < 8) return key
            return key.slice(0, 4) + '****' + key.slice(-4)
        },
        // 删除Key(批量)
        async removeSelectedKeys() {
            // 禁止空删除
            if (!this.operationSelection || this.operationSelection.length === 0) {
                this.$toast.warning(this.$t("components.ChatAIKey.toast.selectKeysOperate"))
                return
            }
            try {
                await this.$DB.APIKeys.bulkDelete(this.operationSelection)
                // 删除Key池
                this.keyPools = this.keyPools.filter(item =>
                    !this.operationSelection.includes(item.key)
                )
                this.operationSelection = []
                this.$toast.success(this.$t("components.ChatAIKey.toast.removeKeySuccess"))
            } catch (error) {
                console.error("[Chats AI Key] 删除Keys错误", error)
                this.$toast.error("[Chats AI Key] 删除Keys错误")
            }
        },
        // 编辑Key
        async toggleEditSelected() {
            // 禁止空编辑
            if (!this.operationSelection || this.operationSelection.length === 0) {
                this.$toast.warning(this.$t("components.ChatAIKey.toast.selectKeysOperate"))
                return
            }
            // 禁止多选编辑
            if (this.operationSelection.length > 1) {
                this.$toast.warning(this.$t("components.ChatAIKey.toast.selectAKey"))
                return
            }
            try {
                // 加载编辑数据
                const KEY_DATA = await this.$DB.APIKeys.get(this.operationSelection[0])
                this.editKey = {
                    key: KEY_DATA.key,
                    value: KEY_DATA.value,
                    remark: KEY_DATA.remark || "",
                    url: KEY_DATA.url
                }
                this.status.editFormStatus = !this.status.editFormStatus
            } catch (error) {
                console.error("[Chats AI Key] 获取Keys错误", error)
                this.$toast.error("[Chats AI Key] 获取Keys错误")
            }
        },
        // 编辑Key(写数据库)
        async editSelectedKeys() {
            // 禁止空编辑
            if (!this.editKey.value) {
                this.$toast.warning(this.$t("components.ChatAIKey.toast.keyNull"))
                return
            }
            // url空则使用默认url
            if (!this.editKey.url) {
                this.editKey.url = this.selectedModel.url
            }
            // 校验url
            if (!this.isValidUrl(this.editKey.url)) {
                this.$toast.warning(this.$t("components.ChatAIKey.toast.invalidUrl"))
                return
            }
            // 删除Url末尾的/
            if (this.newKey.url.endsWith("/")) {
                this.newKey.url = this.newKey.url.slice(0, -1)
            }
            try {
                // 写入数据库
                await this.$DB.APIKeys.update(this.editKey.key, {
                    value: this.editKey.value,
                    remark: this.editKey.remark,
                    url: this.editKey.url
                })
                // 更新Key池
                this.keyPools = this.keyPools.map(item => {
                    if (item.key === this.editKey.key) {
                        return {...item, ...this.editKey}
                    }
                    return item
                })
                // 重置表单
                this.editKey = {
                    key: "",
                    value: "",
                    remark: "",
                    url: "",
                    enabled: true
                }
                this.status.editFormStatus = false
                this.$toast.success(this.$t("components.ChatAIKey.toast.editKeySuccess"))
            } catch (error) {
                console.error("[Chats AI Key] 编辑Keys错误", error)
                this.$toast.error("[Chats AI Key] 编辑Keys错误")
            }
        },
        // url是否是有效的url
        isValidUrl(url) {
            try {
                new URL(url)
                return true
            } catch (error) {
                return false
            }
        },
        // 切换Key启用状态(单个)
        async toggleKeyEnable(keyItem) {
            try {
                const NEW_STATUS = !keyItem.enabled
                await this.$DB.APIKeys.update(keyItem.key, {enabled: NEW_STATUS})
                keyItem.enabled = NEW_STATUS
                if (keyItem.enabled) {
                    const BALANCE = await this.getKeyBalance(keyItem.key)
                    keyItem.balance = BALANCE
                    if (!BALANCE) {
                        keyItem.enabled = false
                        keyItem.balance = "0"
                    }
                } else {
                    keyItem.balance = "0"
                }
                this.$toast.success(this.$t(`components.ChatAIKey.toast.${NEW_STATUS ? 'enable' : 'disable'}Success`))
            } catch (error) {
                console.error("[Chats AI Key] 状态更新失败", error)
                this.$toast.error("[Chats AI Key] 状态更新失败")
            }
        },
        // 切换Key启用状态(批量)
        async batchToggleEnable(status) {
            if (!this.operationSelection || this.operationSelection.length === 0) {
                this.$toast.warning(this.$t("components.ChatAIKey.toast.selectKeysOperate"))
                return
            }
            try {
                const UPDATES = this.operationSelection.map(key => ({
                    key: key,
                    changes: {enabled: status}
                }))
                await this.$DB.APIKeys.bulkUpdate(UPDATES)
                // 本地更新选中项状态
                const UPDATED_POOLS = []
                for (const item of this.keyPools) {
                    if (this.operationSelection.includes(item.key)) {
                        const updatedItem = {...item, enabled: status}
                        if (status) {
                            const BALANCE = await this.getKeyBalance(item.key)
                            updatedItem.balance = BALANCE
                            if (!BALANCE) {
                                updatedItem.enabled = false
                                updatedItem.balance = "0"
                                await this.$DB.APIKeys.update(item.key, {enabled: false})
                            }
                        } else {
                            updatedItem.balance = "0"
                        }
                        UPDATED_POOLS.push(updatedItem)
                    } else {
                        UPDATED_POOLS.push(item)
                    }
                }
                this.keyPools = UPDATED_POOLS
                this.$toast.success(this.$t(`components.ChatAIKey.toast.batch${status ? 'Enable' : 'Disable'}Success`))
            } catch (error) {
                console.error("[Chats AI Key] 状态更新失败", error)
                this.$toast.error("[Chats AI Key] 状态更新失败")
            }
        },
        // 全选/取消全选
        toggleAllSelection() {
            if (this.isAllSelected) {
                this.operationSelection = []
            } else {
                this.operationSelection = this.keyPools.map(item => item.key)
            }
        },
        // 切换行选择状态
        toggleRowSelection(key) {
            const INDEX = this.operationSelection.indexOf(key)
            if (INDEX === -1) {
                this.operationSelection.push(key)
            } else {
                this.operationSelection.splice(INDEX, 1)
            }
        }
    },
    mounted() {
        document.addEventListener("click", this.handleClickOutside)
    },
    beforeDestroy() {
        document.removeEventListener("click", this.handleClickOutside)
    }
}
</script>

<template>
    <FoldingPanel Height="500">
        <template #Title>
            {{ $t("components.ChatAIKey.title") }}
        </template>
        <template #Content>
            <div class="ChatAIKey">
                <div class="Top">
                    <!-- 模型选择 -->
                    <div class="ModelSelector">
                        <div class="SelectedModel" :class="{ 'Open': status.modelStatus }"
                             @click="status.modelStatus = !status.modelStatus">
                            <img class="Logo" :src="this.selectedModel.logo" :alt="this.selectedModel.name">
                            <span class="ModelOption">{{ this.selectedModel.name }}</span>
                        </div>
                        <transition name="slide">
                            <ul v-show="status.modelStatus" class="ModelList">
                                <li
                                    v-for="model in modelList"
                                    :key="model.name"
                                    @click="this.selectedModel = model"
                                    :class="{ 'Active': model.name === this.selectedModel.name }">
                                    <img :src="model.logo" class="Logo" :alt="model.name">
                                    <span class="ModelOption">{{ model.name }}</span>
                                </li>
                            </ul>
                        </transition>
                    </div>
                    <!-- 新增按钮 -->
                    <button @click="status.addFormStatus = !status.addFormStatus">{{
                            $t("components.ChatAIKey.operationButton.add")
                        }}
                    </button>
                    <!-- 编辑选中 -->
                    <button @click="toggleEditSelected">
                        {{ $t("components.ChatAIKey.operationButton.edit") }}
                    </button>
                    <!-- 移除选中 -->
                    <button @click="removeSelectedKeys">
                        {{ $t("components.ChatAIKey.operationButton.remove", operationSelection.length) }}
                    </button>
                    <!-- 启用选中 -->
                    <button @click="batchToggleEnable(true)">
                        {{ $t("components.ChatAIKey.operationButton.enable", operationSelection.length) }}
                    </button>
                    <!-- 禁用选中 -->
                    <button @click="batchToggleEnable(false)">
                        {{ $t("components.ChatAIKey.operationButton.disable", operationSelection.length) }}
                    </button>
                    <div/>
                </div>
                <!-- 新增表单 -->
                <div v-if="status.addFormStatus" class="AddForm">
                    <h3>{{ $t("components.ChatAIKey.operationButton.add") }}</h3>
                    <div class="FormGroup">
                        <label>{{ $t("components.ChatAIKey.form.key") }}</label>
                        <input type="text" v-model="newKey.value"
                               :placeholder="$t('components.ChatAIKey.form.pleaseEnterKey')">
                    </div>
                    <div class="FormGroup">
                        <label>{{ $t("components.ChatAIKey.form.remarks") }}</label>
                        <input type="text" v-model="newKey.remark"
                               :placeholder="$t('components.ChatAIKey.form.pleaseEnterKeyRemarks')">
                    </div>
                    <div class="FormGroup">
                        <label>{{ $t("components.ChatAIKey.form.url") }}</label>
                        <input type="text" v-model="newKey.url"
                               :placeholder="$t('components.ChatAIKey.form.pleaseEnterKeyUrl')">
                    </div>
                    <div class="FormActions">
                        <button @click="addNewKey">{{ $t("components.ChatAIKey.form.save") }}</button>
                        <button @click="status.addFormStatus = false">{{
                                $t("components.ChatAIKey.form.cancel")
                            }}
                        </button>
                    </div>
                </div>
                <!-- 编辑表单 -->
                <div v-if="status.editFormStatus" class="AddForm">
                    <h3>{{ $t("components.ChatAIKey.operationButton.edit") }}</h3>
                    <div class="FormGroup">
                        <label>{{ $t("components.ChatAIKey.form.key") }}</label>
                        <input type="text" v-model="editKey.value"
                               :placeholder="$t('components.ChatAIKey.form.pleaseEnterKey')">
                    </div>
                    <div class="FormGroup">
                        <label>{{ $t("components.ChatAIKey.form.remarks") }}</label>
                        <input type="text" v-model="editKey.remark"
                               :placeholder="$t('components.ChatAIKey.form.pleaseEnterKeyRemarks')">
                    </div>
                    <div class="FormGroup">
                        <label>{{ $t("components.ChatAIKey.form.url") }}</label>
                        <input type="text" v-model="editKey.url"
                               :placeholder="$t('components.ChatAIKey.form.pleaseEnterKeyUrl')">
                    </div>
                    <div class="FormActions">
                        <button @click="editSelectedKeys">{{ $t("components.ChatAIKey.form.save") }}</button>
                        <button @click="status.editFormStatus = false">{{
                                $t("components.ChatAIKey.form.cancel")
                            }}
                        </button>
                    </div>
                </div>
                <div class="Bottom">
                    <!-- APIKey列表 -->
                    <div class="KeyPool">
                        <table>
                            <thead>
                            <tr>
                                <th>
                                    <label>
                                        <input type="checkbox"
                                               :checked="isAllSelected"
                                               @change="toggleAllSelection">
                                        <span class="CustomCheckbox"></span>
                                    </label>
                                </th>
                                <th>{{ $t("components.ChatAIKey.form.enable") }}</th>
                                <th>{{ $t("components.ChatAIKey.form.key") }}</th>
                                <th>{{ $t("components.ChatAIKey.form.remarks") }}</th>
                                <th>{{ $t("components.ChatAIKey.form.url") }}</th>
                                <th>{{ $t("components.ChatAIKey.form.balance") }}</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr
                                v-for="keyItem in keyPools || []"
                                :key="keyItem.key"
                                @click="toggleRowSelection(keyItem.key)"
                                :class="{ 'SelectedRow': operationSelection.includes(keyItem.key) }">
                                <td @click.stop>
                                    <label>
                                        <input type="checkbox"
                                               :value="keyItem.key"
                                               v-model="operationSelection"
                                               @click.stop>
                                        <span class="CustomCheckbox"></span>
                                    </label>
                                </td>
                                <td>
                                    <label>
                                        <input
                                            type="checkbox"
                                            :checked="keyItem.enabled"
                                            @change="toggleKeyEnable(keyItem)">
                                        <span class="CustomCheckbox"></span>
                                    </label>
                                </td>
                                <td :title="keyItem.value">{{ maskKey(keyItem.value) }}</td>
                                <td :title="keyItem.remark">{{ keyItem.remark }}</td>
                                <td :title="keyItem.url">{{ keyItem.url }}</td>
                                <td :title="keyItem.balance">{{ keyItem.balance }}</td>
                            </tr>
                            <tr v-if="(keyPools || []).length === 0">
                                <td colspan="6" class="EmptyTip">{{ $t("components.ChatAIKey.addTip") }}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </template>
    </FoldingPanel>
</template>

<style scoped lang="less">
.ChatAIKey {
}

.Top {
    display: grid;
    grid-template-columns: repeat(auto-fill, 200px);
    gap: 10px;
}

.ModelSelector {
    position: relative;
    user-select: none;

    .SelectedModel {
        display: flex;
        align-items: center;
        padding: 12px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;
        background-color: var(--background-color);

        &:hover {
            border-color: #80ceff;
            box-shadow: 0 2px 8px var(--box-shadow-color);
        }
    }

    .Open {
        border-radius: 8px 8px 0 0;
    }

    .ModelList {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        list-style: none;
        border: 1px solid var(--border-color);
        border-top: none;
        border-radius: 0 0 8px 8px;
        background-color: var(--background-color);
        z-index: 100;
        overflow: hidden;

        li {
            display: flex;
            align-items: center;
            padding: 12px;
            cursor: pointer;
            transition: background 0.2s;

            &:hover {
                background-color: var(--background-color-Anti);
                color: var(--background-color);
            }
        }

        .Active {
            --Active-Background-Color: rgba(189, 229, 255, 0.5);
            background-color: var(--Active-Background-Color);
            color: #292A2DFF;

            &:hover {
                background-color: var(--Active-Background-Color);
                color: #292A2DFF;
            }
        }
    }

    .Logo {
        width: 24px;
        height: 18px;
        margin-right: 12px;
        border-radius: 2px;
        object-fit: cover;
    }

    .ModelOption {
        font-size: 14px;
    }

    .slide-enter-active,
    .slide-leave-active {
        transition: all 0.3s ease;
    }

    .slide-enter-from,
    .slide-leave-to {
        opacity: 0;
        transform: translateY(-10px);
    }
}

.AddForm {
    padding: 15px;
    margin: 20px 0;
    border: 1px solid var(--border-color);
    border-radius: 8px;

    .FormGroup {

        label {
            width: 80px;
            display: inline-block;
            margin: 8px 0;
        }

        input {
            padding: 8px;
            box-sizing: border-box;
            width: 100%;
        }
    }

    .FormActions {
        margin-top: 15px;

        button {
            margin-right: 10px;
            padding: 8px 16px;
        }
    }
}

.Bottom {
    margin: 20px 0;
    width: 100%;
    height: 400px;
    border: 1px solid var(--border-color);
    overflow-y: auto;

    .KeyPool {
        table {
            min-width: 1000px;
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;

            th, td {
                padding: 10px;
                box-sizing: border-box;
                border: 1px solid var(--border-color);
                text-align: center;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            tbody tr {
                transition: background-color 0.2s;
                cursor: pointer;

                &:hover {
                    color: var(--text-color-Anti);
                    background-color: var(--background-color-Anti);

                    .CustomCheckbox {
                        &::after {
                            background-color: var(--background-color);
                        }
                    }
                }
            }

            th:nth-child(1), td:nth-child(1) {
                width: 10%;
            }

            th:nth-child(2), td:nth-child(2) {
                width: 10%;
                pointer-events: auto;
            }

            th:nth-child(3), td:nth-child(3) {
                width: 20%;
            }

            th:nth-child(4), td:nth-child(4) {
                width: 25%;
            }

            th:nth-child(5), td:nth-child(5) {
                width: 25%;
            }

            th:nth-child(6), td:nth-child(6) {
                width: 10%;
            }

            .SelectedRow {
                --Active-Background-Color: rgba(107, 130, 145, 0.5);
                color: var(--text-color);
                background-color: var(--Active-Background-Color);

                &:hover {
                    color: var(--text-color);
                    background-color: var(--Active-Background-Color);

                    .CustomCheckbox {
                        &::after {
                            background-color: var(--background-color-Anti);
                        }
                    }
                }
            }
        }
    }
}

button {
    padding: 10px 30px;
    background-color: var(--button-background-color);
    color: var(--text-color);
    border: 1px solid #909399FF;
    border-radius: 4px;
    font-size: 14px;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
    transition: all 0.15s;

    &:hover {
        background-color: var(--button-hover-background-color);
    }

    &:active {
        background-color: var(--button-active-background-color);
    }
}

input[type="checkbox"] {
    display: none;

    &:checked + .CustomCheckbox::after {
        opacity: 1;

    }
}

.CustomCheckbox {
    display: inline-block;
    width: 20px;
    height: 20px;
    box-sizing: border-box;
    vertical-align: middle;
    border: 2px solid var(--border-color);
    border-radius: 4px;
    position: relative;
    cursor: pointer;

    &::after {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 10px;
        height: 10px;
        background-color: var(--background-color-Anti);
        border-radius: 2px;
        opacity: 0;
    }
}
</style>