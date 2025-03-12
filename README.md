# 浏览器工作原理

这个一个用 Vuepress 搭建的技术文档。
```
pnpm install
pnpm docs:dev
```

[这是在线文档，请查看](https://mmmying.github.io/how-browsers-work/)

下边将从零详细介绍如何搭建这样的技术文档并将它部署在 GitHub Pages 上。

具体就是分三步：**创建 GitHub Pages -> 搭建 Vuepress -> 将 Vuepress 部署到 GitHub Pages 上**

## 创建 GitHub Pages
1. 在 GitHub 上创建一个仓库，用来存放文档。
Repository Name 为 `github_username.github.io`
2. 在新仓库中新建一个 index.html，这个是为了测试用
```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>my blog</title>
</head>
<body>
    <h1>this is my blog</h1>
    <h1>Hello ~</h1>
</body>
</html>
```
3. 访问 `github_username.github.io`，就可以看到你的博客了

## 搭建 Vuepress
看官网文档即可，[Vuepress 快速入门](https://vuepress.vuejs.org/zh/guide/getting-started.html)

注：我直接创建项目模版启动后发现缺少 sass 依赖，所以需要手动安装下 sass

## 将 Vuepress 部署到 GitHub Pages 上
1. 设置 base
如果发布到 https://github_username.github.io/，因 base 默认是 '/'，base 就不用设置
如果发布到子路由上，要在 docs/.vuepress/config.js 中配置 base，确保与 GitHub 仓库名称匹配，也就是说仓库地址是 https://github.com/github_username/repo_name ，则将 base 设置为 "repo_name"
比如上边的在线文档地址是 `https://mmmying.github.io/how-browsers-work/`， 那 base 就是 `/how-browsers-work/`
```
// docs/.vuepress/config.js
import { defaultTheme } from "@vuepress/theme-default";
import { defineUserConfig } from "vuepress/cli";
import { viteBundler } from "@vuepress/bundler-vite";

export default defineUserConfig({
  base: "/how-browsers-work/", // 配置 base
  // 其他配置...
})
```

2. 在 package.json 中配置打包脚本
```
{
  "scripts": {
    "docs:build": "vuepress build docs"
  }
}
```

3. 打包生成静态文件
```
pnpm docs:build
```

4. 初始化 git 并将 Vuepress 项目提交到 GitHub
```
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/github_username/repo_name.git
git push -u origin main
```
5. 推送构建文件到 gh-pages 分支
使用 gh-pages，这是一个用于将文件发布到 GitHub 的 gh-pages 分支或其他任何指定分支的工具
```
pnpm install gh-pages --save-dev
```
在 package.json 中添加脚本
```
{
    "scripts": {
        "deploy": "gh-pages -d .vuepress/dist"
    }
}
```
运行部署
```
pnpm deploy
```

6. 配置 Github Pages
进入仓库的 Settings > Pages，选择 gh-pages 分支

7. 访问 `github_username.github.io/repo_name`，就可以看到 vuepress 的内容了
