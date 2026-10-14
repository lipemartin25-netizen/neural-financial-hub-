import AppLayout from '@/components/AppLayout'
import { AppProvider } from '@/contexts/AppContext'
import { Toaster } from 'sonner'

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppProvider>
            <AppLayout>
                {children}
            </AppLayout>
            <Toaster position="top-right" richColors theme="dark" />
        </AppProvider>
    )
}
