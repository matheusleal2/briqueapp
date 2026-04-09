// Currency formatter (pt-BR, BRL)
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Percentage formatter
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

// Date formatter (pt-BR)
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

// Number formatter (quantity)
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

// Class merge helper
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Profit calculation
export function calcProfit(salePrice: number, costPrice: number, qty: number, discount = 0): number {
  const revenue = salePrice * qty - discount
  const cost = costPrice * qty
  return revenue - cost
}

export function calcMargin(salePrice: number, costPrice: number): number {
  if (salePrice === 0) return 0
  return ((salePrice - costPrice) / salePrice) * 100
}

// Truncate text
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen) + '…'
}

// Generate SKU from name
export function generateSKU(name: string): string {
  const prefix = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4)
  const suffix = Math.floor(Math.random() * 9000 + 1000)
  return `${prefix}-${suffix}`
}
