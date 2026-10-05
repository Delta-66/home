# 硫硫氮の主页

这是我在 [imsyy/home](https://github.com/imsyy/home)（「無名の主页」）基础上修改的个人主页。保留了原项目的 Git 历史和 [MIT 许可证](./LICENSE)，并在此说明来源。原作者的说明文档作为参考保存在 [原始 README（中文）](./README_ORIGINAL.md) 和 [原始 README（英文）](./README_ORIGINAL_EN.md)。

## 我的修改

- 改写站点名称、介绍和社交链接，并调整部分页面样式与交互。
- 调整音乐播放器及相关接口的本地配置。
- 在网站列表中加入博客和学术主页入口，移除不需要的入口。

博客与学术主页是此工作区中的另外两个独立项目，**不包含在本仓库内**。目前网站列表里的两条链接指向本机 `127.0.0.1`；如果将主页部署到公网，需要在 [`src/assets/siteLinks.json`](./src/assets/siteLinks.json) 中把它们改成博客和学术主页的公开地址。

## 本地运行

需要 Node.js 和 npm。首次运行时安装依赖：

```bash
npm install
```

将 `.env.example` 复制为 `.env`，按需修改站点名称、音乐与天气等配置。`.env` 不会提交到 Git。之后运行：

```bash
npm run dev
```

默认在 `http://localhost:3000/` 预览。发布前运行 `npm run build`，静态文件会生成在 `dist/`。

## 来源与许可

本项目基于原作者 [imsyy](https://github.com/imsyy) 的 [imsyy/home](https://github.com/imsyy/home) 修改，继续遵循原项目的 [MIT License](./LICENSE)。原项目的代码及著作权声明归原作者所有；本仓库中的修改由我完成。此仓库与原作者没有官方关联。
