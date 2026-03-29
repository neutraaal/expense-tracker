import { ipcMain } from 'electron'
import {
  getAllMembers,
  createMember,
  updateMember,
  deleteMember,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getExpensesByMonth,
  createExpense,
  updateExpense,
  deleteExpense,
  calculateSettlement
} from './database'

export function registerIpcHandlers() {
  // ── Members ────────────────────────────────────────────────────────────────
  ipcMain.handle('members:getAll', () => getAllMembers())
  ipcMain.handle('members:create', (_, name) => createMember(name))
  ipcMain.handle('members:update', (_, id, name) => updateMember(id, name))
  ipcMain.handle('members:delete', (_, id) => deleteMember(id))

  // ── Categories ─────────────────────────────────────────────────────────────
  ipcMain.handle('categories:getAll', () => getAllCategories())
  ipcMain.handle('categories:create', (_, name) => createCategory(name))
  ipcMain.handle('categories:update', (_, id, name) => updateCategory(id, name))
  ipcMain.handle('categories:delete', (_, id) => deleteCategory(id))

  // ── Expenses ───────────────────────────────────────────────────────────────
  ipcMain.handle('expenses:getByMonth', (_, year, month) => getExpensesByMonth(year, month))
  ipcMain.handle('expenses:create', (_, date, amount, categoryId, paidBy, memo) =>
    createExpense(date, amount, categoryId, paidBy, memo)
  )
  ipcMain.handle('expenses:update', (_, id, date, amount, categoryId, paidBy, memo) =>
    updateExpense(id, date, amount, categoryId, paidBy, memo)
  )
  ipcMain.handle('expenses:delete', (_, id) => deleteExpense(id))

  // ── Settlement ─────────────────────────────────────────────────────────────
  ipcMain.handle('settlement:calculate', (_, year, month) => calculateSettlement(year, month))
}
