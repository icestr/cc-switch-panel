# cc-switch-panel

一个基于 React + Vite + Hono + SQLite 的可视化面板项目，用于展示模型路由、成本、延迟、缓存效率、会话洞察等指标。

本项目读取并展示 cc-switch 产生的数据。

## 功能概览

- 多维度指标看板：概览、成本趋势、延迟、错误分解、路由分析等
- 会话与调用行为分析：活跃热力图、日总结、会话洞察
- 轻量后端接口：基于 Hono 提供本地数据查询能力

## 本地运行

```bash
npm install
npm run dev
```

启动服务端：

```bash
npm run start
```

生产构建：

```bash
npm run build
```

## 技术栈

- 前端：React 19、Vite、Recharts
- 后端：Node.js、Hono
- 数据：better-sqlite3

## 数据来源与致谢

- 数据来源：[`cc-switch`](https://github.com/farion1231/cc-switch)
- 致谢：感谢 cc-switch 项目作者与贡献者提供的数据基础与开源能力支持。

## 开源协议

本项目基于 [MIT License](./LICENSE) 开源。
