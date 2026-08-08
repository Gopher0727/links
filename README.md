# links

个人收藏链接站：只存链接，不写正文。深色极简、纯静态、零构建工具链。

## 结构

```
index.html          单页站点
style.css           样式
script.js           读取 data/articles.json 渲染列表
data/articles.json  收藏数据（唯一内容源）
tools/add-link.py   添加链接工具（零依赖）
```

## 添加链接

```bash
python3 tools/add-link.py <url>                 # 自动抓标题/描述，交互式确认
python3 tools/add-link.py <url> --tags blog,web --summary "一句话点评"
```

工具会抓取页面标题和描述供确认，按 URL 去重，然后追加写入 `data/articles.json`。
不想用工具也可以直接手编 JSON，字段见下：

```json
{
  "title": "The Boring Internet",
  "url": "https://example.com/article",
  "source": "example.com",
  "summary": "一句话点评（可省略）",
  "tags": ["blog", "web"],
  "added": "2026-08-08"
}
```

## 本地预览

```bash
cd links && python3 -m http.server 8000
# 打开 http://localhost:8000
```

## 部署

GitHub Pages 直接从 main 分支发布，无需构建：

1. 推送代码到 GitHub 仓库 `Gopher0727/links`
2. 仓库 Settings → Pages → **Deploy from a branch** → 选 `main` / `/ (root)`
3. 之后每次 push 自动生效：`https://gopher0727.github.io/links/`
