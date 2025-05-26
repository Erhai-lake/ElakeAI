<script>
import FoldingPanel from "@/components/FoldingPanel.vue";

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
            this.selectedModel = selectModel
            this.operationSelection = []
            this.loadKeyPools()
            this.status.modelStatus = false
        },
        // 加载Key池
        async loadKeyPools() {
            try {
                this.keyPools = await this.$DB.APIKeys.where("model").equals(this.selectedModel.name).toArray()
            } catch (error) {
                console.error("[Chats AI Key] 加载Key池错误", error)
                this.$toast.error("[Chats AI Key] 加载Key池错误")
            }
        },
        // 添加新Key
        async addNewKey() {
            try {
                if (!this.newKey.value) {
                    this.$toast.warning(this.$t("ChatAIKey.ADD_API_KEY_VALUE_REQUIRED"))
                    return
                }
                await this.$DB.APIKeys.add({
                    key: crypto.randomUUID(),
                    model: this.selectedModel.name,
                    value: this.newKey.value,
                    remark: this.newKey.remark || "空",
                    url: this.newKey.url || this.selectedModel.url,
                    enabled: this.newKey.enabled
                })
                await this.loadKeyPools()
                this.newKey = {
                    key: "",
                    value: "",
                    remark: "",
                    url: "",
                    enabled: true
                }
                this.status.addFormStatus = false
                this.$toast.success(this.$t("ChatAIKey.ADD_API_KEY_SUCCESS"))
            } catch (error) {
                console.error("[Chats AI Key] 添加Key错误", error)
                this.$toast.error("[Chats AI Key] 添加Key错误")
            }


            // if (!this.keyPools[this.selectedModel.name]) this.keyPools[this.selectedModel.name] = []
            // this.keyPools[this.selectedModel.name].push({...this.newKey})
        },
        // Key脱敏显示
        maskKey(key) {
            if (key.length < 8) return key
            return key.slice(0, 4) + '****' + key.slice(-4)
        },
        // 删除Key(批量)
        async removeSelectedKeys() {
            if (this.operationSelection.length === 0) {
                this.$toast.warning(this.$t("ChatAIKey.SELECT_KEYS_TO_REMOVE"))
                return
            }
            try {
                await this.$DB.APIKeys.bulkDelete(this.operationSelection)
                await this.loadKeyPools()
                this.operationSelection = []
                this.$toast.success(this.$t("ChatAIKey.REMOVE_API_KEY_SUCCESS"))
            } catch (error) {
                console.error("[Chats AI Key] 删除Keys错误", error)
                this.$toast.error("[Chats AI Key] 删除Keys错误")
            }
        },
        // 编辑Key
        async toggleEditSelected() {
            if (this.operationSelection.length === 0) {
                this.$toast.warning(this.$t("ChatAIKey.SELECT_KEYS_TO_EDIT"))
                return
            }
            if (this.operationSelection.length > 1) {
                this.$toast.warning(this.$t("ChatAIKey.YOU_CAN_ONLY_EDIT_ONE_AT_A_TIME"))
                return
            }
            // 获取数据库中选中的Key
            const KEY_DATA = await this.$DB.APIKeys.get(this.operationSelection[0])
            this.editKey = {
                key: KEY_DATA.key,
                value: KEY_DATA.value,
                remark: KEY_DATA.remark,
                url: KEY_DATA.url
            }
            this.status.editFormStatus = !this.status.editFormStatus
        },
        // 编辑Key
        async editSelectedKeys() {
            try {
                await this.$DB.APIKeys.update(this.editKey.key, {
                    value: this.editKey.value,
                    remark: this.editKey.remark,
                    url: this.editKey.url
                })
                await this.loadKeyPools()
                this.status.editFormStatus = false
                this.editKey = {
                    key: "",
                    value: "",
                    remark: "",
                    url: "",
                    enabled: true
                }
                this.$toast.success(this.$t("ChatAIKey.EDIT_API_KEY_SUCCESS"))
            } catch (error) {
                console.error("[Chats AI Key] 编辑Keys错误", error)
                this.$toast.error("[Chats AI Key] 编辑Keys错误")
            }
        },
        // 切换Key启用状态(单个)
        async toggleKeyEnable(keyItem) {
            try {
                const NEW_STATUS = !keyItem.enabled
                await this.$DB.APIKeys.update(keyItem.key, {enabled: NEW_STATUS})
                keyItem.enabled = NEW_STATUS
                this.$toast.success(this.$t(`ChatAIKey.${NEW_STATUS ? 'ENABLE' : 'DISABLE'}_SUCCESS`))
            } catch (error) {
                console.error("[Chats AI Key] 状态更新失败", error)
                this.$toast.error("[Chats AI Key] 状态更新失败")
            }
        },
        // 切换Key启用状态(批量)
        async batchToggleEnable(status) {
            if (this.operationSelection.length === 0) {
                this.$toast.warning(this.$t("ChatAIKey.SELECT_KEYS_TO_OPERATE"))
                return
            }
            try {
                await this.$DB.APIKeys.bulkUpdate(
                    this.operationSelection,
                    {enabled: status}
                )
                // 本地更新选中项状态
                this.keyPools = this.keyPools.map(item => {
                    if (this.operationSelection.includes(item.key)) {
                        return {...item, enabled: status}
                    }
                    return item
                })
                this.$toast.success(this.$t(`ChatAIKey.BATCH_${status ? 'ENABLE' : 'DISABLE'}_SUCCESS`))
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
    <FoldingPanel Height="500" :is="true">
        <template #Title>
            {{ $t("ChatAIKey.CHATS_API_KEY") }}
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
                            $t("ChatAIKey.ADD_API_KEY")
                        }}
                    </button>
                    <!-- 移除选中 -->
                    <button @click="removeSelectedKeys">
                        {{ $t("ChatAIKey.REMOVE_SELECTED", operationSelection.length) }}
                    </button>
                    <!-- 编辑选中 -->
                    <button @click="toggleEditSelected">
                        {{ $t("ChatAIKey.EDIT_SELECTED") }}
                    </button>
                    <div class="Consolidation">
                        <!-- 启用选中 -->
                        <button @click="batchToggleEnable(true)">
                            {{ $t("ChatAIKey.BATCH_ENABLE") }}
                        </button>
                        <!-- 禁用选中 -->
                        <button @click="batchToggleEnable(false)">
                            {{ $t("ChatAIKey.BATCH_DISABLE") }}
                        </button>
                    </div>
                    <div/>
                </div>
                <!-- 新增表单 -->
                <div v-if="status.addFormStatus" class="AddForm">
                    <h3>{{ $t("ChatAIKey.ADD_API_KEY") }}</h3>
                    <div class="FormGroup">
                        <label>{{ $t("ChatAIKey.API_KEY") }}</label>
                        <input type="text" v-model="newKey.value" :placeholder="$t('ChatAIKey.PLEASE_ENTER_API_KEY')">
                    </div>
                    <div class="FormGroup">
                        <label>{{ $t("ChatAIKey.API_KEY_REMARKS") }}</label>
                        <input type="text" v-model="newKey.remark"
                               :placeholder="$t('ChatAIKey.PLEASE_ENTER_API_KEY_REMARKS')">
                    </div>
                    <div class="FormGroup">
                        <label>{{ $t("ChatAIKey.API_KEY_URL") }}</label>
                        <input type="text" v-model="newKey.url" :placeholder="$t('ChatAIKey.PLEASE_ENTER_URL')">
                    </div>
                    <div class="FormActions">
                        <button @click="addNewKey">{{ $t("ChatAIKey.SAVE") }}</button>
                        <button @click="status.addFormStatus = false">{{ $t("ChatAIKey.CANCEL") }}</button>
                    </div>
                </div>
                <!-- 编辑表单 -->
                <div v-if="status.editFormStatus" class="AddForm">
                    <h3>{{ $t("ChatAIKey.EDIT_SELECTED") }}</h3>
                    <div class="FormGroup">
                        <label>{{ $t("ChatAIKey.API_KEY") }}</label>
                        <input type="text" v-model="editKey.value" :placeholder="$t('ChatAIKey.PLEASE_ENTER_API_KEY')">
                    </div>
                    <div class="FormGroup">
                        <label>{{ $t("ChatAIKey.API_KEY_REMARKS") }}</label>
                        <input type="text" v-model="editKey.remark"
                               :placeholder="$t('ChatAIKey.PLEASE_ENTER_API_KEY_REMARKS')">
                    </div>
                    <div class="FormGroup">
                        <label>{{ $t("ChatAIKey.API_KEY_URL") }}</label>
                        <input type="text" v-model="editKey.url" :placeholder="$t('ChatAIKey.PLEASE_ENTER_URL')">
                    </div>
                    <div class="FormActions">
                        <button @click="editSelectedKeys">{{ $t("ChatAIKey.SAVE") }}</button>
                        <button @click="status.editFormStatus = false">{{ $t("ChatAIKey.CANCEL") }}</button>
                    </div>
                </div>
                <div class="Bottom">
                    <!-- APIKey列表 -->
                    <div class="KeyPool">
                        <table>
                            <thead>
                            <tr>
                                <th><input type="checkbox" :checked="isAllSelected" @change="toggleAllSelection"></th>
                                <th>{{ $t("ChatAIKey.ENABLE") }}</th>
                                <th>{{ $t("ChatAIKey.API_KEY") }}</th>
                                <th>{{ $t("ChatAIKey.API_KEY_REMARKS") }}</th>
                                <th>{{ $t("ChatAIKey.API_KEY_URL") }}</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr v-for="keyItem in keyPools || []" :key="keyItem.key">
                                <td>
                                    <input type="checkbox" :value="keyItem.key" v-model="operationSelection">
                                </td>
                                <td>
                                    <input type="checkbox" :checked="keyItem.enabled"
                                           @change="toggleKeyEnable(keyItem)">
                                </td>
                                <td :title="keyItem.value">{{ maskKey(keyItem.value) }}</td>
                                <td :title="keyItem.remark">{{ keyItem.remark }}</td>
                                <td :title="keyItem.url">{{ keyItem.url }}</td>
                            </tr>
                            <tr v-if="(keyPools || []).length === 0">
                                <td colspan="5" class="EmptyTip">{{ $t("ChatAIKey.ADD_TIP") }}</td>
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

    .Consolidation {
        display: flex;
        justify-content: space-between;

        button {
            padding: 10px 18px;
        }
    }
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
            }

            th:nth-child(1), td:nth-child(1) {
                width: 5%;
            }

            th:nth-child(2), td:nth-child(2) {
                width: 5%;
            }

            th:nth-child(3), td:nth-child(3) {
                width: 20%;
            }

            th:nth-child(4), td:nth-child(4) {
                width: 25%;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            th:nth-child(5), td:nth-child(5) {
                width: 45%;
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
</style>