import { useState, useEffect } from 'react'

export default function CategoryManager() {
  const [categories, setCategories] = useState([])
  const [newName, setNewName]       = useState('')
  const [editId, setEditId]         = useState(null)
  const [editName, setEditName]     = useState('')
  const [loading, setLoading]       = useState(true)

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
    await load()
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
          <div key={c.id} className="list-item">
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
