# EcoTrail · Milestone 3 状态分析

> **⏩ 更新（2026-06-18，晚些时候）**：本文档下半部分"你还需要完成哪些"里的**代码类问题，Claude 已经全部改好并通过生产构建验证**。
> 已完成（代码）：登录门、Onboarding 偏好保存、注册→onboarding 跳转、前端 API 地址可配置、后端 CORS 可配置、清理无用代码（firebase + 旧 SQLAlchemy）。
> 仍需你本人操作（账号/密钥相关）：跑 Supabase SQL、部署后端+填 OpenAI key、部署前端、配 Auth 白名单、推 GitHub。
> **具体步骤见 `DEPLOY_GUIDE.md`，SQL 见 `supabase_migration_milestone3.sql`。** 下面的原始分析保留作为交接时点的存档。

---

> 分析日期：2026-06-18 · 分析对象：`6.10/` 文件夹 vs 你的基线副本 `TRS/EcoTrail-React/`
> 方法说明：这个文件夹**没有 git 历史**，所以我无法靠提交记录区分"谁写了哪一行"。
> 我的做法是：把 `6.10/` 和你交接前的基线副本 `TRS/EcoTrail-React/`（停在 ~5 月 31 日）逐文件对比。
> 因此下面"Yujie 完成的"= **交接之后被改动/新增的内容**。这是基于代码差异的客观推断，不是凭空猜测。

---

## 一、整体判断

交接前（你的基线）：一个主要"长得像真的"的前端原型 —— 登录、Dashboard、Leaderboard、Badges、Challenges、Profile 这些页面刚接上 Supabase，但 **Plan（行程规划）还是假数据**，而且没有真正的"赚积分→升级→存进数据库"闭环。

现在（6.10）：已经是一个**能跑的真实应用**。最大的两块进展是
（1）一个**AI 行程规划器**（前端 + 一个真正的 Python 后端调用 OpenAI），
（2）**游戏化机制真正打通并写入数据库**（积分、等级、活动记录、挑战）。

一句话：Milestone 3 的核心要求"UI + 游戏化整合"在功能上基本达成了，剩下的主要是**部署、安全门、清理和测试**这类"收尾的水电管线活"。

---

## 二、Yujie 完成了哪些（已验证）

### 1. ⭐ AI 行程规划器（最大亮点）
- `src/pages/Plan.jsx`：**+703 行 / −113 行**，几乎是整页重写。
- 新建了真正的后端 `backend/main.py`：从原来的 **11 行**（只有一个 "Hello"）扩展到 **512 行**。
  - `POST /api/plan-trip` —— 调用 **OpenAI（gpt-4.1-mini）** 生成行程方案。
  - `GET /api/city-search` —— 城市搜索/自动补全。
  - 没有 key 时有 `build_demo_plan` 兜底（demo 模式）。
  - API key 从环境变量 `OPENAI_API_KEY` 读取（**没有硬编码**，做法是对的）。
- `vite.config.js`：新增代理 `/api → http://127.0.0.1:8000`；新增 `requirements.txt`（fastapi/uvicorn/certifi）和 `dev:api` 启动脚本。
- 规划完的行程会**写入 Supabase 的 `trips` 表**，并更新 `profiles` 的 `trips_count` 和省下的 CO₂。

> 名词解释：**后端（backend）**= 一个跑在服务器上的小程序，负责前端做不了的事（这里是替你保管 OpenAI 密钥、去调用 AI）。Supabase 自带的接口做不了"调用 AI"，所以必须有这个独立后端。

### 2. ⭐ 游戏化闭环真正打通（这正是 Milestone 3 的核心）
- 新建 `src/gamification.js`：一套完整的**8 级等级体系**（Eco Beginner → Trail Legend，超出后还能继续升 "Planet Protector"）。
- `src/App.jsx`（+71 行）：`addPoints()` 现在会
  （a）把活动写进 `user_activity` 表，
  （b）更新 `profiles` 的积分、周积分、等级。
  也就是"赚积分 → 升级 → 存进数据库"现在是**真的**，不再是页面上的假数字。
- `src/pages/Dashboard.jsx`（+198 / −127）：用 `gamification.js` 算等级进度，读取真实的推荐数据和活动记录。

### 3. 登录方式扩展
- `Login.jsx` / `Signup.jsx`：在原来的 Google 登录之外，**新增了邮箱 + 密码注册/登录**，注册还带邮件确认流程。

### 4. 侧边栏/顶栏显示真实用户
- `src/Layout.jsx`：现在显示**真正登录用户**的名字、头像、积分、等级、退出按钮（之前是写死的假用户）。

### 5. Challenges 接入数据库
- `Challenges.jsx`（+83 / −21）：从 `challenges` 表读挑战，加入挑战写入 `user_challenges` 表，并限制"一次只能参加一个挑战"。

### 6. Leaderboard 的权限修复
- 新增 `supabase_leaderboard_policy.sql` + 改了 `supabase_schema.sql`：把 `profiles` 改成**所有人可读**，这样排行榜才能看到别人。同时给 `user_activity` 加了删除权限。

> 名词解释：**RLS（行级安全）**= Supabase 的数据保护规则。默认"每个人只能看自己的数据"，但排行榜需要看到所有人，所以必须专门开一条"公开可读"的规则。这一步她做对了。

### 7. Profile 页面深度接入 Supabase
- `Profile.jsx`（+308 / −24，Supabase 调用从 2 处增加到 9 处）：偏好设置、eco-weight 滑块、GDPR 控件等现在会真正存进数据库。

**小结**：你在交接说明 `SETUP_YUJIE.md` 里列的第 1 个待办（"Plan.jsx 还用假数据，要改成 Supabase"）—— **已完成，而且远不止于此**（直接做成了 AI 规划器）。

---

## 三、你（Davide）还需要完成哪些

> 重要提醒：按我们的项目记录，**Milestone 3 截止约在 6 月 22 日**（今天 6/18，约剩 4 天）。请你确认这个日期和提交形式。

### 🔴 关键 / 卡点（直接影响 demo 能不能跑）

1. **登录门（Auth Guard）还是没做。**
   `/app/*` 这些页面**仍然没有保护**——没登录的人直接打开 `/app` 也能进（只是数据是空的）。代码里那些 `if (!authUser)` 都是"保存数据时的判断"，**不是路由保护**。
   需要：加一个守卫，未登录就跳回 `/login`，并加载状态时显示 loading。（小活，约 30 分钟，我可以直接帮你写。）

2. **后端必须部署 + 配置 API key。** 这是最大的架构待办。
   - 新的 AI 后端**不能放在 Vercel 上**（Vercel 只能跑静态前端，跑不了长期运行的 Python 服务）。需要单独找地方托管（如 Render / Railway / Fly.io）。
   - 需要设置 `OPENAI_API_KEY`（**调用 AI 是要花钱的**，按次计费）。
   - 部署后，要把前端的 `/api` 指向**线上后端地址**，而不是现在的 `localhost:8000`。
   - 现状：AI 规划器**只有在你本地同时跑 `npm run dev:api` 时才工作**，线上 demo 现在是不通的。

3. **把新的 SQL 在 Supabase 里跑一遍。**
   `supabase_leaderboard_policy.sql` 要在 Supabase 后台执行（并确认 GRANT 权限），否则排行榜看不到其他人。

### 🟠 重要（影响体验完整度）

4. **Onboarding（首次偏好选择）没有保存。**
   `Onboarding.jsx` 自 5 月 19 日起没动过——用户选完偏好后只是 `navigate('/app')`，**偏好根本没写进数据库**。建议补上写入 `profiles` 的逻辑。

5. **完整端到端测试一遍**：用真实账号走 注册 → onboarding → 规划行程(AI) → 赚积分 → 升级 → 排行榜 → 徽章，确认积分/等级/行程都真的存下来了。

6. **用当前代码重新部署 Vercel 前端**，并确认它能连上线上后端。

### 🟡 清理 / 收尾

7. **删除无用代码**：`src/firebase.js` 和 `package.json` 里的 `firebase` 依赖都还在（已经被 Supabase 取代）；旧的 `backend/models.py` + `backend/database.py`（SQLAlchemy/SQLite）现在也没用了。

8. **徽章只是展示，不会自动解锁。** `Badges.jsx` 只读取，没有"满足条件自动发徽章"的逻辑。决定一下 Milestone 3 是否需要这个。

9. **GitHub 团队仓库还没建**（两个文件夹都没有 git）。交接说明里的待办，还没做。

### 🔵 大局 / 文档

10. **应用现在用了 OpenAI** —— 这一点必须写进最终论文的 **GenAI 声明**和方法论部分，也是 Milestone 3 的一个讲解亮点。

11. **准备 Milestone 3 的交付物本身**（演示文稿 / demo / 截图）—— 请确认确切的提交格式和截止时间。

---

## 四、我的真实评价（作为你的 co-founder）

**好消息，而且是大好消息**：Yujie 这次做的是实打实的高质量工作。AI 规划器 + 真正落库的游戏化闭环，让这个项目从"高仿原型"变成了"真能用的产品"。这把你们在 Milestone 3 往前推了一大步，最难、最有创造性的部分已经做完了。

**需要冷静看待的一点**：她把 **FastAPI 后端又加回来了**——而这正是你当初为了简化、特意从 FastAPI 切换到 Supabase 时想砍掉的东西。这本身**不算错**（调用 AI 确实需要一个服务器端），但代价是：你现在变成了**两套部署**（Supabase + 一个独立的 Python 后端），托管和维护都更重，而且这是**最大的 deadline 风险**——只要后端没部署 + 没配 key，线上 demo 的 AI 功能就是不通的。

**我现在的"感觉"**：你处在一个很有利的位置，硬骨头啃完了，剩下的大多是"接线和部署"这类低风险但琐碎的活。如果让我排优先级，我会按这个顺序：
**① 加登录门 → ② 在 Supabase 跑 SQL → ③ 把后端部署好并配上 key → ④ 端到端测一遍。**
其中 ③ 是唯一可能让你 demo 翻车的点，建议尽早动手。

---

*（本文件由 Claude 生成，作为 Milestone 3 进度存档。所有结论均来自对 `6.10/` 与 `TRS/EcoTrail-React/` 的实际代码对比。）*
