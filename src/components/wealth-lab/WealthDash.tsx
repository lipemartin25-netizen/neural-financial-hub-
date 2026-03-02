'use client'

import { useState } from 'react'
import { Landmark, TrendingUp, Calculator, Flame, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function WealthDash() {
    const [activeTab, setActiveTab] = useState('fire')

    const tabs = [
        { id: 'fire', label: 'Independência Financeira (FIRE)', icon: Flame },
        { id: 'compound', label: 'Juros Compostos (Tesouro)', icon: TrendingUp },
        { id: 'mei', label: 'Calculadora PJ / MEI', icon: Calculator }
    ]

    return (
        <div className="space-y-6">
            <div className="flex overflow-x-auto bg-black/20 p-1.5 rounded-xl border border-white/5 scrollbar-none gap-2">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shrink-0 ${activeTab === t.id ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground hover:bg-white/5 border border-transparent'}`}
                    >
                        <t.icon className="w-4 h-4" /> {t.label}
                    </button>
                ))}
            </div>

            <div className="glass-card p-6 border-t-4 border-t-primary min-h-[500px]">
                {activeTab === 'fire' && <FireSimulator />}
                {activeTab === 'compound' && <CompoundInterest />}
                {activeTab === 'mei' && <MeiCalculator />}
            </div>
        </div>
    )
}

function FireSimulator() {
    const [patrimony, setPatrimony] = useState(50000)
    const [monthlyInvest, setMonthlyInvest] = useState(1500)
    const [yearlyYield, setYearlyYield] = useState(8) // 8% real yield above inflation
    const [targetIncome, setTargetIncome] = useState(5000)

    // Rule of 300 logic (or 4% safe withdrawal rate)
    const fireNumber = targetIncome * 300

    // NPER math approx
    // FV = PV * (1+i)^n + PMT * [ ((1+i)^n - 1) / i ]
    const monthlyRate = Math.pow(1 + yearlyYield / 100, 1 / 12) - 1
    let months = 0
    let currentPatrimony = patrimony

    if (monthlyInvest > 0 || currentPatrimony > 0) {
        while (currentPatrimony < fireNumber && months < 1200) { // arbitrary cap 100 years
            currentPatrimony = currentPatrimony * (1 + monthlyRate) + monthlyInvest
            months++
        }
    }

    const years = Math.floor(months / 12)
    const remainingMonths = months % 12

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-amber-500/10 p-5 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                <Flame className="w-8 h-8 text-amber-500 shrink-0 mt-1" />
                <div>
                    <h2 className="text-lg font-bold text-amber-500">Movimento F.I.R.E.</h2>
                    <p className="text-amber-500/70 text-sm mt-1">Financial Independence, Retire Early. Calcule quando você poderá viver apenas de rendimentos ("O Número Mágico"), baseado na regra dos 4% (ou de multiplicar sua renda desejada por 300).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Renda Mensal Desejada (R$)</label>
                        <input type="number" value={targetIncome} onChange={e => setTargetIncome(Number(e.target.value))} className="neural-input text-lg font-bold text-primary" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Patrimônio Atual (R$)</label>
                        <input type="number" value={patrimony} onChange={e => setPatrimony(Number(e.target.value))} className="neural-input" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Aporte Mensal (R$)</label>
                        <input type="number" value={monthlyInvest} onChange={e => setMonthlyInvest(Number(e.target.value))} className="neural-input" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5 flex justify-between">
                            Rentabilidade Real Anual
                            <span className="text-primary">{yearlyYield}%</span>
                        </label>
                        <input type="range" min="2" max="15" value={yearlyYield} onChange={e => setYearlyYield(Number(e.target.value))} className="w-full accent-primary h-2 bg-black/30 rounded-lg appearance-none cursor-pointer" />
                        <p className="text-[10px] text-muted-foreground mt-1">Juros acima da inflação (IPCA+)</p>
                    </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-amber-500 to-primary" />
                    <p className="text-muted-foreground uppercase text-xs font-bold tracking-widest mb-2">Seu Número Mágico F.I.R.E.</p>
                    <p className="text-4xl md:text-5xl font-bold text-foreground mb-6" style={{ textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>
                        {formatCurrency(fireNumber)}
                    </p>

                    <div className="w-full h-px bg-white/10 mb-6" />

                    <p className="text-muted-foreground text-sm mb-2">Mantendo seus aportes de {formatCurrency(monthlyInvest)}, você atingirá Independência Financeira em:</p>
                    <div className="flex items-center gap-2 justify-center">
                        <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">{years} anos</span>
                        {remainingMonths > 0 && <span className="text-lg font-medium text-muted-foreground">e {remainingMonths} meses</span>}
                    </div>
                </div>
            </div>
        </div>
    )
}

function CompoundInterest() {
    const [initialAmount, setInitialAmount] = useState(1000)
    const [monthlyAmount, setMonthlyAmount] = useState(500)
    const [annualRate, setAnnualRate] = useState(10.75) // Selic example
    const [periodYears, setPeriodYears] = useState(10)

    const months = periodYears * 12
    const monthlyRateStr = (Math.pow(1 + annualRate / 100, 1 / 12) - 1)

    let currentVal = initialAmount
    let invested = initialAmount

    for (let i = 0; i < months; i++) {
        currentVal = currentVal * (1 + monthlyRateStr) + monthlyAmount
        invested += monthlyAmount
    }

    const generatedInterest = currentVal - invested

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Valor Inicial</label>
                    <input type="number" value={initialAmount} onChange={e => setInitialAmount(Number(e.target.value))} className="neural-input" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Aporte Mensal</label>
                    <input type="number" value={monthlyAmount} onChange={e => setMonthlyAmount(Number(e.target.value))} className="neural-input" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Taxa Anual (%)</label>
                    <input type="number" step="0.01" value={annualRate} onChange={e => setAnnualRate(Number(e.target.value))} className="neural-input" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Período (Anos)</label>
                    <input type="number" value={periodYears} onChange={e => setPeriodYears(Number(e.target.value))} className="neural-input" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                <div className="glass-card p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Total Investido (Do seu bolso)</p>
                    <p className="text-xl font-bold text-foreground">{formatCurrency(invested)}</p>
                </div>
                <div className="glass-card p-6 text-center border-b-2 border-emerald-400">
                    <p className="text-sm text-emerald-400 mb-1">Juros Gerados no Período</p>
                    <p className="text-2xl font-bold text-emerald-400">+{formatCurrency(generatedInterest)}</p>
                </div>
                <div className="glass-card p-6 text-center border-b-2 border-primary">
                    <p className="text-sm text-primary mb-1">Montante Final (Bruto)</p>
                    <p className="text-3xl font-bold text-primary">{formatCurrency(currentVal)}</p>
                </div>
            </div>
        </div>
    )
}

function MeiCalculator() {
    const [yearlyGross, setYearlyGross] = useState(81000)
    const isOverLimit = yearlyGross > 81000

    const monthlyAvg = yearlyGross / 12
    const dasTax = 76.60 // Aprox for Servicos in 2024
    const currentNetIncome = monthlyAvg - dasTax

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            <div className="text-center">
                <Landmark className="w-12 h-12 text-primary mx-auto mb-4 opacity-80" />
                <h2 className="text-xl font-bold mb-2">Calculadora Simples MEI</h2>
                <p className="text-muted-foreground text-sm">Controle de faturamento e alertas de limite PJ</p>
            </div>

            <div className="glass-card p-6 space-y-6">
                <div>
                    <label className="flex items-center justify-between text-base font-semibold text-foreground mb-4">
                        Faturamento Bruto Anual (Projetado ou Realizado)
                        <span className={isOverLimit ? 'text-red-400' : 'text-emerald-400'}>{formatCurrency(yearlyGross)}</span>
                    </label>
                    <input type="range" min="0" max="150000" step="1000" value={yearlyGross} onChange={e => setYearlyGross(Number(e.target.value))} className="w-full accent-primary h-2 bg-black/30 rounded-lg appearance-none cursor-pointer" />
                </div>

                {isOverLimit && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3 text-sm">
                        <Flame className="w-5 h-5 shrink-0" />
                        <p><strong>Cuidado: Limite Ultrapassado!</strong> Você faturou mais que R$ 81.000,00 no ano. Você precisará migrar para Microempresa (ME) no Simples Nacional e deverá pagar impostos retroativos. Consulte seu contador urgentemente.</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl text-center">
                        <p className="text-xs text-muted-foreground uppercase mb-1">Faturamento Médio Mensal</p>
                        <p className="text-xl font-bold">{formatCurrency(monthlyAvg)}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl text-center relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                        <p className="text-xs text-muted-foreground uppercase mb-1">Renda Líquida Mensal (Aprox.)</p>
                        <p className="text-xl font-bold text-emerald-400">{formatCurrency(currentNetIncome)}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">- DAS MEI Ex: {formatCurrency(dasTax)}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
