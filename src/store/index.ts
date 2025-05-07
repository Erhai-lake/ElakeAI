import {createStore} from 'vuex'

export default createStore({
    state: {
        // 默认白昼
        theme: 'light',
    },
    getters: {
        // 获取当前主题
        currentTheme: (state) => state.theme
    },
    mutations: {
        // 设置主题
        SET_THEME(state, theme) {
            state.theme = theme
        }
    },
    actions: {
        // 切换主题
        switchTheme({commit}, theme) {
            commit('SET_THEME', theme)
        }
    },
    modules: {}
})
