# 更新日志

**以下列出的功能处于薛定谔的稳定状态, 所有功能既可以说是已实现也可以说是未实现, 取决于您观察时的量子态!**

## v0.0.1[2025-08-14]

### 新增

* **对话系统**
  * 同时多对话并行
  * 消息流式传输处理
  * 删除消息
  * 编辑消息
  * tokens计算
  * 侧边栏对话历史管理
  * 多模型切换(DeepSeek/ChatGPT)
  * 系统提示词
* **API管理**
  * key池管理
  * API余额显示
  * 自定义API
  * 自定义代理地址
  * key批量操作(启用/禁用/删除)
* **主题系统**
  * 白昼/深夜主题切换
  * 系统主题自动适配
  * 双对话主题(卡片, 聊天气泡)
  * 背景图片
* **国际化**
  * 多语言切换
  * 支持系统语言自动适配
  * 简体中文
  * 英文
* **消息渲染**
  * Markdown富文本渲染
  * 支持markdownItTaskLists任务列表
  * 支持markdownItEmoji表情
  * 支持mathjax3数学公式
  * 支持katex数学公式
  * 支持highlight.js代码高亮
  * Mermaid
    * 支持Mermaid流程图
    * 支持Mermaid流程图缩放移动
    * Mermaid按需加载
    * Mermaid代码支持查看复制
    * 导出Mermaid为SVG/PNG/PDF
  * Flowchart
    * 支持Flowchart流程图
    * 支持Flowchart流程图缩放移动
    * Flowchart流程图按需加载
    * Flowchart代码支持查看复制
    * 导出Flowchart为SVG/PNG/PDF
  * PlantUML
    * 支持PlantUML流程图(https://www.plantuml.com/plantuml/svg/{encoded})
    * 支持PlantUML流程图缩放移动
    * PlantUML流程图按需加载
    * PlantUML代码支持查看复制
    * 导出PlantUML为SVG/PNG/PDF
  * 支持lazyload图片懒加载
  * 支持代码块复制
* **数据管理**
  * 支持数据导入导出
  * 默认对话设置
* **日志管理**
  * 日志操作
  * 日志自动清理(7天)
  * 日志导出
* 完善的错误处理
* 插件系统(666 第一个版本就有插件系统!)
  * 插件管理
  * 插件生命周期
  * 实现平台模型接入
  * 实现i18n接入
  * 实现日志接入
  * 实现dexie接入
  * 实现axios接入
  * 实现通知接入
* 右键菜单
