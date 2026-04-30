import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import type { Client } from "../types/client";
import { useEffect, useState } from "react";

export const useClientsData = () => {
    const [upcoming, setUpcoming] = useState<Client[]>([]);
    const [completed, setCompleted] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            try {
                const querySnapshot = await getDocs(collection(db, 'clients'));
                const all = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Client[];

                const now = Date.now();
                setUpcoming(
                    all
                        .filter(c => Number(c.data) > now)
                        .sort((a, b) => (a.data > b.data ? 1 : -1))
                );
                setCompleted(
                    all
                        .filter(c => Number(c.data) <= now)
                        .sort((a, b) => (b.data > a.data ? 1 : -1))
                );
            } catch (error) {
                console.error('Ошибка при загрузке клиентов:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, []);

    const deleteClient = async (clientId: string) => {
        await deleteDoc(doc(db, 'clients', clientId));
        setUpcoming((prev) => prev.filter((client) => client.id !== clientId));
        setCompleted((prev) => prev.filter((client) => client.id !== clientId));
    };

    return { upcoming, completed, loading, deleteClient };
};
