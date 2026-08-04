# AGENTS.md

本文件定义 `Domain Console` 仓库的长期维护规则。所有开发者和自动化 Agent 在读取、修改或新增代码前都必须遵守。

## 1. 项目定位

- 技术栈：Next.js App Router、React、TypeScript strict、Tailwind CSS v4。
- UI 风格：[Neobrutalism Components](https://www.neobrutalism.dev/docs/)。
- 包管理器：pnpm。
- 部署目标：Vercel。
- 当前阶段：UI 原型；真实 API、GitHub OAuth 和权限控制尚未接入。
- 默认界面语言：中文为主，必要的域名与技术术语保留英文。

## 2. 必须遵守的核心规则

### 2.1 组件不得超过 300 行

- 每个 React 组件文件不得超过 **300 行**，包括 import、类型、组件实现和辅助逻辑。
- 接近 250 行时就应主动评估拆分，不要等到超过限制再处理。
- 一个文件中存在多个小组件时，文件总行数仍不得超过 300 行。
- 不得通过压缩格式、删除必要空行、把多条语句挤到一行等方式规避限制。
- 超过限制时，按职责拆分为：
  - 展示子组件；
  - 表单或 Dialog；
  - hooks；
  - 类型；
  - 数据转换与业务工具函数。
- 页面文件只负责路由、Metadata、Server/Client 边界和页面组合，不承载大型交互实现。

### 2.2 禁止重复造轮子

新增任何组件、hook 或工具函数之前，必须按以下顺序查找：

1. `src/components/ui` 中已有的基础 UI 组件；
2. `src/components` 中已有的业务组件；
3. `src/features` 和 `src/lib` 中已有的 hooks、类型与工具函数；
4. Neobrutalism 官方组件；
5. Neobrutalism 没有时，检查其底层 shadcn/ui 官方组件；
6. 最后才允许自行实现项目专用组件。

禁止：

- 复制已有组件后只修改少量 className；
- 为同一种 Button、Card、Badge、Dialog、Table、Tabs、Select、Toast 等创建第二套实现；
- 在多个页面重复日期格式化、错误处理、筛选、排序、状态颜色映射等逻辑；
- 为一个页面创建只能改变颜色或间距的重复组件；
- 使用原生临时弹窗代替已有 Dialog、AlertDialog、Sheet 或 Sonner。

可以通过 `className`、variant、size、props、组合或轻量 wrapper 扩展已有组件。只有当现有 API 确实无法表达需求时，才扩展基础组件。

### 2.3 优先使用 Neobrutalism 官方组件

- 新 UI 需求优先查阅：<https://www.neobrutalism.dev/docs/>。
- 如果官方存在对应组件，优先使用官方 Registry 组件源码，不自行仿制。
- 安装前先查看或预演 Registry 内容：

```bash
pnpm dlx shadcn@latest view https://neobrutalism.dev/r/<component>.json
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/<component>.json --dry-run
```

- 确认变更后再将组件加入项目，组件源码应保存在 `src/components/ui` 并纳入版本控制。
- 不得在 Vercel 构建阶段动态下载组件。
- Neobrutalism 上游已停止维护，因此引入后组件属于本项目维护范围；升级 React、Radix、Tailwind 或 Next.js 时必须回归测试。
- 如果官方组件与当前项目已有本地组件重复，优先扩展或升级已有本地组件，不得并存两套同类组件。
- 对官方源码的必要修改应保持最小化，并在 PR/变更说明中记录原因和上游来源 URL。

## 3. 目录职责

```text
src/app/                   路由、布局、Metadata、Server Component 入口
src/components/ui/         Neobrutalism/shadcn 基础组件源码
src/components/            跨页面业务组件与页面组合组件
src/features/domains/      域名类型、Store、Repository、业务规则与工具
src/data/                  Demo fixture 数据
src/lib/                   跨领域通用工具
```

规则：

- 不要把业务规则放进 `src/components/ui`。
- 不要把通用 UI 放进页面目录。
- 不要在页面中直接访问 localStorage、外部 API 或敏感环境变量。
- 域名相关类型与业务逻辑统一放在 `src/features/domains`。
- Demo 数据统一放在 `src/data`，不要散落在组件中。
- 仅服务端可见的 API Token 不得使用 `NEXT_PUBLIC_` 前缀。

## 4. React 与 Next.js 规范

- 默认使用 Server Components；仅在需要状态、事件、浏览器 API 或客户端 Provider 时添加 `"use client"`。
- Client Component 边界应尽可能小，不得无理由将整个页面客户端化。
- 使用 `next/link` 处理站内导航。
- 使用 App Router 的 `metadata` 或 `generateMetadata` 管理页面标题与描述。
- Next.js 动态路由参数按当前版本类型处理，不照搬旧版 API。
- 不得在 render 阶段产生副作用。
- localStorage 状态必须处理 SSR 与 hydration 一致性。
- 列表项必须使用稳定 ID 作为 key。
- 不得使用 `any`；优先使用明确类型、泛型或 `unknown` 加类型收窄。
- 不得使用 `@ts-ignore` 掩盖问题。确有必要时，必须解释原因并优先使用带说明的 `@ts-expect-error`。

## 5. 组件设计规范

- 组件职责单一，命名表达业务含义。
- 可复用行为通过 props、variant 或组合暴露，不复制实现。
- 页面级组件建议拆分为：
  - `*-client.tsx`：页面交互编排；
  - `*-form-dialog.tsx`：表单弹窗；
  - `*-table.tsx`：桌面表格；
  - `*-mobile-list.tsx`：移动展示；
  - `utils.ts`：纯函数；
  - `types.ts`：共享类型。
- 纯展示组件不得直接修改 Store。
- Store 写操作集中在明确的交互边界，并统一捕获错误、显示反馈。
- 复杂条件和数据转换优先提取为具名纯函数，避免在 JSX 中堆叠逻辑。
- 不要过早抽象：至少出现两处真实复用，或职责边界明确时再提取通用组件。

## 6. UI 与视觉一致性

- 优先使用主题 token：
  - `bg-main`
  - `bg-secondary-background`
  - `text-foreground`
  - `text-main-foreground`
  - `border-border`
  - `shadow-shadow`
  - `rounded-base`
- 保持粗边框、硬阴影、高对比色和清晰层级。
- 禁止在同一功能区域混入与 Neobrutalism 冲突的圆润、玻璃拟态或柔和阴影风格。
- 业务组件可以使用项目既有蓝、黄、绿、红强调色，但应优先复用现有 tone/variant。
- 不得仅依赖颜色表达状态；必须同时提供文字、图标或可访问名称。
- 长域名、DNS 内容和 ID 必须处理换行或横向滚动。

## 7. 响应式与无障碍

每个新增或修改的界面必须同时考虑：

- 最小宽度 320px；
- 常见移动端 390px；
- 桌面端 1280px 及以上；
- 键盘导航和可见 focus ring；
- 表单 Label、错误提示和必填状态；
- Icon Button 的 `aria-label`；
- Dialog 的 Title 与 Description；
- 表格在移动端改为卡片或提供合理横向滚动；
- `prefers-reduced-motion`；
- 空状态、加载状态、错误状态和不存在状态。

不要为了视觉效果破坏语义 HTML。

## 8. 数据与 API 边界

- UI 组件不得直接依赖当前 API 的原始响应细节；通过类型和 Repository/Adapter 隔离。
- 当前 Demo 操作统一通过 `DomainStoreProvider` 和 Mock Repository。
- 接入真实 API 时，应替换或新增 Repository/Adapter，而不是重写页面。
- API Token、OAuth Secret 和管理员白名单只能在服务端读取。
- 所有写操作必须在服务端重新鉴权、校验输入并处理错误。
- 不得在日志、Toast、URL 或客户端 Bundle 中泄露密钥。
- 日期解析、到期计算、筛选和排序应复用 `src/features/domains` 中的工具函数。

## 9. 依赖管理

- 统一使用 pnpm，不得同时生成 npm、Yarn 或 Bun 锁文件。
- 新增依赖前先确认项目和现有依赖无法完成该需求。
- 优先使用已安装的 Radix、Lucide、Sonner 和项目 UI 组件。
- 不得只为一个简单工具函数引入大型依赖。
- 新依赖必须说明用途、体积影响和维护状态。
- Vercel/CI 安装使用：

```bash
pnpm install --frozen-lockfile
```

## 10. 修改工作流

开始编码前：

1. 阅读相关页面、组件、Store、类型和工具函数；
2. 搜索是否已有可复用实现；
3. 检查 Neobrutalism 官方是否已有对应组件；
4. 明确 Server/Client 边界；
5. 预估组件是否会接近 300 行，必要时先设计拆分。

完成修改后至少运行：

```bash
pnpm lint
pnpm typecheck
pnpm build
```

涉及 UI 时还必须进行浏览器验收：

- 桌面端主流程；
- 390px 移动端；
- 键盘 focus；
- 空状态与错误状态；
- 浏览器控制台错误；
- 长域名和长 DNS 内容。

如果某项测试未运行或失败，必须如实说明，不得声称已完成验证。

## 11. 代码审查清单

提交前确认：

- [ ] 每个组件文件不超过 300 行；
- [ ] 没有重复创建已有 UI 或业务组件；
- [ ] 已优先检查并使用 Neobrutalism 官方组件；
- [ ] 没有可以提取复用的重复逻辑；
- [ ] 没有 `any`、无说明类型忽略或敏感信息；
- [ ] Server/Client Component 边界合理；
- [ ] 桌面端和移动端均可用；
- [ ] 可访问名称、Label、focus 和语义结构完整；
- [ ] `pnpm lint`、`pnpm typecheck`、`pnpm build` 通过；
- [ ] README 或变更说明已记录新增配置、依赖或部署变化。

## 12. 冲突处理

- 本文件是本仓库的项目级规范。
- 如果临时需求与本文件冲突，应先向用户说明冲突与影响，获得明确授权后再执行。
- 即使获得单次例外，也不得默认将例外扩展到后续任务。
