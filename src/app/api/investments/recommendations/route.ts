// src/app/api/investments/recommendations/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { InvestmentAIRecommender } from '@/lib/investments/ai-recommender';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Buscar perfil do usuário
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        // Buscar posições atuais
        const { data: positions } = await supabase
            .from('investment_positions')
            .select('*')
            .limit(50); // Simulado pois a tabela pode estar vazia agora

        const recommender = new InvestmentAIRecommender();
        const recommendations = await recommender.generatePortfolioRecommendations(
            profile as any,
            (positions as any) || []
        );

        return NextResponse.json({ data: recommendations });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
