import { db } from './db.server'
import { riwayatSurvey } from './schema'

/* TODO 
1. bikin session key
2. bikin hash pin dari secret
3. validate pin ke secret 
4. store session di cookie (expire in 1 hour)
*/


export function isValidPin(pin:number){
    if(pin === import.meta.env.VITE_PIN){
        return true
    }
}

export async function getAllSurveyData() {
  return await db.query.riwayatSurvey.findMany()
}

export async function getPetugasByName(queryName: string){
    return await db.query.surveyor.findFirst({where: {nama: queryName }}) 
}

export async function putSurveyData( newData: typeof riwayatSurvey.$inferInsert) {
    await db.insert(riwayatSurvey).values(newData).onConflictDoNothing({ target: riwayatSurvey.nik_warga })
}
