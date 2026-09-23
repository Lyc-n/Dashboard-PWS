import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

const authMiddleware = createMiddleware({ type: "function" }).server(
    async ({ next }) =>{
        // sessionId dibuat setiap kali masukkkin pin
        const sessionId = getCookie("session");
        if (!sessionId) throw new Error("Unauthorized");
        return next({ context: { sessionId } });
    }
)

const getAllSurveyData = createServerFn({ method: "GET" }).middleware([ authMiddleware ]).handler(
    async ({ next }) => {

    }
)