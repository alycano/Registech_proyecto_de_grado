import { createContext, useContext, useState, useCallback } from 'react'
import axios from 'axios'
import { API_ROUTES } from '../api/apiRoutes'

const AuthContext = createContext(null)

function getStoredUser() {
    try {
        const saved = localStorage.getItem('usuario')
        return saved ? JSON.parse(saved) : null
    } catch {
        return null
    }
}

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(getStoredUser)

    const login = useCallback((userData) => {
        localStorage.setItem('usuario', JSON.stringify(userData))
        setUsuario(userData)
    }, [])

    const logout = useCallback(() => {
        axios.post(API_ROUTES.LOGOUT).catch(() => {})
        localStorage.removeItem('usuario')
        localStorage.removeItem('csrf_token')
        setUsuario(null)
    }, [])

    const updateUsuario = useCallback((patch) => {
        setUsuario(prev => {
            const next = { ...prev, ...patch }
            localStorage.setItem('usuario', JSON.stringify(next))
            return next
        })
    }, [])

    return (
        <AuthContext.Provider value={{ usuario, login, logout, updateUsuario }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
    return ctx
}
