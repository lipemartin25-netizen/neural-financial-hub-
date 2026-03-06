'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, CreditCard, Ban, Scale, RefreshCw, Mail } from 'lucide-react'

const C = {
    bg: '#0b0d10', card: '#12151a', gold: '#c9a858',
    goldGrad: 'linear-gradient(135deg, #c9a858, #9a7d3a)',
    text: '#ebe6da', textMuted: '#6b7280', border: 'rgba(255,255,255,0.06)',
    secondary: 'rgba(255,255,255,0.03)',
}

const sectionStyle: React.CSSProperties = {
    marginBottom: 32, padding: 24, borderRadius: 16,
    backgroundColor: C.card, border: `1px solid ${C.border}`,
}

const h2Style: React.CSSProperties = {
    fontSize: 18, fontWeight: 700, color: C.gold, marginBottom: 16,
    display: 'flex', alignItems: 'center', gap: 10,
}

const pStyle: React.CSSProperties = {
    fontSize: 14, lineHeight: 1.8, color: C.textMuted, marginBottom: 12,
}

const liStyle: React.CSSProperties = {
    fontSize: 14, lineHeight: 1.8, color: C.textMuted, marginBottom: 6,
    paddingLeft: 8,
}

export default function TermsPage() {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: C.bg, color: C.text }}>
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px 80px' }}>
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Link href="/" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14,
                        color: C.gold, textDecoration: 'none', marginBottom: 32,
                    }}>
                        <ArrowLeft size={16} /> Voltar ao início
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 14, background: C.goldGrad,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <FileText size={24} style={{ color: C.bg }} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text }}>
                                Termos de Serviço
                            </h1>
                            <p style={{ fontSize: 13, color: C.textMuted }}>
                                Última atualização: 06 de março de 2026
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <p style={{ ...pStyle, marginTop: 24, marginBottom: 32, fontSize: 15 }}>
                        Bem-vindo à <strong style={{ color: C.text }}>Neural Finance Hub</strong>. Ao acessar ou
                        utilizar nossa plataforma, você concorda com estes Termos de Serviço. Leia-os atentamente.
                    </p>
                </motion.div>

                {/* Seções */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={sectionStyle}>
                    <h2 style={h2Style}><CheckCircle size={20} /> 1. Aceitação dos Termos</h2>
                    <p style={pStyle}>
                        Ao criar uma conta ou utilizar qualquer funcionalidade da Neural Finance Hub, você declara que:
                    </p>
                    <ul style={{ listStyle: 'disc', paddingLeft: 24 }}>
                        <li style={liStyle}>Tem pelo menos 18 anos de idade ou autorização de um responsável legal</li>
                        <li style={liStyle}>Concorda integralmente com estes Termos de Serviço e com a nossa Política de Privacidade</li>
                        <li style={liStyle}>As informações fornecidas são verdadeiras, completas e atualizadas</li>
                    </ul>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={sectionStyle}>
                    <h2 style={h2Style}><FileText size={20} /> 2. Descrição do Serviço</h2>
                    <p style={pStyle}>
                        A Neural Finance Hub é uma plataforma de <strong style={{ color: C.text }}>gestão financeira pessoal
                            com inteligência artificial</strong> que oferece:
                    </p>
                    <ul style={{ listStyle: 'disc', paddingLeft: 24 }}>
                        <li style={liStyle}>Controle de transações, contas bancárias e cartões de crédito</li>
                        <li style={liStyle}>Categorização automática de despesas via IA</li>
                        <li style={liStyle}>Conexão com bancos via Open Finance (Pluggy)</li>
                        <li style={liStyle}>Acompanhamento patrimonial, metas financeiras e reserva de emergência</li>
                        <li style={liStyle}>Relatórios, simulações e projeções financeiras</li>
                        <li style={liStyle}>Gestão de boletos, assinaturas e planejamento de dívidas</li>
                    </ul>
                    <p style={{ ...pStyle, marginTop: 12, fontWeight: 500, color: C.text }}>
                        ⚠️ A Neural Finance Hub NÃO é uma instituição financeira, corretora de valores ou consultoria
                        de investimentos. As informações fornecidas têm caráter exclusivamente informativo e educacional.
                    </p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={sectionStyle}>
                    <h2 style={h2Style}><CreditCard size={20} /> 3. Planos e Pagamentos</h2>
                    <p style={pStyle}>A plataforma oferece diferentes planos de acesso:</p>
                    <ul style={{ listStyle: 'disc', paddingLeft: 24 }}>
                        <li style={liStyle}><strong style={{ color: C.text }}>Plano Gratuito:</strong> acesso às funcionalidades básicas sem custo</li>
                        <li style={liStyle}><strong style={{ color: C.text }}>Plano Pro (R$ 19,90/mês):</strong> acesso a funcionalidades avançadas de IA, Open Finance e relatórios premium</li>
                        <li style={liStyle}><strong style={{ color: C.text }}>Plano Enterprise:</strong> recursos sob medida para empresas e consultores financeiros</li>
                    </ul>
                    <p style={pStyle}>
                        Os pagamentos são processados de forma segura via <strong style={{ color: C.text }}>Stripe</strong>.
                        Você pode cancelar sua assinatura a qualquer momento, mantendo o acesso até o final do período pago.
                    </p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={sectionStyle}>
                    <h2 style={h2Style}><Ban size={20} /> 4. Uso Proibido</h2>
                    <p style={pStyle}>Ao utilizar a plataforma, você concorda em NÃO:</p>
                    <ul style={{ listStyle: 'disc', paddingLeft: 24 }}>
                        <li style={liStyle}>Utilizar a plataforma para atividades ilegais, fraudulentas ou que violem leis brasileiras</li>
                        <li style={liStyle}>Tentar acessar dados de outros usuários ou contornar medidas de segurança</li>
                        <li style={liStyle}>Realizar engenharia reversa, scraping ou uso automatizado não autorizado</li>
                        <li style={liStyle}>Compartilhar suas credenciais de acesso com terceiros</li>
                        <li style={liStyle}>Inserir dados falsos ou enganosos na plataforma</li>
                    </ul>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={sectionStyle}>
                    <h2 style={h2Style}><AlertTriangle size={20} /> 5. Limitação de Responsabilidade</h2>
                    <p style={pStyle}>
                        A Neural Finance Hub se esforça para manter a plataforma funcionando com o máximo de precisão e
                        disponibilidade, porém:
                    </p>
                    <ul style={{ listStyle: 'disc', paddingLeft: 24 }}>
                        <li style={liStyle}>Não garantimos que o serviço estará disponível ininterruptamente</li>
                        <li style={liStyle}>Cálculos, projeções e análises geradas por IA são estimativas e não devem ser tratados como aconselhamento financeiro profissional</li>
                        <li style={liStyle}>Não nos responsabilizamos por decisões financeiras tomadas com base nas informações da plataforma</li>
                        <li style={liStyle}>Dados importados via Open Finance dependem da disponibilidade dos bancos e da Pluggy</li>
                    </ul>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={sectionStyle}>
                    <h2 style={h2Style}><Scale size={20} /> 6. Propriedade Intelectual</h2>
                    <p style={pStyle}>
                        Todo o conteúdo da plataforma — incluindo código-fonte, design, logotipos, textos, algoritmos de IA
                        e interfaces — é de propriedade exclusiva da Neural Finance Hub e protegido pelas leis brasileiras
                        de propriedade intelectual.
                    </p>
                    <p style={pStyle}>
                        Os dados financeiros inseridos pelo usuário são de propriedade do próprio usuário.
                    </p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} style={sectionStyle}>
                    <h2 style={h2Style}><RefreshCw size={20} /> 7. Alterações nos Termos</h2>
                    <p style={pStyle}>
                        Reservamo-nos o direito de alterar estes Termos de Serviço a qualquer momento. Alterações
                        significativas serão comunicadas por e-mail ou por notificação dentro da plataforma com pelo
                        menos <strong style={{ color: C.text }}>15 dias de antecedência</strong>. O uso continuado
                        da plataforma após as alterações constitui aceitação dos novos termos.
                    </p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={sectionStyle}>
                    <h2 style={h2Style}><Mail size={20} /> 8. Contato</h2>
                    <p style={pStyle}>
                        Para dúvidas sobre estes termos, entre em contato:
                    </p>
                    <p style={{ fontSize: 15, color: C.gold, fontWeight: 600 }}>
                        📧 contato@neuralfinancehub.com.br
                    </p>
                    <p style={{ ...pStyle, marginTop: 12 }}>
                        Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da
                        Comarca do domicílio do usuário para dirimir quaisquer controvérsias decorrentes destes termos.
                    </p>
                </motion.div>

                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: 40 }}>
                    <Link href="/privacy" style={{ fontSize: 13, color: C.gold, textDecoration: 'underline', marginRight: 24 }}>
                        Política de Privacidade
                    </Link>
                    <Link href="/" style={{ fontSize: 13, color: C.textMuted, textDecoration: 'none' }}>
                        Voltar ao início
                    </Link>
                </div>
            </div>
        </div>
    )
}
