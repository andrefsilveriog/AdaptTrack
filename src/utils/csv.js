import { toDateIso } from './date.js'

function csvEscape(value) {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

function toNum(v) {
  return (v === null || v === undefined || v === '') ? null : Number(v)
}

function toOut(v) {
  if (v === null || v === undefined) return ''
  if (typeof v === 'number' && !Number.isFinite(v)) return ''
  return v
}

/**
 * Build rows for CSV export.
 * - derived: output from buildDerivedSeries(entries, profile)
 * - entries: raw entries
 * - profile: used mainly for exercise names
 */
export function buildCsvRows(derived = [], entries = [], profile = {}) {
  const exNames = Array.isArray(profile.exerciseNames) && profile.exerciseNames.length === 3
    ? profile.exerciseNames
    : (Array.isArray(profile.liftNames) && profile.liftNames.length === 3 ? profile.liftNames : ['Bench Press', 'Squat', 'Deadlift'])

  const rawByDate = new Map()
  for (const e of entries || []) rawByDate.set(e.dateIso, e)

  const header = [
    'dateIso',
    'weightKg',
    'proteinG',
    'carbsG',
    'fatsG',
    'calories',
    'navyBodyFatPct',
    'waterIntakeMl',
    'exercise1Name',
    'exercise2Name',
    'exercise3Name',
    'exercise1_1rmKg',
    'exercise2_1rmKg',
    'exercise3_1rmKg',
    'exercise1_loadKg',
    'exercise1_reps',
    'exercise2_loadKg',
    'exercise2_reps',
    'exercise3_loadKg',
    'exercise3_reps',
    'waistCm',
    'neckCm',
    'hipCm',
  ]

  const rows = [header]

  for (const d of derived || []) {
    const raw = rawByDate.get(d.dateIso) || {}

    // Prefer derived calories/bodyfat (smoothed/raw) if available, else compute from raw
    const calories = toOut(d.raw?.calories ?? null)
    const bf = toOut(d.raw?.bodyFatPct ?? null)

    rows.push([
      d.dateIso || (d.date ? toDateIso(d.date) : '') || '',
      toOut(d.raw?.weightKg ?? raw.weight ?? null),
      toOut(d.raw?.proteinG ?? raw.protein ?? null),
      toOut(d.raw?.carbsG ?? raw.carbs ?? null),
      toOut(d.raw?.fatsG ?? raw.fats ?? null),
      calories,
      bf,
      toOut(raw.waterMl ?? null),
      exNames[0],
      exNames[1],
      exNames[2],
      toOut(raw.bench ?? null),
      toOut(raw.squat ?? null),
      toOut(raw.deadlift ?? null),
      toOut(raw.benchLoadKg ?? null),
      toOut(raw.benchReps ?? null),
      toOut(raw.squatLoadKg ?? null),
      toOut(raw.squatReps ?? null),
      toOut(raw.deadliftLoadKg ?? null),
      toOut(raw.deadliftReps ?? null),
      toOut(raw.waist ?? null),
      toOut(raw.neck ?? null),
      toOut(raw.hip ?? null),
    ])
  }

  return rows
}

export function downloadCsv(rows, filename = 'export.csv') {
  const lines = rows.map((row) => row.map(csvEscape).join(','))
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
