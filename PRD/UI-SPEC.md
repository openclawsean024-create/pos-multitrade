# POS Multi-Trade UI-SPEC v2 prototype

> 2026-09-24｜本文件只約束視覺原型，不改正式 React。

## 目標

讓微型店家與跨境商戶在首次進入後，能一眼理解「目前 workspace／通路／行業 profile」、快速加入商品、看到購物車並完成結帳；行業切換必須讓資料保留與 snapshot 保護可被理解。視覺不再是地方型單店後台，而是可延伸到多店、通路、locale 與 currency 的 commerce console。

## 版面

- 桌面：左側 250px command rail；右側工作區；收銀台採「商品區 1fr + 購物車 385px」雙欄。
- 平板：rail 收合，工作區維持商品／購物車雙欄。
- 手機：商品區在上、購物車在下；底部導覽只保留核心工作區。
- 首屏順序：workspace／locale／channel → 商業 profile → KPI → 收銀台 → live activity／signal board。

## 視覺語言

- 淺灰工作區 `#F7F8FA`、深 navy command rail `#0A1020`、electric indigo `#5B6CFF`、acid lime `#D5FF57`。
- 商品卡使用短 code 與色塊，而非 emoji 或假照片；視覺可跨語系、跨產業而不依賴特定地區符號。
- 使用系統字體，不依賴 CDN；數字使用等寬 fallback，避免外部資源造成 prototype 失效。
- 以 command rail、context bar、bento metrics 與 checkout panel 建立較成熟的 commerce console 語言；避免泛用 SaaS 行事曆、裝飾性時間軸與過度圓角。

## 互動驗收

- 點擊三個行業按鈕，先開啟切換 modal；modal 顯示「目前資料會保留」與 snapshot；確認後更新 accent、商品、分類、營運文案與 active label。
- 點擊商品卡加入購物車；購物車數量可增減；小計與總額會更新。
- 點擊付款方式，再點「完成結帳」；顯示成功 toast、清空購物車、增加今日訂單數與最近訂單。
- 點擊左側工作區，active state 與 toast 變更；prototype 不假裝已切換真實頁面。
- 點擊「備份 JSON」或「查看 snapshot」顯示 prototype 狀態提示，不觸發真實下載或破壞性操作。
- 點擊 locale、channel、customer、catalog、activity 顯示產品化入口提示；prototype 不假裝已完成後端整合。
- 按 `/` 聚焦搜尋、按 `Esc` 關閉 modal；可及性樹提供 navigation、dialog、status、label。

## 邊界

- 本 prototype 使用 seed data，不能作為 IndexedDB／Dexie 已驗證的證據。
- 不實作登入、雲端同步、支付串接、電子發票、外送、硬體或多店管理。
- locale／currency／channel 是產品化入口的 UI contract；實際匯率、稅務、支付 provider、權限與同步策略要在正式規格另行定義。
- 此版本交由 Sean 進行設計 gate；Sean 確認前不進入正式 React coding，也不外派 MiniMax。
