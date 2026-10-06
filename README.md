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

## 自定义壁纸

“全局设置 → 个性壁纸”保留“默认壁纸”和“新增壁纸（数量）”两个模式。默认模式在刷新页面时从当前的 3 张背景图中随机选择；“上传壁纸”支持一次选择多张 JPG、PNG 或 WebP 图片，加入当前浏览器的随机池。选用新增壁纸模式后，每次刷新页面会从这些图片中随机选择一张，之前添加的图片也会保留。图片存储在当前浏览器的 IndexedDB 中，换用浏览器、设备或网站地址时不会自动同步。若希望所有访客看到新图片，请替换 `public/images/background1.jpg` 至 `background3.jpg` 并重新构建；增加更多默认图片时，也需同步调整 `src/components/Background.vue` 中的随机数量。

## 添加更多歌单

现有歌单继续由 `.env` 中的 `VITE_SONG_SERVER`、`VITE_SONG_TYPE` 和 `VITE_SONG_ID` 设置；`VITE_SONG_NAME` 决定它在播放器里显示的名称。打开“可播放歌曲”时会先进入这个歌单，列表上方显示名称、下方有“选择歌单”按钮。要加入其他歌单，编辑 [`src/assets/playlists.json`](./src/assets/playlists.json)，把新歌单写成数组项，例如：

```json
[
  { "name": "我的 QQ 歌单", "server": "tencent", "id": "另一个歌单ID" },
  { "name": "我的网易云歌单", "server": "netease", "id": "网易云歌单ID" }
]
```

QQ 音乐分享链接如 `https://y.qq.com/n/ryqq_v2/playlist/7909661301`，末尾的数字就是歌单 ID。填入真实 ID 后运行 `npm run build`；本地启动脚本使用已构建的 `dist/`，因此改完配置后需要重新构建。

## 网址集

主页中的“网址集”入口打开 `/webcollections/`，可按分类浏览、筛选常用网站或搜索。网址内容在 [`public/webcollections/webcollections.json`](./public/webcollections/webcollections.json) 中维护；当前六条为示例收藏，可以直接替换。

在 `categories` 中添加分类，再在 `links` 中添加网址。例如：

```json
{
  "name": "网站名称",
  "url": "https://example.com/",
  "description": "一句话说明这个网站的用途",
  "category": "research",
  "tags": ["论文", "工具"],
  "favorite": true
}
```

`category` 要对应 `categories` 中的 `id`；`tags` 和 `favorite` 可省略。网址需以 `https://` 或 `http://` 开头。保存后运行 `npm run build`，刷新 `/webcollections/` 即可看到新内容。此页面会作为静态文件复制到 `dist/webcollections/`，无须单独启动服务。

## 来源与许可

本项目基于原作者 [imsyy](https://github.com/imsyy) 的 [imsyy/home](https://github.com/imsyy/home) 修改，继续遵循原项目的 [MIT License](./LICENSE)。原项目的代码及著作权声明归原作者所有；本仓库中的修改由我完成。此仓库与原作者没有官方关联。
