import { db } from "./firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

export const logActivity = async (userId: string, action: string, details?: any) => {
    try {
        await addDoc(collection(db, "activity_logs"), {
            userId,
            action,
            details,
            timestamp: serverTimestamp()
        })
    } catch (error) {
        console.error("Error logging activity:", error)
    }
}
