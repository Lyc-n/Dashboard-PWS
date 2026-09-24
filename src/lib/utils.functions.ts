import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { isValidPin } from "./utils.server";


/* ALUR LOGIN
1. cek sessionToken pake beforeLoad di /laporan (form)
2. sessionToken di crosscheck ke validSessions di DB
3. kalo gk ada kredensial redirect ke pin
4. pin valid redirect ke /laporan
5. update expireTime sessionToken kalo akses /laporan
*/


/* TODO 
1. bikin server function buat load semua data survey
2. bikin login function
3. ngambi session token yang udah ada di cookie
4. cek session token ke db
5. if token valid, update expire time
6. kalo pin valid, kasih akses form 
7. crosscheck sesionToken waktu form submmision dengan valid session di db (authMiddleware) 
*/

const pinLogin = createServerFn({ method:"GET" })
    .validator((data: { pin: number }) => data)
    .handler(
        async ({ data }) => {
            if (await isValidPin(data.pin)){
                return true
            }
        }
)


const checkSessionToken = createServerFn({ method:"GET" })
    .validator((data: { sessionToken: string }) => data)
    .handler(
        async ({ data }) => {
            
        
        }
)

const authMiddleware = createMiddleware({ type: "function" }).server(
    async ({ next, context }) =>{
        // sessionId dibuat setiap kali masukkkin pin
        const sessionToken = getCookie("session");
        if (!sessionToken) throw new Error("Unauthorized");
        return next({ context: { sessionToken } });
    }
)

const getAllSurveyData = createServerFn({ method: "GET" }).handler(
    async () => {
        
        return
    }
)