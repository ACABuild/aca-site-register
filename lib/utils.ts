import { clsx, type ClassValue } from 'clsx'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'dd/MM/yyyy h:mm a')
}

export function formatDateShort(date: string | Date) {
  return format(new Date(date), 'dd/MM/yyyy')
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export const TRADE_TYPES = [
  'Carpenter',
  'Electrician',
  'Plumber',
  'Tiler',
  'Painter',
  'Plasterer',
  'Concreter',
  'Roofer',
  'Glazier',
  'Joiner / Cabinet Maker',
  'Bricklayer',
  'Landscaper',
  'Air Conditioning / HVAC',
  'Waterproofer',
  'Steel / Structural',
  'Excavator / Earthworks',
  'Other',
]

export const DOC_TYPES: { value: string; label: string; required: boolean }[] = [
  { value: 'licence',        label: 'Trade Licence',          required: true  },
  { value: 'insurance',      label: 'Public Liability Insurance', required: true  },
  { value: 'swms',           label: 'SWMS (Safe Work Method Statement)', required: false },
  { value: 'scope_of_works', label: 'Scope of Works',         required: false },
  { value: 'other',          label: 'Other Document',         required: false },
]

export function complianceColor(
  hasLicence: number,
  hasInsurance: number
): 'green' | 'yellow' | 'red' {
  if (hasLicence > 0 && hasInsurance > 0) return 'green'
  if (hasLicence > 0 || hasInsurance > 0) return 'yellow'
  return 'red'
}
