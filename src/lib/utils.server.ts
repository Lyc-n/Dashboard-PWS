import { db } from './db.server'
import { surveys } from './schema'
import { SignJWT } from 'jose'
import { randomBytes } from 'node:crypto';
import { setCookie } from '@tanstack/react-start/server';


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

    const secretKey = Buffer.from(import.meta.env.SECRET_KEY,"base64")
    
    const token = await new SignJWT(tokenPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(secretKey);
    return token;
}

export async function isValidPin(pin:number){
    if(pin === import.meta.env.PIN){
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
  return await db.query.surveys.findMany()
}

export async function getPetugasByName(queryName: string){
    return await db.query.surveyor.findFirst({where: {nama: queryName }}) 
}

export async function putSurveyData( newData: typeof surveys.$inferInsert ) {
    await db.insert(surveys).values(newData).onConflictDoNothing({ target: surveys.nik })
}
