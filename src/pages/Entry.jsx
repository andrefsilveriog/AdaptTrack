import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../state/AuthContext.jsx'
import { DEFAULT_EXERCISES, useProfile } from '../state/ProfileContext.jsx'
import { listenEntries } from '../services/entries.js'
import EntryForm from '../components/EntryForm.jsx'
import EntryTable from '../components/EntryTable.jsx'
import { buildDerivedSeries } from '../utils/calculations.js'

export default function Entry() {
  const { user } = useAuth()
  const { profile } = useProfile()

  const exerciseNames = useMemo(() => {
    const arr = Array.isArray(profile?.exerciseNames) ? profile.exerciseNames : (Array.isArray(profile?.liftNames) ? profile.liftNames : DEFAULT_EXERCISES)
    return [arr[0] || DEFAULT_EXERCISES[0], arr[1] || DEFAULT_EXERCISES[1], arr[2] || DEFAULT_EXERCISES[2]]
  }, [profile])

  const [entries, setEntries] = useState([])
  const [loadErr, setLoadErr] = useState(null)

  useEffect(() => {
    if (!user) return
    const unsub = listenEntries(
      user.uid,
      (data) => setEntries(data),
      (err) => setLoadErr(err?.message || 'Failed to load entries.')
    )
    return () => unsub()
  }, [user])

  const tripleEnabled = useMemo(() => !!profile?.triplemeasurements, [profile?.triplemeasurements])
  const sex = (profile?.sex || 'male').toLowerCase()

  const derived = useMemo(() => {
    try {
      return buildDerivedSeries(entries, profile)
    } catch {
      return null
    }
  }, [entries, profile])

  return (
    <>
      {loadErr && <div className="notice error" style={{ marginTop: 14 }}>{loadErr}</div>}

      <EntryForm userId={user?.uid} exerciseNames={exerciseNames} tripleEnabled={tripleEnabled} />

      <EntryTable
        sex={sex}
        userId={user?.uid}
        entries={entries}
        tripleEnabled={tripleEnabled}
        exerciseNames={exerciseNames}
        derived={derived}
        profile={profile}
      />
    </>
  )
}
