import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import type { Client } from "../types/client";
import { useEffect, useState } from "react";

export const useClientsData = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    

    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true)
            try {
                const querySnapshot = await getDocs(collection(db, 'clients'));
                const clientsData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                })) as Client[];
                
                setClients(clientsData.sort((a, b) => (b.data > a.data ? 1 : -1)));
                setLoading(false)
            } catch (error) {
                console.error('Ошибка при загрузке клиентов:', error);
                setLoading(false)
            }
        };

        fetchClients();
    }, [])
    



    return {clients, loading}
}