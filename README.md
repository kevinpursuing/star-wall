# 萤馆 · 学生成果陈列馆

> 每一点萤火，都值得一面墙。

**萤馆**（YING GALLERY）是一面艺术化的学生成果墙。名字取自"囊萤映雪"：古人借一点萤火读书到天明，这里把同学们在实验室、画室、操场与街巷里攒下的光，一盏一盏挂上墙。

它不是卡片网格，而是一座**夜间开放的美术馆长廊**：

- **横向漫步的展厅**：入口大厅 → 五个展厅（格物 / 游艺 / 青简 / 行远 / 破风）→ 出口。每个展厅有自己的墙色、竖排厅名和前言墙。
- **真实的布展**：轨道射灯与光束、石灰墙面纹理、连续的橡木地板、前景长椅视差、在暗处闪烁的萤火虫。
- **九种装裱方式**：金色雕花框、原木框、黑框白卡纸、白框宽卡纸、无框悬浮、深框画箱、立轴（含天头、惊燕、隔水、轴头）、夹挂手稿、展台玻璃罩。全部用 CSS 绘制，按"墙面单位"等比缩放。
- **展签与印章**：每件作品旁有博物馆式展签。荣誉做成朱红印章，国家级、省级用白文（实心），市级及以下用朱文（描边）。
- **近观**：点击作品，它会从钉子上"取下"，飞到聚光台中央，墙上留下空位和钉子；右侧滑出纸质图录页，包含策展手记、作者自述、指导教师、关键词和相关链接。← → 切换作品，Esc 送回原位。
- **导览**：顶部显示"你在第几展厅"，底部是可拖动的平面导览图；按 `/` 打开导览手册，可按展厅、年级、荣誉级别、关键词或全文搜索筛选。筛选后墙面会重新布展成一场"特展"。
- **可分享**：筛选条件和正在近观的作品都写在网址里，例如 `/?room=arts&w=xishan-qingyuan`。

## 快速开始

```bash
npm install
npm run dev
```

然后打开 <http://localhost:4680>。

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 开发服务器（端口 4680） |
| `npm run build` / `npm start` | 生产构建 / 启动 |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript 检查 |

需要 Node.js 20+。首次构建会从 Google Fonts 下载并自托管字体（思源宋体、Cormorant Garamond、龙藏体），需要联网。

## 数据源：从其他系统读取作品

成果墙**不负责录入或上传**，作品从外部系统读取。在 `.env.local` 中配置（可参考 `.env.example`）：

```bash
WORKS_SOURCE_URL=https://your-school.example.com/api/achievements
# 可选：以 Authorization: Bearer … 发送
WORKS_SOURCE_TOKEN=xxxx
```

- 未配置 `WORKS_SOURCE_URL` 时，展出 `src/lib/seed.ts` 中的 18 件**示例作品**（虚构的学生与比赛）。
- 数据在**服务端**读取（`src/lib/source.ts`），使用 Next.js 的 `"use cache"` 缓存，大约每分钟在后台刷新一次。刷新失败时继续展出上一次成功的数据。
- 第一次就读取失败时，会显示"临时闭馆"页面并提供重试。
- 构建（`npm run build`）时也会读取一次数据源，数据源不可达会导致构建失败。

### 数据格式

接口返回一个数组，或者把数组放在 `works` / `data` / `items` / `list` / `records` 字段里（支持一层嵌套，例如 `{ "code": 0, "data": { "items": [...] } }`）。

完整格式与 `src/lib/types.ts` 中的 `Work` 一致：

```json
{
  "id": "xishan-qingyuan",
  "title": "溪山清远",
  "subtitle": "可选副标题",
  "room": "arts",
  "authors": [{ "name": "林小满", "grade": "初二", "className": "3" }],
  "team": "可选团队名",
  "mentor": "沈墨（美术）",
  "medium": "纸本水墨 · 68 × 45 cm",
  "date": "2026-06",
  "award": { "level": "市级", "event": "市中小学生书画大赛", "prize": "金奖", "seal": "金奖" },
  "tags": ["水墨", "山水"],
  "description": "策展手记，空一行分段。",
  "quote": "作者自述",
  "link": { "label": "查看项目", "url": "https://…" },
  "art": { "kind": "image", "src": "https://…/xishan.jpg", "width": 864, "height": 1152, "alt": "图像描述" },
  "frame": "scroll",
  "size": "lg",
  "hidden": false
}
```

**必填只有 `title` 和至少一位作者**，其余字段都可以省略。为了方便直接对接已有系统，以下简写也能识别：

| 想表达的 | 可以这样写 |
| --- | --- |
| 作者 | `"student": "王小明"`，配合 `"grade": "高二"`、`"class": "3"` 或 `"class": "八年级（2）班"`；也可用 `students` 数组 |
| 展厅 | `room` 取 `science / arts / letters / practice / sports`，或用 `category` 写"科技创新""艺术""社会实践""体育"等，会按关键词自动归入展厅 |
| 荣誉 | `"award": "省级一等奖"` 或 `"award": "全国青少年科技创新大赛一等奖"`，会自动拆出级别与奖项 |
| 图片 | `"image": "https://…/a.jpg"` 或 `"image": { "src": "…" }`；也支持相对路径，按数据源地址解析 |
| 日期 | `2026-04-12`、`2026.4`、`2026年4月` 都会转成 `2026-04` |
| 关键词 | 数组，或用逗号、顿号分隔的字符串 |

数据源没给的内容会自动补上：

- **图片尺寸**：缺少 `width` / `height` 时，服务端会用 sharp 读取原图来测量，同时取图像主色作为加载占位色。测量失败则按 4:3 悬挂。
- **装裱方式**：按"形式/材质"和关键词推断。水墨、书法用立轴，油画用金框，作文、手稿用夹挂，剪纸、标本用画箱，水彩、素描用白框，摄影用黑框；都不匹配时按展厅给默认值。
- **尺幅**：国家级荣誉挂大幅，其余中幅。
- **没有图片**：自动生成一幅抽象水墨占位画（同一作品每次生成的都一样）。
- **`hidden: true`**：该作品不上墙。

如果你们的字段名差异很大，最直接的做法是在 `src/lib/source.ts` 里先把原始数据映射成上面的格式，再交给 `normalizeCollection`。

## 自定义

| 想改的 | 文件 |
| --- | --- |
| 馆名、学校、展览标题、季度、前言 | `src/site.config.ts` |
| 展厅名称、前言、墙面颜色 | `src/lib/rooms.ts` |
| 示例作品 | `src/lib/seed.ts`（图片在 `public/works/`） |
| 装裱外观 | `src/styles/frames.css`，几何比例在 `src/lib/geometry.ts` |
| 展墙、灯光、地板、长椅 | `src/styles/gallery.css` |
| 顶栏、平面图、近观、导览手册 | `src/styles/chrome.css` |

为示例数据补充新图片时，可以先把原图放进一个文件夹，再运行：

```bash
node scripts/optimize-images.mjs ./my-photos   # 输出 WebP 到 public/works/，并打印宽高与主色
```

## 技术栈

- Next.js 16（App Router、Cache Components、Turbopack）+ React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui（Base UI）：按钮、输入框、Sheet、Dialog、Tooltip、Toast
- motion：作品飞入飞出的 FLIP 弹簧动画、特展切换、导览动效
- 纹理全部由 SVG 滤镜即时生成（噪点、石灰墙、宣纸、丝绢、木纹），没有额外的图片资源

## 无障碍与动效

- 所有作品都是可聚焦的按钮。Tab 聚焦时作品会自动滑到画面中央；← → / PageUp / PageDown / Home / End 可以在长廊中漫步。
- 近观是带焦点陷阱的对话框，关闭后焦点回到对应作品。
- 开启系统"减少动态效果"后，会关闭开场幕布、飞行动画、视差和萤火虫闪烁。
- 宽度小于 768px 或高度小于 540px 时，切换为竖向漫步布局。

## 目录结构

```
src/
  app/                 页面、加载 / 错误 / 404、全局样式入口
  components/
    art/               装裱（FramedArt）、画面、稿纸手稿、生成式占位画
    gallery/           长廊、展厅、展签、印章、近观、导览、平面图、顶栏
    brand/             萤馆印章与共享 SVG 滤镜
    ui/                shadcn/ui 组件
  lib/
    source.ts          数据源适配（服务端，带缓存）
    normalize.ts       外部数据 → Work 的宽容解析与自动策展
    seed.ts            示例作品
    geometry.ts        装裱几何（墙面单位）
    filters.ts / url-state.ts / rooms.ts / types.ts
  styles/              纹理、装裱、展墙、界面
scripts/optimize-images.mjs
```
