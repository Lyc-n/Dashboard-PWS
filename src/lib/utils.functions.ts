import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { destroySession, isValidPin, queryAllSurveyData, touchSession } from "./utils.server";


/* ALUR LOGIN
1. cek sessionToken pake beforeLoad di /laporan (form)
2. sessionToken di crosscheck ke validSessions di DB
3. kalo gk ada kredensial redirect ke pin
4. pin valid redirect ke /laporan
5. update expireTime sessionToken kalo akses /laporan
*/


/* TODO 
1. bikin server function buat load semua data survey [X]
2. bikin login function
3. ngambil session token yang udah ada di cookie [X]
4. cek session token ke db [X]
5. if token valid, update expire time
6. kalo pin valid, kasih akses form [X]
7. crosscheck sesionToken waktu form submmision dengan valid session di db (authMiddleware) 
*/

// ganti method GET → POST — expect: login tak bisa dipicu lewat link/GET
export const pinLogin = createServerFn({ method: "POST" })
    .validator((data: { pin: number }) => data)
    .handler(
        async ({ data }) => {
            return await isValidPin(data.pin) // selalu return boolean
        }
)

export const getSessionToken = createServerFn({ method: "GET" })
    .handler(
        async () => {
            const sessionToken = getCookie('session')
            if (!sessionToken) throw new Error('Unauthorized') // gak pernah login
            return await touchSession(sessionToken)
        }
)

export const logoutSession = createServerFn({ method: "POST" })
    .handler(
        async () => {
            await destroySession(getCookie('session'))
        }
)

//   crosscheck sessionToken ke valid_session ? beres; token bajakan/ kedaluwarsa ditolak.
export const authSessionToken = createMiddleware({ type: "function" }).server(
    async ({ next }) => {
        const sessionToken = getCookie('session')
        if (!sessionToken) throw new Error("Unauthorized")
        const session = await touchSession(sessionToken)
        return next({ context: { sessionToken, profile: session.profile } })
    }
)

// tipe JSON yang dikenali serialisasi RPC TanStack (jawaban jsonb dari drizzle bertipe `unknown`)
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export const getAllSurveyData = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .handler(
        async () => {
            const rows = await queryAllSurveyData()
            return rows.map((row) => ({ ...row, jawaban: row.jawaban as JsonValue }))
        }
    )
