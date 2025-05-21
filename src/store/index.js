import {createStore} from 'vuex'

export default createStore({
    state: {
        // 默认白昼
        theme: localStorage.getItem('user-theme') || 'System'
    },
    getters: {
        // 获取当前主题
        currentTheme: (state) => state.theme
    },
    mutations: {
        // 设置主题
        SET_THEME(state, theme) {
            state.theme = theme
            localStorage.setItem('user-theme', theme)
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
