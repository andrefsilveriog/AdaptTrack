import React, { useMemo, useState } from 'react'
import { serverTimestamp } from 'firebase/firestore'
import { upsertEntry } from '../services/entries.js'
import { oneRepMaxKg } from '../utils/calculations.js'

const DEFAULT_EXERCISES = ['Bench Press', 'Squat', 'Deadlift']

function numOrNull(v) {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export default function EntryForm({ userId, exerciseNames, tripleEnabled }) {
  const exNames = useMemo(() => {
    const arr = Array.isArray(exerciseNames) ? exerciseNames : DEFAULT_EXERCISES
    return [arr[0] || DEFAULT_EXERCISES[0], arr[1] || DEFAULT_EXERCISES[1], arr[2] || DEFAULT_EXERCISES[2]]
  }, [exerciseNames])

  const [dateIso, setDateIso] = useState(new Date().toISOString().slice(0, 10))

  const [weight, setWeight] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fats, setFats] = useState('')

  // Exercises (load + reps)
  const [ex1Load, setEx1Load] = useState('')
  const [ex1Reps, setEx1Reps] = useState('')
  const [ex2Load, setEx2Load] = useState('')
  const [ex2Reps, setEx2Reps] = useState('')
  const [ex3Load, setEx3Load] = useState('')
  const [ex3Reps, setEx3Reps] = useState('')

  // Measurements
  const [neck, setNeck] = useState('')
  const [waist, setWaist] = useState('')
  const [hip, setHip] = useState('')

  const [m1, setM1] = useState('')
  const [m2, setM2] = useState('')
  const [m3, setM3] = useState('')
  const [w1, setW1] = useState('')
  const [w2, setW2] = useState('')
  const [w3, setW3] = useState('')
  const [h1, setH1] = useState('')
  const [h2, setH2] = useState('')
  const [h3, setH3] = useState('')

  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const caloriesPreview = useMemo(() => {
    const p = numOrNull(protein)
    const c = numOrNull(carbs)
    const f = numOrNull(fats)
    if (p === null || c === null || f === null) return null
    if (p === 0 && c === 0 && f === 0) return null
    return Math.round(p * 4 + c * 4 + f * 9)
  }, [protein, carbs, fats])

  async function onSubmit(e) {
    e.preventDefault()
    if (!userId) return

    setBusy(true)
    setMsg(null)

    try {
      if (!dateIso) throw new Error('Date is required.')

      // Validate exercise pairs (if one is filled, the other is required)
      const pairs = [
        { name: exNames[0], load: ex1Load, reps: ex1Reps },
        { name: exNames[1], load: ex2Load, reps: ex2Reps },
        { name: exNames[2], load: ex3Load, reps: ex3Reps },
      ]
      for (const p of pairs) {
        const hasLoad = p.load !== ''
        const hasReps = p.reps !== ''
        if (hasLoad !== hasReps) throw new Error(`For "${p.name}", enter both load and reps.`)
      }

      const w = numOrNull(weight)
      const p = numOrNull(protein)
      const c = numOrNull(carbs)
      const f = numOrNull(fats)

      const n = numOrNull(neck)
      const wa = numOrNull(waist)
      const hi = numOrNull(hip)

      const ex1L = numOrNull(ex1Load)
      const ex1R = numOrNull(ex1Reps)
      const ex2L = numOrNull(ex2Load)
      const ex2R = numOrNull(ex2Reps)
      const ex3L = numOrNull(ex3Load)
      const ex3R = numOrNull(ex3Reps)

      // Determine whether there's at least one useful datapoint
      const hasAny =
        w !== null ||
        p !== null ||
        c !== null ||
        f !== null ||
        n !== null ||
        wa !== null ||
        hi !== null ||
        (ex1L !== null && ex1R !== null) ||
        (ex2L !== null && ex2R !== null) ||
        (ex3L !== null && ex3R !== null) ||
        (tripleEnabled && (
          numOrNull(m1) !== null || numOrNull(m2) !== null || numOrNull(m3) !== null ||
          numOrNull(w1) !== null || numOrNull(w2) !== null || numOrNull(w3) !== null ||
          numOrNull(h1) !== null || numOrNull(h2) !== null || numOrNull(h3) !== null
        ))

      if (!hasAny) {
        throw new Error('Add at least one datapoint (weight, macros, measurements, or an exercise set).')
      }

      // Build a sparse patch so blank inputs don't overwrite existing data
      const patch = {
        dateIso,
        updatedAt: serverTimestamp(),
      }
      if (w !== null) patch.weight = w
      if (p !== null) patch.protein = p
      if (c !== null) patch.carbs = c
      if (f !== null) patch.fats = f

      // Measurements
      if (!tripleEnabled) {
        if (n !== null) patch.neck = n
        if (wa !== null) patch.waist = wa
        if (hi !== null) patch.hip = hi
      } else {
        const m1n = numOrNull(m1)
        const m2n = numOrNull(m2)
        const m3n = numOrNull(m3)
        const w1n = numOrNull(w1)
        const w2n = numOrNull(w2)
        const w3n = numOrNull(w3)
        const h1n = numOrNull(h1)
        const h2n = numOrNull(h2)
        const h3n = numOrNull(h3)
        if (m1n !== null || m2n !== null || m3n !== null) patch.neck3 = [m1n, m2n, m3n]
        if (w1n !== null || w2n !== null || w3n !== null) patch.waist3 = [w1n, w2n, w3n]
        if (h1n !== null || h2n !== null || h3n !== null) patch.hip3 = [h1n, h2n, h3n]
      }

      // Exercises
      if (ex1L !== null && ex1R !== null) {
        patch.benchLoadKg = ex1L
        patch.benchReps = ex1R
        patch.bench = oneRepMaxKg(ex1L, ex1R)
      }
      if (ex2L !== null && ex2R !== null) {
        patch.squatLoadKg = ex2L
        patch.squatReps = ex2R
        patch.squat = oneRepMaxKg(ex2L, ex2R)
      }
      if (ex3L !== null && ex3R !== null) {
        patch.deadliftLoadKg = ex3L
        patch.deadliftReps = ex3R
        patch.deadlift = oneRepMaxKg(ex3L, ex3R)
      }

      await upsertEntry(userId, patch)

      setMsg({ type: 'success', text: 'Saved.' })

      // Clear fields (keep the date)
      setWeight('')
      setProtein('')
      setCarbs('')
      setFats('')
      setEx1Load('')
      setEx1Reps('')
      setEx2Load('')
      setEx2Reps('')
      setEx3Load('')
      setEx3Reps('')
      setNeck('')
      setWaist('')
      setHip('')
      setM1(''); setM2(''); setM3('')
      setW1(''); setW2(''); setW3('')
      setH1(''); setH2(''); setH3('')
    } catch (err) {
      setMsg({ type: 'error', text: err?.message || 'Failed to save.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>New entry</h2>
        <div className="muted">Only one datapoint is required. Add what you have today.</div>
      </div>

      {msg && <div className={`notice ${msg.type === 'error' ? 'error' : 'success'}`} style={{ marginTop: 12 }}>{msg.text}</div>}

      <form onSubmit={onSubmit} style={{ marginTop: 12 }}>
        <div className="row">
          <div className="field">
            <label>Date</label>
            <input type="date" value={dateIso} onChange={(e) => setDateIso(e.target.value)} required />
          </div>

          <div className="field">
            <label>Weight (kg)</label>
            <input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 82.3" />
          </div>

          <div className="field">
            <label>Protein (g)</label>
            <input inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="e.g. 160" />
          </div>

          <div className="field">
            <label>Carbs (g)</label>
            <input inputMode="decimal" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="e.g. 220" />
          </div>

          <div className="field">
            <label>Fats (g)</label>
            <input inputMode="decimal" value={fats} onChange={(e) => setFats(e.target.value)} placeholder="e.g. 70" />
          </div>

          <div className="field" style={{ minWidth: 170 }}>
            <label>Calories (preview)</label>
            <input value={caloriesPreview == null ? '—' : String(caloriesPreview)} readOnly />
          </div>
        </div>

        <hr className="sep" />

        <div className="grid" style={{ marginTop: 12 }}>
          <div className="field">
            <label>{exNames[0]} — load (kg)</label>
            <input inputMode="decimal" value={ex1Load} onChange={(e) => setEx1Load(e.target.value)} placeholder="e.g. 80" />
          </div>
          <div className="field">
            <label>{exNames[0]} — reps</label>
            <input inputMode="numeric" value={ex1Reps} onChange={(e) => setEx1Reps(e.target.value)} placeholder="e.g. 5" />
          </div>

          <div className="field">
            <label>{exNames[1]} — load (kg)</label>
            <input inputMode="decimal" value={ex2Load} onChange={(e) => setEx2Load(e.target.value)} placeholder="e.g. 120" />
          </div>
          <div className="field">
            <label>{exNames[1]} — reps</label>
            <input inputMode="numeric" value={ex2Reps} onChange={(e) => setEx2Reps(e.target.value)} placeholder="e.g. 5" />
          </div>

          <div className="field">
            <label>{exNames[2]} — load (kg)</label>
            <input inputMode="decimal" value={ex3Load} onChange={(e) => setEx3Load(e.target.value)} placeholder="e.g. 140" />
          </div>
          <div className="field">
            <label>{exNames[2]} — reps</label>
            <input inputMode="numeric" value={ex3Reps} onChange={(e) => setEx3Reps(e.target.value)} placeholder="e.g. 5" />
          </div>
        </div>

        <hr className="sep" />

        {!tripleEnabled ? (
          <div className="row" style={{ marginTop: 12 }}>
            <div className="field">
              <label>Neck (cm)</label>
              <input inputMode="decimal" value={neck} onChange={(e) => setNeck(e.target.value)} placeholder="e.g. 38" />
            </div>
            <div className="field">
              <label>Waist (cm)</label>
              <input inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="e.g. 86" />
            </div>
            <div className="field">
              <label>Hip (cm)</label>
              <input inputMode="decimal" value={hip} onChange={(e) => setHip(e.target.value)} placeholder="e.g. 102" />
            </div>
          </div>
        ) : (
          <>
            <div className="muted" style={{ marginTop: 10 }}>Triple measurements (optional): enter up to 3 readings per site.</div>
            <div className="grid" style={{ marginTop: 12 }}>
              <div className="field"><label>Neck 1 (cm)</label><input inputMode="decimal" value={m1} onChange={(e) => setM1(e.target.value)} /></div>
              <div className="field"><label>Neck 2 (cm)</label><input inputMode="decimal" value={m2} onChange={(e) => setM2(e.target.value)} /></div>
              <div className="field"><label>Neck 3 (cm)</label><input inputMode="decimal" value={m3} onChange={(e) => setM3(e.target.value)} /></div>

              <div className="field"><label>Waist 1 (cm)</label><input inputMode="decimal" value={w1} onChange={(e) => setW1(e.target.value)} /></div>
              <div className="field"><label>Waist 2 (cm)</label><input inputMode="decimal" value={w2} onChange={(e) => setW2(e.target.value)} /></div>
              <div className="field"><label>Waist 3 (cm)</label><input inputMode="decimal" value={w3} onChange={(e) => setW3(e.target.value)} /></div>

              <div className="field"><label>Hip 1 (cm)</label><input inputMode="decimal" value={h1} onChange={(e) => setH1(e.target.value)} /></div>
              <div className="field"><label>Hip 2 (cm)</label><input inputMode="decimal" value={h2} onChange={(e) => setH2(e.target.value)} /></div>
              <div className="field"><label>Hip 3 (cm)</label><input inputMode="decimal" value={h3} onChange={(e) => setH3(e.target.value)} /></div>
            </div>
          </>
        )}

        <div className="footer-actions">
          <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save entry'}</button>
        </div>
      </form>
    </div>
  )
}
