'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck, Mail, Trash2, Globe } from 'lucide-react'

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

export default function PrivacyPolicyPage() {
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
                            <Shield size={24} style={{ color: C.bg }} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text }}>
                                Política de Privacidade
                            </h1>
                            <p style={{ fontSize: 13, color: C.textMuted }}>
                                Última atualização: 06 de março de 2026
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <p style={{ ...pStyle, marginTop: 24, marginBottom: 32, fontSize: 15 }}>
                        A <strong style={{ color: C.text }}>Neural Finance Hub</strong> valoriza a privacidade dos seus
                        usuários. Esta política descreve como coletamos, usamos, armazenamos e protegemos suas informações
                        pessoais em conformidade com a <strong style={{ color: C.text }}>Lei Geral de Proteção de Dados
                            (LGPD — Lei nº 13.709/2018)</strong>.
                    </p>
                </motion.div>

                {/* Seções */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={sectionStyle}>
                    <h2 style={h2Style}><Database size={20} /> 1. Dados que Coletamos</h2>
                    <p style={pStyle}>Coletamos os seguintes tipos de informações:</p>
                    <ul style={{ listStyle: 'disc', paddingLeft: 24 }}>
                        <li style={liStyle}><strong style={{ color: C.text }}>Dados de cadastro:</strong> nome, e-mail, foto do perfil (via Google/GitHub OAuth)</li>
                        <li style={liStyle}><strong style={{ color: C.text }}>Dados financeiros:</strong> transações, contas bancárias, investimentos, metas e orçamentos cadastrados voluntariamente pelo usuário</li>
                        <li style={liStyle}><strong style={{ color: C.text }}>Dados de Open Finance:</strong> informações bancárias sincronizadas via Pluggy (mediante autorização expressa)</li>
                        <li style={liStyle}><strong style={{ color: C.text }}>Dados de uso:</strong> logs de acesso, preferências de tema, idioma e navegação dentro da plataforma</li>
                    </ul>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={sectionStyle}>
                    <h2 style={h2Style}><Eye size={20} /> 2. Como Usamos seus Dados</h2>
                    <p style={pStyle}>Utilizamos suas informações para:</p>
                    <ul style={{ listStyle: 'disc', paddingLeft: 24 }}>
                        <li style={liStyle}>Fornecer e personalizar os serviços da plataforma</li>
                        <li style={liStyle}>Categorizar transações automaticamente com Inteligência Artificial</li>
                        <li style={liStyle}>Gerar relatórios financeiros, projeções patrimoniais e análises de saúde financeira</li>
                        <li style={liStyle}>Enviar notificações sobre vencimentos, metas atingidas e alertas financeiros</li>
                        <li style={liStyle}>Melhorar continuamente a experiência do usuário</li>
                    </ul>
                    <p style={{ ...pStyle, marginTop: 12, fontWeight: 500, color: C.text }}>
                        ⚠️ Jamais vendemos, alugamos ou compartilhamos seus dados com terceiros para fins de marketing.
                    </p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={sectionStyle}>
                    <h2 style={h2Style}><Lock size={20} /> 3. Segurança dos Dados</h2>
                    <p style={pStyle}>Implementamos medidas rigorosas de segurança:</p>
                    <ul style={{ listStyle: 'disc', paddingLeft: 24 }}>
                        <li style={liStyle}>Criptografia em trânsito (HTTPS/TLS) e em repouso</li>
                        <li style={liStyle}>Autenticação segura via Supabase Auth com suporte a OAuth 2.0</li>
                        <li style={liStyle}>Row Level Security (RLS) no banco de dados — cada usuário acessa apenas seus próprios dados</li>
                        <li style={liStyle}>Rate limiting para proteção contra ataques de força bruta</li>
                        <li style={liStyle}>Headers de segurança (HSTS, X-Frame-Options, CSP) em todas as rotas</li>
                    </ul>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={sectionStyle}>
                    <h2 style={h2Style}><Globe size={20} /> 4. Open Finance e Terceiros</h2>
                    <p style={pStyle}>
                        Quando você conecta uma conta bancária via Open Finance, utilizamos o serviço da
                        <strong style={{ color: C.text }}> Pluggy</strong> como intermediário regulamentado pelo Banco Central do Brasil.
                    </p>
                    <ul style={{ listStyle: 'disc', paddingLeft: 24 }}>
                        <li style={liStyle}>A conexão é 100% voluntária e pode ser revogada a qualquer momento</li>
                        <li style={liStyle}>Seus dados bancários são transmitidos com criptografia de ponta a ponta</li>
                        <li style={liStyle}>Não armazenamos senhas bancárias em nenhum momento</li>
                    </ul>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={sectionStyle}>
                    <h2 style={h2Style}><UserCheck size={20} /> 5. Seus Direitos (LGPD)</h2>
                    <p style={pStyle}>De acordo com a LGPD, você tem direito a:</p>
                    <ul style={{ listStyle: 'disc', paddingLeft: 24 }}>
                        <li style={liStyle}>Solicitar acesso aos seus dados pessoais</li>
                        <li style={liStyle}>Corrigir dados incompletos, inexatos ou desatualizados</li>
                        <li style={liStyle}>Solicitar a exclusão dos seus dados pessoais</li>
                        <li style={liStyle}>Revogar o consentimento a qualquer momento</li>
                        <li style={liStyle}>Solicitar a portabilidade dos dados</li>
                        <li style={liStyle}>Obter informações sobre com quem partilhamos seus dados</li>
                    </ul>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={sectionStyle}>
                    <h2 style={h2Style}><Trash2 size={20} /> 6. Retenção e Exclusão</h2>
                    <p style={pStyle}>
                        Seus dados são mantidos enquanto sua conta estiver ativa. Ao solicitar exclusão da conta,
                        todos os seus dados serão permanentemente removidos de nossos servidores em até
                        <strong style={{ color: C.text }}> 30 dias úteis</strong>.
                    </p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} style={sectionStyle}>
                    <h2 style={h2Style}><Mail size={20} /> 7. Contato</h2>
                    <p style={pStyle}>
                        Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato:
                    </p>
                    <p style={{ fontSize: 15, color: C.gold, fontWeight: 600 }}>
                        📧 privacidade@neuralfinancehub.com.br
                    </p>
                </motion.div>

                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: 40 }}>
                    <Link href="/terms" style={{ fontSize: 13, color: C.gold, textDecoration: 'underline', marginRight: 24 }}>
                        Termos de Serviço
                    </Link>
                    <Link href="/" style={{ fontSize: 13, color: C.textMuted, textDecoration: 'none' }}>
                        Voltar ao início
                    </Link>
                </div>
            </div>
        </div>
    )
}
