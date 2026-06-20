# EcoTrail · 上线部署指南（Milestone 3）

> 这份指南列出**让线上 demo 完整跑起来**需要做的事。
> 标 ✅ 的我（Claude）已经在代码里改好了；标 👉 的需要**你在自己的账号里操作**（我没有你的密钥和账号权限，做不了）。
> 全程大约 15–25 分钟。

---

## 0. 现在的架构（三块）

```
   浏览器
     │
     ├──────────────►  前端 (React)         →  部署在 Vercel（静态网站）
     │                    │
     │                    ├─ 数据/登录/积分  →  Supabase (Postgres + Auth)
     │                    │
     │                    └─ AI 行程规划 /api →  后端 FastAPI  →  部署在 Render（调用 OpenAI）
```

**关键点**：AI 规划器需要一个**独立的后端服务器**（因为要保管 OpenAI 密钥、调用 AI）。
这个后端**不能放进 Vercel**，所以要单独部署到 Render（或 Railway / Fly.io）。

---

## 1. 👉 在 Supabase 里跑一次 SQL（约 2 分钟）

1. 打开 Supabase 后台 → 左侧 **SQL Editor** → **New query**。
2. 把 `supabase_migration_milestone3.sql` 的全部内容复制进去 → 点 **Run**。
3. 它会做四件事：补全权限 GRANT、开放排行榜读取、允许账号重置删除活动、**新增 `preferences` 列**（onboarding 偏好就存在这里）。
4. 验证：**Table Editor → profiles**，确认多了一列 `preferences`。

> 这个文件可以重复运行，不会破坏已有数据。

---

## 2. 👉 部署后端 FastAPI 到 Render（约 8 分钟）

前提：代码已经推到 GitHub（见第 5 节）。

1. 注册 / 登录 [render.com](https://render.com)。
2. **New +** → **Blueprint** → 选你的 GitHub 仓库。Render 会自动读取仓库根目录的 `render.yaml`。✅（这个文件我已经建好了）
3. 创建后进入服务的 **Environment** 标签，填入：
   - `OPENAI_API_KEY` = 你的 OpenAI 密钥（**这是要花钱的**，在 platform.openai.com 申请）
   - `ALLOWED_ORIGINS` = 你的前端线上地址，例如 `https://ecotrail.vercel.app`（先随便填，第 3 步拿到真实地址后回来改）
4. 部署完成后，Render 会给你一个后端地址，例如 `https://ecotrail-api.onrender.com`。
   打开 `https://你的后端地址/` 应该看到 `{"message": "EcoTrail API is running"}` —— 看到就说明后端活了。

> 没有 OpenAI 密钥也能部署：后端会自动返回一个内置的 **demo 行程**（不报错），方便先把流程跑通。

---

## 3. 👉 部署前端到 Vercel，并指向后端（约 6 分钟）

1. 登录 [vercel.com](https://vercel.com) → **Add New → Project** → 选同一个 GitHub 仓库。
2. Vercel 会自动识别这是 Vite 项目。**Environment Variables** 里加一条：
   - `VITE_API_BASE_URL` = 第 2 步拿到的后端地址（如 `https://ecotrail-api.onrender.com`）✅（前端代码我已经改成读取这个变量）
3. 点 **Deploy**。完成后拿到前端地址（如 `https://ecotrail.vercel.app`）。
4. **回到第 2 步**：把 Render 后端的 `ALLOWED_ORIGINS` 改成这个真实前端地址，保存（Render 会自动重启）。否则浏览器会因为 **CORS** 拦截 AI 请求。

> 名词：**CORS** = 浏览器的跨域安全规则。后端必须显式声明"我允许这个前端地址来访问我"，否则请求会被拦下。

---

## 4. 👉 Supabase Auth 设置（约 3 分钟）

1. Supabase 后台 → **Authentication → URL Configuration**：
   - **Site URL** 填你的前端地址（`https://ecotrail.vercel.app`）。
   - **Redirect URLs** 里加上：`https://ecotrail.vercel.app/onboarding` 和 `https://ecotrail.vercel.app/app`。
     （注册新用户后我把跳转改成了去 `/onboarding`，所以这个地址要在白名单里，邮件确认链接才能正确跳回。）
2. **配置 Google 登录**（你已在 Google Cloud Console 拿到 Client ID + Client Secret）：
   - a. Supabase 后台 → **Authentication → Providers → Google** → 打开开关。
   - b. 把 **Client ID** 和 **Client Secret** 粘进这两个框 —— **只放这里**。不要写进代码、不要上传 GitHub；App 代码只调用 Supabase，根本用不到这两个值。
   - c. 这个页面会显示一个 **Callback URL**：
     `https://oisejxasfycdkafckpfe.supabase.co/auth/v1/callback`
     复制它 → 回到 **Google Cloud Console → 你的 OAuth client → Authorized redirect URIs** → 粘进去 → 保存。
   - d. 在 Google Cloud Console 的 **Authorized JavaScript origins** 里加上前端地址：本地 `http://localhost:5173`，线上 `https://ecotrail.vercel.app`。

> 🔒 安全提示：Client Secret 是机密。如果它曾被贴进聊天/邮件等地方，最稳妥的做法是去 Google Cloud Console 点 **Reset Secret** 重新生成一个（几秒钟），然后只把新的填进 Supabase。

---

## 5. 👉 GitHub 仓库（如果还没建，约 3 分钟）

两个文件夹现在都还没有 git。建一个团队仓库：

```bash
cd ~/Desktop/6.10
git init
git add .
git commit -m "Milestone 3: AI planner + gamification + auth guard + deploy config"
# 在 GitHub 网页上建一个空仓库 EcoTrail，然后：
git remote add origin https://github.com/<你的用户名>/EcoTrail.git
git branch -M main
git push -u origin main
```

> 建议在 `.gitignore` 里确认已经忽略 `node_modules/`、`dist/`、`.env`、`.env.local`、`_backup_*`。

---

## 6. ✅ 本地完整测试清单（部署前先在本地跑通）

```bash
# 终端 1 — 启动后端（需要先 export OPENAI_API_KEY，或不设走 demo）
cd ~/Desktop/6.10
pip install -r requirements.txt
npm run dev:api

# 终端 2 — 启动前端
npm install
npm run dev
```

然后在浏览器里走一遍，逐项打勾：

- [ ] 没登录时直接打开 `http://localhost:5173/app` → 应该被**弹回 /login**（这就是新加的登录门）。
- [ ] 用邮箱注册 → 进入 **Onboarding** → 选偏好 → Enter EcoTrail。
- [ ] 打开 **Profile**，确认刚才选的偏好**还在**（说明存进数据库了）。
- [ ] 在 **Plan a trip** 里搜一条行程 → 出现 AI 方案（没配 key 就是 demo 方案）。
- [ ] 选一个交通方式 → 积分增加 → Dashboard 等级进度更新。
- [ ] 打开 **Leaderboard**，能看到多个用户（说明 SQL 跑对了）。

---

## 7. 故障排查

| 现象 | 原因 / 解决 |
|---|---|
| AI 规划一直转圈或报错 | 后端没启动，或前端 `VITE_API_BASE_URL` 没指对 |
| 浏览器控制台报 **CORS** 错 | 后端 `ALLOWED_ORIGINS` 没加上前端真实地址 |
| 排行榜只有自己 | 第 1 步的 SQL 没跑（缺 public read 策略 / GRANT） |
| 偏好没保存 | 第 1 步 SQL 没加 `preferences` 列（控制台会有一条 warning，但不影响其它功能） |
| AI 总是返回 demo 方案 | 后端没设 `OPENAI_API_KEY`，或密钥额度用完 |
| 登录偶尔卡死（本地热更新时） | Supabase Web Locks 问题，`src/supabase.js` 里已有 fix |

---

## 8. 一句话总结：我改了什么 vs 你要做什么

**我（Claude）已经改好（✅ 代码层面）**：登录门、偏好保存、注册→onboarding 跳转、前端 API 地址可配置、后端 CORS 可配置、清理无用代码、所有部署配置文件 + SQL 迁移文件。

**只有你能做（👉 因为要用你的账号/密钥）**：跑 Supabase SQL、部署后端到 Render 并填 OpenAI 密钥、部署前端到 Vercel、配 Supabase Auth 白名单、推 GitHub。
