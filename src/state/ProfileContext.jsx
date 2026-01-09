import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from './AuthContext.jsx'

const ProfileContext = createContext(null)

const DEFAULT_EXERCISES = ['Bench Press', 'Squat', 'Deadlift']

const DEFAULT_PROFILE = {
  email: '',
  name: '',
  dobIso: '', // YYYY-MM-DD
  sex: '',
  height: '',
  triplemeasurements: false,
  exerciseNames: DEFAULT_EXERCISES,
  cycles: [],
  isAdmin: false,
  accountType: 'user',
  createdAt: null,
}

function normalizeCycleType(type) {
  if (type === 'cut') return 'cutting'
  if (type === 'bulk') return 'bulking'
  if (type === 'maintain') return 'maintaining'
  return type
}

function normalizeCycles(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((c) => c && c.id)
    .map((c) => ({
      id: String(c.id),
      type: normalizeCycleType(c.type),
      startDateIso: c.startDateIso || null,
      endDateIso: c.endDateIso || null,
      targetWeightKg: Number.isFinite(Number(c.targetWeightKg)) ? Number(c.targetWeightKg) : null,
    }))
    .sort((a, b) => String(b.startDateIso || '').localeCompare(String(a.startDateIso || '')))
}

function normalizeExerciseNames(data) {
  const arr = (Array.isArray(data?.exerciseNames) && data.exerciseNames.length === 3)
    ? data.exerciseNames
    : (Array.isArray(data?.liftNames) && data.liftNames.length === 3)
      ? data.liftNames
      : DEFAULT_EXERCISES

  return arr.map((x, i) => String(x || DEFAULT_EXERCISES[i] || `Exercise ${i + 1}`))
}

export function ProfileProvider({ children }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  const [loading, setLoading] = useState(false)
  const [profileError, setProfileError] = useState(null)

  useEffect(() => {
    setProfile(DEFAULT_PROFILE)
    setProfileError(null)
    if (!user) return

    const ref = doc(db, 'users', user.uid)
    setLoading(true)

    const unsub = onSnapshot(ref, async (snap) => {
      if (!snap.exists()) {
        // Create user doc on first login.
        await setDoc(ref, {
          email: user.email || '',
          name: '',
          dobIso: '',
          sex: '',
          height: '',
          triplemeasurements: false,
          exerciseNames: DEFAULT_EXERCISES,
          cycles: [],
          isAdmin: false,
          accountType: 'user',
          createdAt: serverTimestamp(),
        })
        return
      }

      const data = snap.data()
      const isAdmin = !!data.isAdmin || data.accountType === 'admin'
      const accountType = (data.accountType === 'admin' || data.accountType === 'user')
        ? data.accountType
        : (isAdmin ? 'admin' : 'user')

      setProfile({
        email: data.email || user.email || '',
        name: data.name || '',
        dobIso: data.dobIso || '',
        sex: data.sex || '',
        height: data.height || '',
        triplemeasurements: !!data.triplemeasurements,
        exerciseNames: normalizeExerciseNames(data),
        cycles: normalizeCycles(data.cycles),
        isAdmin,
        accountType,
        createdAt: data.createdAt || null,
      })
      setLoading(false)
    }, (err) => {
      setProfileError(err?.message || 'Failed to load profile.')
      setLoading(false)
    })

    return () => unsub()
  }, [user])

  const api = useMemo(() => ({
    profile,
    loading,
    profileError,
    async updateProfile(patch) {
      if (!user) throw new Error('Not authenticated')
      setProfileError(null)
      const ref = doc(db, 'users', user.uid)
      await updateDoc(ref, patch)
    },
  }), [profile, loading, profileError, user])

  return <ProfileContext.Provider value={api}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  return useContext(ProfileContext)
}

export { DEFAULT_EXERCISES }
