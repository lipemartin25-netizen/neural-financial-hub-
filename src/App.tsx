import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Index from "@/app-pages/Index";
import Auth from "@/app-pages/Auth";
import AppLayout from "@/components/AppLayout";
import DashboardContent from "@/components/DashboardContent";
import Transactions from "@/app-pages/Transactions";
import Cards from "@/app-pages/Cards";
import Boletos from "@/app-pages/Boletos";
import Accounts from "@/app-pages/Accounts";
import Investments from "@/app-pages/Investments";
import Patrimony from "@/app-pages/Patrimony";
import FinancialHealth from "@/app-pages/FinancialHealth";
import Budgets from "@/app-pages/Budgets";
import Goals from "@/app-pages/Goals";
import Reports from "@/app-pages/Reports";
import AIChat from "@/app-pages/AIChat";
import WealthLab from "@/app-pages/WealthLab";
import Settings from "@/app-pages/Settings";

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Auth */}
                <Route path="/login" element={<Auth />} />
                <Route path="/register" element={<Auth />} />

                {/* Protected App Routes */}
                <Route element={<AppLayout><Outlet /></AppLayout>}>
                    <Route path="/dashboard" element={<DashboardContent />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/cards" element={<Cards />} />
                    <Route path="/boletos" element={<Boletos />} />
                    <Route path="/accounts" element={<Accounts />} />
                    <Route path="/investments" element={<Investments />} />
                    <Route path="/patrimony" element={<Patrimony />} />
                    <Route path="/health" element={<FinancialHealth />} />
                    <Route path="/budgets" element={<Budgets />} />
                    <Route path="/goals" element={<Goals />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/ai" element={<AIChat />} />
                    <Route path="/wealth-lab" element={<WealthLab />} />
                    <Route path="/settings" element={<Settings />} />
                </Route>

                {/* 404 Redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
