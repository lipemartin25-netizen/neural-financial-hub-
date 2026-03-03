import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const AppLayout = () => {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-background" style={{ backgroundColor: '#0b0d10', color: '#ebe6da' }}>
            <Sidebar />
            <main className="transition-all duration-300 pl-[80px] lg:pl-[280px]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="mx-auto max-w-7xl px-6 py-8"
                >
                    <Outlet />
                </motion.div>
            </main>
        </div>
    );
};

export default AppLayout;
