    "use client"

    import { useState } from "react"
    import { useRouter } from "next/navigation"

    export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    /*async function handleLogin(e: React.FormEvent) {
        e.preventDefault()

        const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
        })

        if (res.ok) {
        router.push("/dashboard")
        } else {
        alert("Credenciales incorrectas")
        }
    }*/

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        router.push("/dashboard")
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center mb-5">
        <form onSubmit={handleLogin} className="backdrop-blur-sm bg-white border border-red-500/20 rounded-2xl p-8 w-80 shadow-xl space-y-1">
        <h1 className="text-2xl font-bold mb-4 text-center ">¡Bienvenido!</h1>

        <h1 className="text-center">Inicia sesión rápido y seguro con tus cuentas.</h1>

 
        <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="h-[48px] w-full block text-black bg-white text-base border-2 border-[#1a2742] rounded-lg px-5 outline-none"
        />

        <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="h-[48px] w-full block text-black bg-white text-base border-2 border-[#1a2742] rounded-lg px-5 outline-none"
        />

        <button className=" btn btn-xs sm:btn-sm md:btn-md lg:btn-lg xl:btn-xl h-[40px] hover:bg-[#162035] w-full block text-white bg-[#1a2742] text-base underline rounded-2xl cursor-pointer">Entra</button>
        </form>
       
        </div>
    )
    }