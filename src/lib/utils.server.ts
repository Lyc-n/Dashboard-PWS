import { db } from './db.server'
import { riwayatSurvey } from './schema'
import { jwtVerify, SignJWT } from 'jose'
import { randomBytes } from 'node:crypto';
import { setCookie, getCookie } from '@tanstack/react-start/server';


/* TODO 
1. bikin session key [X]
2. bikin hash pin dari secret [X]
3. validate pin ke secret [X]
4. store session di cookie (expire in 1 hour) [X]
*/

async function createSessionToken(){
    const tokenPayload = {
        clientUUID: randomBytes(32).toString("base64url"), // mastiin  sessionnya unique per client
        loggedInAt: new Date().toISOString,
    };

    const secretKey = Buffer.from(import.meta.env.VITE_SECRET_KEY,"base64")
    
    const token = await new SignJWT(tokenPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(secretKey);
    return token;
}

export async function isValidPin(pin:number){
    if(pin === import.meta.env.VITE_PIN){
        setCookie('session', await createSessionToken(), {
            httpOnly: true,
            secure: true,
            path: '/',
            maxAge: 60 * 60
        })
        return true
    } else{ return false }

}

export async function getAllSurveyData() {
  return await db.query.riwayatSurvey.findMany()
}

export async function getPetugasByName(queryName: string){
    return await db.query.surveyor.findFirst({where: {nama: queryName }}) 
}

export async function putSurveyData( newData: typeof riwayatSurvey.$inferInsert ) {
    await db.insert(riwayatSurvey).values(newData).onConflictDoNothing({ target: riwayatSurvey.nik_warga })
}
