# POS Multi-Trade 競品對標

> 研究日期：2026-09-24｜用途：v1 UI prototype 設計依據

## 現況判讀

Notion canonical Project DB 的「POS 系統（行業切換）」對應 `pos-multitrade`，定位是台灣微型店家的餐飲／零售／服務三模板 POS。現行 production 首頁是功能清單與技術狀態頁；既有 `dashboard.html` 是通用儀表板，未把收銀流程做成主要工作面。

## 對標摘要

| 產品 | 官方頁面可確認的強項 | 對本專案的設計啟示 | 本版取捨 |
|---|---|---|---|
| iCHEF | 餐飲專業、掃碼／LINE／外送接單、加購推薦、庫存、對帳與工時；官網標示月費 NT$1,950 起 | 餐飲 POS 應該以尖峰快速點單為核心，常用加購與營運狀態要在同一工作面出現 | v1 不宣稱外送、發票或硬體整合；保留清楚的加購／客製化入口 |
| Shopify POS | 單店／多店／外出銷售、統一後台、商品／訂單／客戶／員工／庫存與報表 | 將「日常收銀」與「營運管理」放在同一資訊架構，並讓分店／行業狀態一直可見 | v1 維持 local-first，不模擬雲端同步與全通路 |
| Square POS | 模式化功能、custom item grid、商品 modifier、低庫存提醒、退款與多通路銷售 | 商品格應可依行業切換欄位與分類；卡片操作要快、 modifier 要靠近購物車 | v1 以台灣 NTD 與現金／信用卡／電子支付為示意，不宣稱 Square 的硬體能力 |
| Lightspeed Retail | 多地點／倉庫庫存、供應商、即時報表、跨通路資料與 onboarding | 儀表板要顯示低庫存、今日表現與最近訂單，而不是只有漂亮 KPI | 多店與供應商列為後續 scope，不放入假功能按鈕 |

## 國際化產品化補強

Shopify 的官方頁面明確把單店、多店、外出銷售、後台、POS、線上銷售與多國語系／地區選擇放在同一產品敘事裡；因此 v2 prototype 不再只呈現「台灣單店 + emoji 商品」，而是把 workspace、channel、locale、currency 與 business profile 做成可延伸的 UI contract。這些入口目前只是 prototype 狀態，不代表已實作同步、支付或稅務。

Square 的官方 POS 內容把 custom item grid、modifier、低庫存、退款與不同 business mode 視為同一個操作系統；Lightspeed 則將多地點、供應商、即時報表、庫存和 onboarding 放入統一的 retail console。v2 因此加入 signal board、live activity、catalog mode 與 customer／channel 入口，而不是只增加裝飾性 KPI。

## UI 決策

1. **收銀台優先**：預設進入「收銀台」，商品網格與購物車同屏，符合 iCHEF／Square 的高頻操作邏輯。
2. **行業切換是產品主角**：三個行業以固定 segmented control 呈現；切換對話框說明「資料保留 + snapshot」，把本專案真正的差異化變成可理解的操作。
3. **營運訊號不離開收銀台**：今日營業額、待處理訂單、低庫存與離線狀態放在同一首屏，借鏡 Shopify／Lightspeed 的 unified back office，但不虛構雲端整合。
4. **少一層導航**：以「收銀台／訂單／商品／報表」四個工作區取代原型中的泛用「首頁／行程／最近動態」；POS 使用者不需要先穿過 dashboard 才能結帳。
5. **國際化 shell**：導覽採英中雙語 microcopy，商品不依賴 emoji；workspace、channel、locale、currency 的位置固定，未來可接多地點與多語系資料模型。
6. **透明的產品邊界**：明示「本機儲存」「離線可結帳」「snapshot」，不把未實作的帳號、多店、硬體、線上訂單或支付 provider 做成假功能。

## 來源

- [iCHEF 官方 POS](https://www.ichefpos.com/)：餐飲 POS、加購推薦、庫存、對帳、工時與價格資訊。
- [Shopify POS 官方頁](https://www.shopify.com/pos)：統一後台、多店、商品／訂單／客戶／員工／庫存與報表。
- [Square POS 官方頁](https://squareup.com/us/en/point-of-sale)：模式、custom item grid、modifier、低庫存、退款與多通路能力。
- [Lightspeed Retail 官方頁](https://www.lightspeedhq.com/pos/retail/)：多地點庫存、供應商、即時報表與跨通路管理。
- [POS Multi-Trade production](https://pos-multitrade.vercel.app/)：現行 production 首頁與功能狀態。
