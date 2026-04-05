import { useState, useEffect } from 'react'

export default function CategoryManager() {
  const [categories, setCategories] = useState([])
  const [newName, setNewName]       = useState('')
  const [editId, setEditId]         = useState(null)
  const [editName, setEditName]     = useState('')
  const [loading, setLoading]       = useState(true)

  // 負担割合編集用 state
  const [ratioEditId, setRatioEditId]   = useState(null)  // 展開中カテゴリ ID
  const [ratioValues, setRatioValues]   = useState({})    // { memberId: ratio }
  const [ratioMembers, setRatioMembers] = useState([])    // [{memberId, memberName, ratio}]
  const [ratioLoading, setRatioLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await window.api.categories.getAll()
    setCategories(data)
    setLoading(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    await window.api.categories.create(name)
    setNewName('')
    await load()
  }

  function startEdit(c) {
    setEditId(c.id)
    setEditName(c.name)
    // 別カテゴリの負担割合編集を閉じる
    if (ratioEditId !== null) setRatioEditId(null)
  }

  async function handleUpdate(e) {
    e.preventDefault()
    const name = editName.trim()
    if (!name) return
    await window.api.categories.update(editId, name)
    setEditId(null)
    await load()
  }

  async function handleDelete(id) {
    if (!confirm('このカテゴリを削除しますか？\n関連する支出のカテゴリが未設定になります。')) return
    await window.api.categories.delete(id)
    if (ratioEditId === id) setRatioEditId(null)
    await load()
  }

  async function toggleRatioEdit(categoryId) {
    if (ratioEditId === categoryId) {
      setRatioEditId(null)
      return
    }
    // 名前編集を閉じる
    setEditId(null)
    setRatioLoading(true)
    setRatioEditId(categoryId)
    const data = await window.api.categories.getBurdenRatios(categoryId)
    const values = {}
    data.forEach((r) => { values[r.memberId] = String(r.ratio) })
    setRatioMembers(data)
    setRatioValues(values)
    setRatioLoading(false)
  }

  async function handleSaveRatios(e) {
    e.preventDefault()
    const ratios = ratioMembers.map((m) => ({
      memberId: m.memberId,
      ratio: Math.max(1, parseInt(ratioValues[m.memberId], 10) || 1)
    }))
    await window.api.categories.setBurdenRatios(ratioEditId, ratios)
    setRatioEditId(null)
  }

  function handleRatioChange(memberId, value) {
    setRatioValues((prev) => ({ ...prev, [memberId]: value }))
  }

  if (loading) return <div className="empty-state">読み込み中...</div>

  return (
    <div style={{ maxWidth: 520 }}>
      <div className="card">
        <div className="card-header">カテゴリ一覧</div>

        {categories.length === 0 && (
          <div className="empty-state">カテゴリが登録されていません</div>
        )}

        {categories.map(c => (
          <div key={c.id}>
            <div className="list-item">
              {editId === c.id ? (
                <form className="inline-form" onSubmit={handleUpdate}>
                  <input
                    type="text"
                    className="form-control"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-primary btn-sm">保存</button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEditId(null)}
                  >
                    キャンセル
                  </button>
                </form>
              ) : (
                <>
                  <span className="list-item-name">
                    <span className="badge badge-blue" style={{ marginRight: 8 }}>{c.name}</span>
                  </span>
                  <div className="actions">
                    <button
                      className="btn-icon"
                      onClick={() => toggleRatioEdit(c.id)}
                      title="負担割合"
                      style={{ color: ratioEditId === c.id ? '#2563eb' : undefined }}
                    >
                      ⚖
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => startEdit(c)}
                      title="編集"
                    >
                      ✎
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => handleDelete(c.id)}
                      title="削除"
                      style={{ color: '#dc2626' }}
                    >
                      ✕
                    </button>
                  </div>
                </>
              )}
            </div>

            {ratioEditId === c.id && (
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#475569' }}>
                  負担割合（整数比）
                </div>
                {ratioLoading ? (
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>読み込み中...</div>
                ) : ratioMembers.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>メンバーが登録されていません</div>
                ) : (
                  <form onSubmit={handleSaveRatios}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                      {ratioMembers.map((m) => (
                        <div key={m.memberId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ minWidth: 80, fontSize: 14 }}>{m.memberName}</span>
                          <input
                            type="number"
                            min={1}
                            className="form-control"
                            style={{ width: 80 }}
                            value={ratioValues[m.memberId] ?? '1'}
                            onChange={(e) => handleRatioChange(m.memberId, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" className="btn btn-primary btn-sm">保存</button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setRatioEditId(null)}
                      >
                        キャンセル
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="add-row">
          <form className="inline-form" onSubmit={handleAdd}>
            <input
              type="text"
              className="form-control"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="カテゴリ名を入力"
            />
            <button type="submit" className="btn btn-primary btn-sm">追加</button>
          </form>
        </div>
      </div>
    </div>
  )
}
