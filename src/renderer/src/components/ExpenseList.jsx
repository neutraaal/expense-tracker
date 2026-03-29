import { useState, useEffect, useRef } from 'react'

function today() {
  return new Date().toISOString().split('T')[0]
}

// ── ExpenseForm モーダル ───────────────────────────────────────────────────

function ExpenseForm({ expense, members, categories, onSave, onClose }) {
  const [form, setForm] = useState({
    date:        expense?.date        || today(),
    amount:      expense?.amount      || '',
    category_id: expense?.category_id != null ? String(expense.category_id) : (categories[0]?.id != null ? String(categories[0].id) : ''),
    paid_by:     expense?.paid_by     != null ? String(expense.paid_by)     : (members[0]?.id     != null ? String(members[0].id)     : ''),
    memo:        expense?.memo        || ''
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const firstInputRef = useRef(null)

  // 初期フォーカス
  useEffect(() => {
    firstInputRef.current?.focus()
  }, [])

  // Esc キーで閉じる
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }))
  }

  function validate() {
    const errs = {}
    if (!form.date) errs.date = '日付を入力してください'
    if (!form.amount || Number(form.amount) <= 0) errs.amount = '1円以上の金額を入力してください'
    if (!form.paid_by) errs.paid_by = '支払者を選択してください'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setSaving(true)
    const amount     = parseInt(form.amount, 10)
    const categoryId = form.category_id ? parseInt(form.category_id, 10) : null
    const paidBy     = parseInt(form.paid_by, 10)
    const memo       = form.memo.trim() || null

    if (expense) {
      await window.api.expenses.update(expense.id, form.date, amount, categoryId, paidBy, memo)
    } else {
      await window.api.expenses.create(form.date, amount, categoryId, paidBy, memo)
    }
    setSaving(false)
    onSave()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span>{expense ? '支出を編集' : '支出を追加'}</span>
          <button className="btn-icon" onClick={onClose} title="閉じる（Esc）">✕</button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">日付 *</label>
                <input
                  ref={firstInputRef}
                  type="date"
                  className={`form-control${errors.date ? ' is-error' : ''}`}
                  value={form.date}
                  onChange={e => set('date', e.target.value)}
                />
                {errors.date && <div className="form-error">{errors.date}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">金額（円）*</label>
                <input
                  type="number"
                  className={`form-control${errors.amount ? ' is-error' : ''}`}
                  value={form.amount}
                  onChange={e => set('amount', e.target.value)}
                  placeholder="0"
                  min="1"
                />
                {errors.amount && <div className="form-error">{errors.amount}</div>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">カテゴリ</label>
                <select
                  className="form-control"
                  value={form.category_id}
                  onChange={e => set('category_id', e.target.value)}
                >
                  <option value="">なし</option>
                  {categories.map(c => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">支払者 *</label>
                <select
                  className={`form-control${errors.paid_by ? ' is-error' : ''}`}
                  value={form.paid_by}
                  onChange={e => set('paid_by', e.target.value)}
                >
                  <option value="">選択してください</option>
                  {members.map(m => (
                    <option key={m.id} value={String(m.id)}>{m.name}</option>
                  ))}
                </select>
                {errors.paid_by && <div className="form-error">{errors.paid_by}</div>}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">メモ</label>
              <input
                type="text"
                className="form-control"
                value={form.memo}
                onChange={e => set('memo', e.target.value)}
                placeholder="任意"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── ソートアイコン ─────────────────────────────────────────────────────────

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <span className="sort-icon">↕</span>
  return <span className="sort-icon active">{sortDir === 'asc' ? '↑' : '↓'}</span>
}

// ── 支出一覧 ──────────────────────────────────────────────────────────────

export default function ExpenseList({ year, month }) {
  const [expenses, setExpenses]     = useState([])
  const [members, setMembers]       = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editing, setEditing]       = useState(null)

  // フィルタ・検索
  const [filterMember, setFilterMember]     = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [searchText, setSearchText]         = useState('')

  // ソート
  const [sortField, setSortField] = useState('date')
  const [sortDir, setSortDir]     = useState('desc')

  useEffect(() => {
    loadAll()
  }, [year, month])

  async function loadAll() {
    setLoading(true)
    const [exp, mem, cat] = await Promise.all([
      window.api.expenses.getByMonth(year, month),
      window.api.members.getAll(),
      window.api.categories.getAll()
    ])
    setExpenses(exp)
    setMembers(mem)
    setCategories(cat)
    setLoading(false)
  }

  async function reloadExpenses() {
    const exp = await window.api.expenses.getByMonth(year, month)
    setExpenses(exp)
  }

  async function handleDelete(id) {
    if (!confirm('この支出を削除しますか？')) return
    await window.api.expenses.delete(id)
    await reloadExpenses()
  }

  function openAdd() {
    if (members.length === 0) {
      alert('メンバーを先に追加してください')
      return
    }
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(expense) {
    setEditing(expense)
    setShowForm(true)
  }

  async function handleSave() {
    setShowForm(false)
    setEditing(null)
    await reloadExpenses()
  }

  function toggleSort(field) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  function clearFilters() {
    setFilterMember('')
    setFilterCategory('')
    setSearchText('')
  }

  // フィルタ・検索・ソート適用
  const filtered = expenses
    .filter(e => !filterMember   || String(e.paid_by)     === filterMember)
    .filter(e => !filterCategory || String(e.category_id) === filterCategory)
    .filter(e => !searchText     || (e.memo || '').toLowerCase().includes(searchText.toLowerCase()))
    .sort((a, b) => {
      let va = a[sortField], vb = b[sortField]
      if (sortField === 'date') { va = a.date; vb = b.date }
      if (sortField === 'amount') { va = a.amount; vb = b.amount }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const hasFilter = filterMember || filterCategory || searchText
  const total = filtered.reduce((s, e) => s + e.amount, 0)

  if (loading) return <div className="empty-state">読み込み中...</div>

  return (
    <div>
      <div className="card">
        {/* ヘッダー */}
        <div className="card-header">
          <span>
            {year}年{month}月の支出
          </span>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            + 支出を追加
          </button>
        </div>

        {/* フィルタバー */}
        <div className="filter-bar">
          <select
            className="form-control"
            value={filterMember}
            onChange={e => setFilterMember(e.target.value)}
          >
            <option value="">すべてのメンバー</option>
            {members.map(m => (
              <option key={m.id} value={String(m.id)}>{m.name}</option>
            ))}
          </select>

          <select
            className="form-control"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="">すべてのカテゴリ</option>
            {categories.map(c => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>

          <div className="filter-search">
            <span className="filter-search-icon">&#128269;</span>
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="メモを検索..."
            />
          </div>

          {hasFilter && (
            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
              クリア
            </button>
          )}

          <span className="filter-count">
            {filtered.length}件
            {hasFilter && ` / ${expenses.length}件中`}
            {filtered.length > 0 && `・${total.toLocaleString('ja-JP')}円`}
          </span>
        </div>

        {/* テーブル */}
        {expenses.length === 0 ? (
          <div className="empty-state">
            <div>支出データがありません</div>
            <div className="mt-2">
              <button className="btn btn-primary" onClick={openAdd}>最初の支出を追加</button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div>条件に一致する支出がありません</div>
            <div className="mt-2">
              <button className="btn btn-secondary" onClick={clearFilters}>フィルタをクリア</button>
            </div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th
                  className="sortable"
                  onClick={() => toggleSort('date')}
                >
                  日付 <SortIcon field="date" sortField={sortField} sortDir={sortDir} />
                </th>
                <th>カテゴリ</th>
                <th>支払者</th>
                <th>メモ</th>
                <th
                  className="sortable text-right"
                  onClick={() => toggleSort('amount')}
                >
                  金額 <SortIcon field="amount" sortField={sortField} sortDir={sortDir} />
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td className="text-sm text-muted">{e.date}</td>
                  <td>
                    {e.category_name
                      ? <span className="badge badge-blue">{e.category_name}</span>
                      : <span className="text-muted">-</span>}
                  </td>
                  <td>{e.member_name}</td>
                  <td className="text-sm text-muted">{e.memo || '-'}</td>
                  <td className="text-right amount-cell">
                    {e.amount.toLocaleString('ja-JP')}円
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn-icon" onClick={() => openEdit(e)} title="編集">✎</button>
                      <button
                        className="btn-icon"
                        onClick={() => handleDelete(e.id)}
                        title="削除"
                        style={{ color: '#dc2626' }}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <ExpenseForm
          expense={editing}
          members={members}
          categories={categories}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
