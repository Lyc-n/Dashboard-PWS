import { db } from "./db";

export async function getAllSurveyData(){
    return await db.query.riwayatSurvey.findMany()
}

/