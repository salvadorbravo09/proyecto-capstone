import {useState} from "react"
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)

    // Llama a Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      // Login exitoso
      console.log('Usuario:', data.user)
      navigate('/dashboard') // Redirigir según el rol
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2B6CB0] via-[#3182CE] to-white p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="font-bold text-3xl text-[#2B6CB0] mb-2">
              RehabControl
            </h1>
            <p className="text-muted-foreground">Sistema de Gestión Clínica</p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm mb-2 text-foreground"
              >
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm mb-2 text-foreground"
              >
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-6 h-11 bg-[#2B6CB0] hover:bg-[#2C5282]"
            >
              Iniciar sesión
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
