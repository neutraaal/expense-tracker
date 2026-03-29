import { useState } from 'react'
import Dashboard from './components/Dashboard'
import ExpenseList from './components/ExpenseList'
import Settlement from './components/Settlement'
import MemberManager from './components/MemberManager'
import CategoryManager from './components/CategoryManager'

const PAGES = {
  dashboard:  { label: 'ダッシュボード', hasMonthNav: true },
  expenses:   { label: '支出一覧',       hasMonthNav: true },
  settlement: { label: '月次清算',       hasMonthNav: true },
  members:    { label: 'メンバー管理',   hasMonthNav: false },
  categories: { label: 'カテゴリ管理',   hasMonthNav: false },
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(3)

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  function renderContent() {
    switch (page) {
      case 'dashboard':  return <Dashboard year={year} month={month} />
      case 'expenses':   return <ExpenseList year={year} month={month} />
      case 'settlement': return <Settlement year={year} month={month} />
      case 'members':    return <MemberManager />
      case 'categories': return <CategoryManager />
      default:           return null
    }
  }

  const pageInfo = PAGES[page]

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">支出管理</div>
        <nav className="sidebar-nav">
          {Object.entries(PAGES).map(([id, info]) => (
            <div
              key={id}
              className={`nav-item${page === id ? ' active' : ''}`}
              onClick={() => setPage(id)}
            >
              {info.label}
            </div>
          ))}
        </nav>
      </aside>

      <div className="main-content">
        <div className="top-bar">
          <h1 className="page-title">{pageInfo.label}</h1>
          {pageInfo.hasMonthNav && (
            <div className="month-nav">
              <button className="month-nav-btn" onClick={prevMonth}>‹</button>
              <span className="month-label">{year}年{month}月</span>
              <button className="month-nav-btn" onClick={nextMonth}>›</button>
            </div>
          )}
        </div>
        <div className="page-content">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
