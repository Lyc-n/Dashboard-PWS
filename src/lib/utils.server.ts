import { db } from './db.server'
import { riwayatSurvey, validSession } from './schema'
import { jwtVerify, SignJWT } from 'jose'
import { randomBytes, verify } from 'node:crypto';
import { setCookie } from '@tanstack/react-start/server';


/* TODO 
1. bikin session key [X]
2. bikin hash pin dari secret [X]
3. validate pin ke secret [X]
4. store session di cookie (expire in 1 hour) [X]
*/


const secretKey = Buffer.from(import.meta.env.VITE_SECRET_KEY,"base64")



export async function isValidPin(pin:number){
    if(pin === import.meta.env.VITE_PIN){
        setCookie('session', await createSessionHelper(), {
            httpOnly: true,
            secure: true,
            path: '/',
            maxAge: 60 * 60
        })
        return true
    } else{ throw new Error("PIN is Not Valid") }

}

async function createSessionHelper(){
    const tokenPayload = {
        clientUUID: randomBytes(32).toString("base64url"), // mastiin  sessionnya unique per client
        loggedInAt: new Date().toISOString,
    };

    
    const token = await new SignJWT(tokenPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(secretKey);
    await db.insert(validSession).values({ token })
    return token;
}

export async function getSessionHelper(sessionToken: string){
    const sessionDb = await db.query.validSession.findFirst({
        where: {
            token: sessionToken
        }
    })
    if(!sessionDb){ throw new Error("Session does not exist")}
    return sessionDb
}

export async function verifyTokenHelper(sessionToken:string) {
    const { payload }  = await jwtVerify(sessionToken, secretKey, { algorithms: ["HS256"]})
    return payload
}

export async function queryAllSurveyData() {
  return await db.query.riwayatSurvey.findMany()
}

export async function getPetugasByName(queryName: string){
    return await db.query.surveyor.findFirst({where: {nama: queryName }}) 
}

export async function putSurveyData( newData: typeof surveys.$inferInsert ) {
    await db.insert(surveys).values(newData).onConflictDoNothing({ target: surveys.nik })
}
