import { useState, useEffect } from 'react'

export default function MemberManager() {
  const [members, setMembers]   = useState([])
  const [newName, setNewName]   = useState('')
  const [editId, setEditId]     = useState(null)
  const [editName, setEditName] = useState('')
  const [loading, setLoading]   = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await window.api.members.getAll()
    setMembers(data)
    setLoading(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    await window.api.members.create(name)
    setNewName('')
    await load()
  }

  function startEdit(m) {
    setEditId(m.id)
    setEditName(m.name)
  }

  async function handleUpdate(e) {
    e.preventDefault()
    const name = editName.trim()
    if (!name) return
    await window.api.members.update(editId, name)
    setEditId(null)
    await load()
  }

  async function handleDelete(id) {
    if (!confirm('このメンバーを削除しますか？\n関連する支出データは残ります。')) return
    await window.api.members.delete(id)
    await load()
  }

  if (loading) return <div className="empty-state">読み込み中...</div>

  return (
    <div style={{ maxWidth: 520 }}>
      <div className="card">
        <div className="card-header">メンバー一覧</div>

        {members.length === 0 && (
          <div className="empty-state">メンバーが登録されていません</div>
        )}

        {members.map(m => (
          <div key={m.id} className="list-item">
            {editId === m.id ? (
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
                <span className="list-item-name">{m.name}</span>
                <div className="actions">
                  <button
                    className="btn-icon"
                    onClick={() => startEdit(m)}
                    title="編集"
                  >
                    ✎
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleDelete(m.id)}
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
              placeholder="メンバー名を入力"
            />
            <button type="submit" className="btn btn-primary btn-sm">追加</button>
          </form>
        </div>
      </div>
    </div>
  )
}
