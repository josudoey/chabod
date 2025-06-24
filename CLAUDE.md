# CLAUDE.md

此檔案為 Claude Code 在此專案的工作指南。

## 常用指令

### 開發

- `npm run dev` - 啟動開發伺服器 (localhost:8080)
- `npm run build` - 正式版建置
- `npm run build:dev` - 開發版建置
- `npm run preview` - 預覽正式版

### 程式碼品質

- `npm run lint` - 執行 ESLint
- `npm run lint:fix` - 自動修復 ESLint 問題
- `npm run format` - 使用 Prettier 格式化

### 測試

- `npm test` - 執行所有測試
- `npm run test:watch` - 監視模式測試
- `npm run test:coverage` - 測試覆蓋率
- `npm run test:rls` - RLS (Row Level Security) 測試
- `npm run test:ui` - UI 元件測試
- `npm run test:ui:watch` - UI 監視測試

#### 快速測試指令

```bash
# UI 測試
npm run test:ui -- ComponentName.test.tsx
npm run test:ui:watch -- ComponentName.test.tsx

# RLS 測試
./tests/rls/run-rls-tests.sh groups.rls.test.ts
./tests/rls/run-rls-tests.sh --watch groups.rls.test.ts
```

#### 測試指令選擇

**`npm run test:ui` (僅前端)：**

- 僅修改 React 元件/hooks/UI
- 僅前端功能變更
- 無資料庫/服務層變更
- 需要快速回饋

**`npm run test` (完整測試)：**

- 任何後端/資料庫變更
- Supabase schema/migration 變更
- 跨層級變更
- 提交前/PR 前

### 特殊測試

- `./tests/rls/run-rls-tests.sh` - RLS 測試含 Supabase 設定
- `./tests/rls/run-rls-tests.sh --coverage` - RLS 測試含覆蓋率

## 架構概覽

### 技術堆疊

- **Frontend**: React 19 + TypeScript, Vite, Tailwind CSS
- **UI**: shadcn/ui (Radix UI primitives)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Forms**: React Hook Form + Zod validation
- **State**: React Query
- **i18n**: React i18next (中/英)

### Multi-Tenant 架構

教會管理 SaaS 應用：

- 每個教會透過 Supabase RLS 政策隔離資料
- 租戶路由：`/tenant/:tenantId/...`
- 全域路由：租戶選擇和身份驗證
- 完整 RLS 測試確保資料隔離

### 目錄結構

```
src/
├── components/     # UI 元件（按功能分組）
│   ├── Auth/      # 身份驗證
│   ├── Events/    # 活動管理
│   ├── Groups/    # 小組管理
│   ├── Members/   # 成員管理
│   ├── Resources/ # 資源管理
│   ├── Services/  # 服務管理
│   ├── shared/    # 共用元件
│   └── ui/        # shadcn/ui 元件
├── contexts/      # React contexts
├── hooks/         # custom hooks
├── integrations/  # 外部服務整合
│   └── supabase/  # Supabase client/types
├── lib/           # 工具函數和服務
│   └── services/  # 業務邏輯
├── pages/         # 頁面元件
└── main.tsx       # 進入點
```

## 核心模式

### 類型安全

- 資料庫類型：`src/integrations/supabase/types.ts`
- 擴展類型：`src/lib/types.ts`
- 優先檢查現有類型定義
- 使用複合類型處理關聯 (如 `TenantWithUsage`)

### 身份驗證與 Session

- `SessionContext` 提供 user session/profile/auth state
- 所有租戶操作需要身份驗證
- Profile 資料在 auth 狀態變更時自動取得

### 資料存取與 Supabase 整合

- **必須**從 `@/integrations/supabase/client` import
- **絕不**建立新的 Supabase client instances
- 所有資料庫操作在 `src/lib/services/` 執行
- 正確處理 "not found" 錯誤 (code === "PGRST116")
- 使用 try/catch 區塊處理錯誤
- React Query 負責快取和同步

### 表單處理

- **必須**使用 React Hook Form + Zod + zodResolver
- 使用 `zodResolver` from `@hookform/resolvers/zod`
- 定義有意義錯誤訊息的 Zod schemas
- 使用 shadcn Form 元件確保一致 UI
- 處理 loading 狀態和表單提交錯誤

**標準結構：**

```tsx
const formSchema = z.object({
  name: z.string().min(1, "必填"),
});

const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: { name: "" },
});
```

### 國際化

- **替換所有**硬編碼文字為翻譯 keys
- 使用 `useTranslation` hook 搭配指定 namespace
- 可用 namespace: `common`, `auth`, `dashboard`, `members`, `groups`, `resources`, `services`, `events`
- `common` namespace 用於通用 UI 動作 (save, cancel, loading)
- 語法：`t('key')` 單一 namespace，`t('namespace:key')` 多個
- 翻譯檔案位於 `public/locales/[lang]/[namespace].json`

### UI 與樣式

- **必須**使用 Tailwind CSS
- **必須**使用 shadcn/ui 元件作為基礎模板
- **絕不**直接修改 `components/ui/` (shadcn 元件)
- 使用 composition patterns 搭配 shadcn 元件
- 遵循 PascalCase 命名元件檔案和函數
- **絕不**在元件中執行 Supabase 查詢
- **必須**使用 `src/lib/services/` 的服務函數
- 使用 React Query 處理資料取得和快取

### UX 慣例

- **必須**在刪除操作前提示確認
- **清楚警告**確認對話框中的串聯刪除
- CRUD 操作後**自動重新整理**列表/表格
- 表單提交時顯示 loading 狀態
- 操作後顯示成功/錯誤訊息

## 測試策略

### RLS (Row Level Security) 測試

- 位置：`tests/rls/`
- 測試資料庫安全政策和租戶隔離
- 使用真實 Supabase instance 和容器化服務
- 多租戶資料安全的關鍵
- 使用 `createRLSTest()` 和 `createStandardRLSTestSuite()`
- 必須測試：owner 存取、member 限制、租戶隔離
- 必須使用 `try/finally` 區塊清理

### UI 元件測試

- 位置：`tests/ui/`
- 測試元件行為和使用者互動
- Mock 外部相依性以達到隔離
- 使用 React Testing Library patterns
- 使用 `mockUseSessionHelpers.authenticated()` 處理 auth 狀態
- 測試使用者行為，非實作細節
- 使用語意查詢：`getByRole`, `getByLabelText`
- 測試錯誤狀態和 loading 狀態

### 必需覆蓋率

- **新資料庫表格** → 需要 RLS 測試
- **新元件** → 需要 UI 測試
- **鏡像結構**：`src/components/Feature/` → `tests/ui/components/Feature/`

## 開發注意事項

### 環境設定

- 使用 Vite 開發與 HMR
- Tailwind CSS 樣式
- ESLint + Prettier 程式碼品質
- Husky Git hooks

### 資料庫整合

- Supabase migrations 在 `supabase/migrations/`
- Row Level Security 政策強制租戶隔離
- 生成的類型確保前後端類型安全

### 部署

- 設定為 Vercel 部署
- 靜態檔案在 `public/` 目錄
- 建置輸出在 `dist/`

### 重要檔案參考

- `src/integrations/supabase/types.ts` - 資料庫類型
- `src/lib/types.ts` - 擴展應用類型
- `src/contexts/AuthContext.tsx` - 身份驗證 context
- `package.json` - 可用 scripts 和相依性
- `vite.config.ts` - 建置設定
- `tests/README.md` - 完整測試文件
