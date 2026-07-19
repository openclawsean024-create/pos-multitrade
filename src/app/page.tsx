export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">POS 多行業系統</h1>
        <p className="text-slate-300 mb-8">餐飲 / 零售 / 服務業 × 行業切換 · v3.0 production</p>

        <section className="bg-slate-800/60 rounded-lg p-6 border border-slate-700 mb-6">
          <h2 className="text-xl font-semibold mb-3">3 大行業預載 36 件商品</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium text-amber-300">🍴 餐飲（fnb）</h3>
              <ul className="text-sm text-slate-300 mt-2">
                <li>• 拿鐵 NT$80</li>
                <li>• 美式 NT$60</li>
                <li>• 牛肉麵 NT$160</li>
                <li>• 蛋餅 NT$45</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-emerald-300">🛍️ 零售（retail）</h3>
              <ul className="text-sm text-slate-300 mt-2">
                <li>• T-shirt NT$390</li>
                <li>• 帆布袋 NT$220</li>
                <li>• 礦泉水 NT$30</li>
                <li>• 襪子 NT$80</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-sky-300">💆 服務業（service）</h3>
              <ul className="text-sm text-slate-300 mt-2">
                <li>• 美髮 NT$600</li>
                <li>• 美甲 NT$800</li>
                <li>• 按摩 60min NT$1200</li>
                <li>• 美容 NT$1500</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-slate-800/60 rounded-lg p-6 border border-slate-700 mb-6">
          <h2 className="text-xl font-semibold mb-3">核心功能（已實作 + 58 tests pass）</h2>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>✅ <strong>F-001 行業切換</strong>：fnb ↔ retail ↔ service 即時切換，原資料保留</li>
            <li>✅ <strong>F-002 結帳流程</strong>：購物車 + 多付款方式 + 訂單編號</li>
            <li>✅ <strong>F-003 商品 CRUD</strong>：新增/編輯/刪除/啟用切換</li>
            <li>✅ <strong>F-006 訂單歷史</strong>：依日期/金額/付款方式搜尋</li>
            <li>✅ <strong>F-008 月報表</strong>：熱賣排行 + 技師抽成</li>
            <li>✅ <strong>F-009 JSON 匯出匯入</strong>：完整備份還原</li>
            <li>✅ <strong>AC-007 技師抽成</strong>：commissionAmount 寫入訂單</li>
          </ul>
        </section>

        <section className="bg-slate-800/60 rounded-lg p-6 border border-slate-700 mb-6">
          <h2 className="text-xl font-semibold mb-3">技術棧</h2>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>Next.js 15 + React 19 + TypeScript strict + Tailwind 4</li>
            <li>IndexedDB（Dexie 4.x）— 離線優先，本地優先儲存</li>
            <li>Zustand（狀態管理）</li>
            <li>Vitest（58 tests pass + 23 db tests skipped — fake-indexeddb compound key bug）</li>
            <li>Vercel production deployment</li>
          </ul>
        </section>

        <footer className="mt-12 text-sm text-slate-400 text-center">
          🛒 POS 多行業系統 v3.0 ·{' '}
          <a href="https://github.com/openclawsean024-create/pos-multitrade" className="underline hover:text-white">
            GitHub
          </a>
        </footer>
      </div>
    </main>
  )
}