import { useState, useEffect } from 'react'

function fmt(n) {
  return n.toLocaleString('ja-JP') + '円'
}

export default function Settlement({ year, month }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [year, month])

  async function load() {
    setLoading(true)
    const result = await window.api.settlement.calculate(year, month)
    setData(result)
    setLoading(false)
  }

  if (loading) return <div className="empty-state">計算中...</div>

  if (!data || data.balances.length === 0) {
    return (
      <div className="empty-state">
        メンバーが登録されていません。<br />
        先にメンバー管理でメンバーを追加してください。
      </div>
    )
  }

  return (
    <div>
      {/* サマリー */}
      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-label">支出合計</div>
          <div className="stat-value amount">{fmt(data.totalAmount)}</div>
          <div className="stat-sub">{data.balances.length}人で分担</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">一人あたり</div>
          <div className="stat-value">{fmt(data.perPerson)}</div>
          <div className="stat-sub">均等割り</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">清算取引数</div>
          <div className="stat-value">
            {data.transactions.length}
            <span style={{ fontSize: 14, fontWeight: 400 }}> 件</span>
          </div>
          <div className="stat-sub">最小送金回数</div>
        </div>
      </div>

      <div className="settlement-grid">
        {/* メンバー別収支 */}
        <div className="card">
          <div className="card-header">メンバー別収支</div>
          <div className="card-body">
            {data.balances.map(b => (
              <div key={b.id} className="balance-row">
                <div>
                  <div style={{ fontWeight: 500 }}>{b.name}</div>
                  <div className="text-sm text-muted">
                    支払: {fmt(b.paid)} / 負担: {fmt(b.fairShare)}
                  </div>
                </div>
                <div className={b.balance >= 0 ? 'balance-positive' : 'balance-negative'}>
                  {b.balance >= 0 ? `+${fmt(b.balance)}` : fmt(b.balance)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 清算方法 */}
        <div className="card">
          <div className="card-header">清算方法</div>
          <div className="card-body">
            {data.transactions.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                清算不要です
              </div>
            ) : (
              data.transactions.map((t, i) => (
                <div key={i} className="transaction-item">
                  <span style={{ fontWeight: 600 }}>{t.from}</span>
                  <span className="transaction-arrow">→</span>
                  <span style={{ fontWeight: 600 }}>{t.to}</span>
                  <span className="transaction-amount">{fmt(t.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
