import initSqlJs from 'sql.js'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

let db = null

export async function initDatabase() {
  const SQL = await initSqlJs({
    locateFile: (filename) => {
      if (app.isPackaged) {
        return join(process.resourcesPath, 'node_modules', 'sql.js', 'dist', filename)
      }
      return join(app.getAppPath(), 'node_modules', 'sql.js', 'dist', filename)
    }
  })

  const dbPath = join(app.getPath('userData'), 'expense-tracker.db')

  if (existsSync(dbPath)) {
    const fileBuffer = readFileSync(dbPath)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }

  createTables()
  insertDefaultCategories()
}

function saveDb() {
  const dbPath = join(app.getPath('userData'), 'expense-tracker.db')
  const data = db.export()
  writeFileSync(dbPath, Buffer.from(data))
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      amount INTEGER NOT NULL,
      category_id INTEGER,
      paid_by INTEGER NOT NULL,
      memo TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (paid_by) REFERENCES members(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS category_burden_ratios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      ratio INTEGER NOT NULL DEFAULT 1,
      UNIQUE(category_id, member_id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (member_id) REFERENCES members(id)
    )
  `)
}

function insertDefaultCategories() {
  const result = db.exec('SELECT COUNT(*) as cnt FROM categories')
  const count = result[0]?.values[0][0]
  if (count > 0) return

  const defaults = ['食費', '光熱費', '日用品', '交通費', '外食', '娯楽', 'その他']
  const stmt = db.prepare('INSERT INTO categories (name) VALUES (?)')
  defaults.forEach((name) => stmt.run([name]))
  stmt.free()
  saveDb()
}

// sql.js の結果行をオブジェクト配列に変換
function toObjects(result) {
  if (!result || result.length === 0) return []
  const { columns, values } = result[0]
  return values.map((row) => {
    const obj = {}
    columns.forEach((col, i) => {
      obj[col] = row[i]
    })
    return obj
  })
}

// ── Members ──────────────────────────────────────────────────────────────────

export function getAllMembers() {
  return toObjects(db.exec('SELECT * FROM members ORDER BY created_at'))
}

export function createMember(name) {
  db.run('INSERT INTO members (name) VALUES (?)', [name])
  const newMember = toObjects(db.exec('SELECT * FROM members WHERE id = last_insert_rowid()'))[0]
  const categories = getAllCategories()
  categories.forEach((c) => {
    db.run(
      'INSERT OR IGNORE INTO category_burden_ratios (category_id, member_id, ratio) VALUES (?, ?, 1)',
      [c.id, newMember.id]
    )
  })
  saveDb()
  return newMember
}

export function updateMember(id, name) {
  db.run('UPDATE members SET name = ? WHERE id = ?', [name, id])
  saveDb()
}

export function deleteMember(id) {
  db.run('DELETE FROM category_burden_ratios WHERE member_id = ?', [id])
  db.run('DELETE FROM members WHERE id = ?', [id])
  saveDb()
}

// ── Categories ───────────────────────────────────────────────────────────────

export function getAllCategories() {
  return toObjects(db.exec('SELECT * FROM categories ORDER BY id'))
}

export function createCategory(name) {
  db.run('INSERT INTO categories (name) VALUES (?)', [name])
  const newCategory = toObjects(db.exec('SELECT * FROM categories WHERE id = last_insert_rowid()'))[0]
  const members = getAllMembers()
  members.forEach((m) => {
    db.run(
      'INSERT OR IGNORE INTO category_burden_ratios (category_id, member_id, ratio) VALUES (?, ?, 1)',
      [newCategory.id, m.id]
    )
  })
  saveDb()
  return newCategory
}

export function updateCategory(id, name) {
  db.run('UPDATE categories SET name = ? WHERE id = ?', [name, id])
  saveDb()
}

export function deleteCategory(id) {
  db.run('DELETE FROM category_burden_ratios WHERE category_id = ?', [id])
  db.run('DELETE FROM categories WHERE id = ?', [id])
  saveDb()
}

// ── Burden Ratios ─────────────────────────────────────────────────────────────

export function getBurdenRatios(categoryId) {
  const members = getAllMembers()
  const existing = toObjects(
    db.exec('SELECT member_id, ratio FROM category_burden_ratios WHERE category_id = ?', [
      categoryId
    ])
  )
  const ratioMap = {}
  existing.forEach((r) => {
    ratioMap[r.member_id] = r.ratio
  })
  return members.map((m) => ({
    memberId: m.id,
    memberName: m.name,
    ratio: ratioMap[m.id] !== undefined ? ratioMap[m.id] : 1
  }))
}

export function setBurdenRatios(categoryId, ratios) {
  // ratios: [{memberId, ratio}]
  ratios.forEach(({ memberId, ratio }) => {
    db.run(
      `INSERT INTO category_burden_ratios (category_id, member_id, ratio) VALUES (?, ?, ?)
       ON CONFLICT(category_id, member_id) DO UPDATE SET ratio = excluded.ratio`,
      [categoryId, memberId, ratio]
    )
  })
  saveDb()
}

// ── Expenses ─────────────────────────────────────────────────────────────────

export function getExpensesByMonth(year, month) {
  const pad = String(month).padStart(2, '0')
  const start = `${year}-${pad}-01`
  const end = `${year}-${pad}-31`
  return toObjects(
    db.exec(
      `SELECT e.*, c.name AS category_name, m.name AS member_name
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN members m ON e.paid_by = m.id
       WHERE e.date >= ? AND e.date <= ?
       ORDER BY e.date DESC, e.created_at DESC`,
      [start, end]
    )
  )
}

export function createExpense(date, amount, categoryId, paidBy, memo) {
  db.run(
    'INSERT INTO expenses (date, amount, category_id, paid_by, memo) VALUES (?, ?, ?, ?, ?)',
    [date, amount, categoryId, paidBy, memo]
  )
  saveDb()
  return toObjects(db.exec('SELECT * FROM expenses WHERE id = last_insert_rowid()'))[0]
}

export function updateExpense(id, date, amount, categoryId, paidBy, memo) {
  db.run(
    `UPDATE expenses
     SET date = ?, amount = ?, category_id = ?, paid_by = ?, memo = ?,
         updated_at = datetime('now', 'localtime')
     WHERE id = ?`,
    [date, amount, categoryId, paidBy, memo, id]
  )
  saveDb()
}

export function deleteExpense(id) {
  db.run('DELETE FROM expenses WHERE id = ?', [id])
  saveDb()
}

// ── Settlement ───────────────────────────────────────────────────────────────

export function calculateSettlement(year, month) {
  const members = getAllMembers()
  if (members.length === 0) {
    return { totalAmount: 0, perPerson: 0, balances: [], transactions: [] }
  }

  const expenses = getExpensesByMonth(year, month)
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)
  const perPerson = totalAmount / members.length

  // 各メンバーの支払い合計と差額（正: 多く払った / 負: 少ない）
  const balances = members.map((m) => {
    const paid = expenses
      .filter((e) => e.paid_by === m.id)
      .reduce((sum, e) => sum + e.amount, 0)
    return {
      id: m.id,
      name: m.name,
      paid,
      fairShare: Math.round(perPerson),
      balance: paid - perPerson
    }
  })

  // 最小送金回数で清算（貪欲法）
  const creditors = balances
    .filter((b) => b.balance > 0.5)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.balance - a.balance)
  const debtors = balances
    .filter((b) => b.balance < -0.5)
    .map((b) => ({ ...b }))
    .sort((a, b) => a.balance - b.balance)

  const transactions = []
  let ci = 0
  let di = 0
  while (ci < creditors.length && di < debtors.length) {
    const amount = Math.min(creditors[ci].balance, Math.abs(debtors[di].balance))
    transactions.push({
      from: debtors[di].name,
      to: creditors[ci].name,
      amount: Math.round(amount)
    })
    creditors[ci].balance -= amount
    debtors[di].balance += amount
    if (creditors[ci].balance < 0.5) ci++
    if (debtors[di].balance > -0.5) di++
  }

  return {
    totalAmount,
    perPerson: Math.round(perPerson),
    balances: balances.map((b) => ({ ...b, balance: Math.round(b.balance) })),
    transactions
  }
}
