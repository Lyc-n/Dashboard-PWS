import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { getSessionHelper, isValidPin, queryAllSurveyData, verifyTokenHelper } from "./utils.server";


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

export const pinLogin = createServerFn({ method:"GET" })
    .validator((data: { pin: number }) => data)
    .handler(
        async ({ data }) => {
            if (await isValidPin(data.pin)){ return true }
        }
)

export const getSessionToken = createServerFn({ method: "GET" })
    .handler(
        async ()=>{
            const sessionToken = getCookie('session')
            if(!sessionToken) throw new Error('Session dont exist') // gak pernah login
            
            return await getSessionHelper(sessionToken)
        }    
)



export const authSessionToken = createMiddleware({ type: "function" }).server(
    async ({ next }) =>{
        const sessionToken = await getSessionHelper(getCookie('session')!)
        return next({ context: { sessionToken } })
    }
)

export const getAllSurveyData = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .handler(
        async () => {
            return await queryAllSurveyData()
        }
)