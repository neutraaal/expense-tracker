import { useState, useEffect } from 'react'

const CATEGORY_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'
]

function fmt(n) {
  return n.toLocaleString('ja-JP') + '円'
}

export default function Dashboard({ year, month }) {
  const [expenses, setExpenses] = useState([])
  const [settlement, setSettlement] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [year, month])

  async function load() {
    setLoading(true)
    const [exp, set] = await Promise.all([
      window.api.expenses.getByMonth(year, month),
      window.api.settlement.calculate(year, month)
    ])
    setExpenses(exp)
    setSettlement(set)
    setLoading(false)
  }

  if (loading) return <div className="empty-state">読み込み中...</div>

  // カテゴリ別集計
  const catMap = {}
  expenses.forEach(e => {
    const key = e.category_name || 'その他'
    catMap[key] = (catMap[key] || 0) + e.amount
  })
  const catData = Object.entries(catMap)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
  const maxAmount = catData[0]?.amount || 1

  // 最近5件
  const recent = expenses.slice(0, 5)

  return (
    <div>
      {/* サマリーカード */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">今月の支出合計</div>
          <div className="stat-value amount">{fmt(settlement?.totalAmount || 0)}</div>
          <div className="stat-sub">{expenses.length}件の支出</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">一人あたりの負担</div>
          <div className="stat-value">{fmt(settlement?.perPerson || 0)}</div>
          <div className="stat-sub">{settlement?.balances?.length || 0}人で分担</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">清算取引数</div>
          <div className="stat-value">
            {settlement?.transactions?.length || 0}
            <span style={{ fontSize: 14, fontWeight: 400 }}> 件</span>
          </div>
          <div className="stat-sub">最小送金回数で最適化</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* カテゴリ別棒グラフ */}
        <div className="card">
          <div className="card-header">カテゴリ別支出</div>
          <div className="card-body">
            {catData.length === 0 ? (
              <div className="empty-state">支出データがありません</div>
            ) : (
              catData.map((c, i) => (
                <div key={c.name} className="chart-row">
                  <div className="chart-label">{c.name}</div>
                  <div className="chart-bar-wrap">
                    <div
                      className="chart-bar"
                      style={{
                        width: `${(c.amount / maxAmount) * 100}%`,
                        background: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
                      }}
                    />
                  </div>
                  <div className="chart-amount">{fmt(c.amount)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 最近の支出 */}
        <div className="card">
          <div className="card-header">最近の支出</div>
          {recent.length === 0 ? (
            <div className="empty-state">支出データがありません</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>カテゴリ</th>
                  <th>支払者</th>
                  <th className="text-right">金額</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(e => (
                  <tr key={e.id}>
                    <td className="text-sm text-muted">{e.date}</td>
                    <td>
                      {e.category_name
                        ? <span className="badge badge-blue">{e.category_name}</span>
                        : <span className="text-muted">-</span>}
                    </td>
                    <td>{e.member_name}</td>
                    <td className="text-right amount-cell">
                      {e.amount.toLocaleString('ja-JP')}円
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
