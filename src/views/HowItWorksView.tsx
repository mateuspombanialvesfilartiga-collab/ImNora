import React from 'react';
import {
  KeyRound,
  Briefcase,
  Home,
  Users,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  Calculator,
  Lock,
  Percent,
  CheckCircle2
} from 'lucide-react';

interface HowItWorksViewProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const HowItWorksView: React.FC<HowItWorksViewProps> = ({ onOpenAuth }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Intro */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#081426] text-[#C5A880] text-xs font-semibold border border-[#C5A880]/30 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          O Modelo Tripartite da Imnora
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#081426] tracking-tight leading-tight">
          O corretor propõe sua taxa de comissão.<br />
          O proprietário escolhe quem representa seu patrimônio.
        </h1>
        <p className="text-sm text-[#5C5346] leading-relaxed">
          No mercado tradicional, imobiliárias impõem taxas fixas de 6% e colocam placas sem garantia de atendimento exclusivo. 
          A <strong>Imnora</strong> inverte essa lógica: livre concorrência entre corretores autônomos com CRECI ativo, economia de até 40% em comissões e segurança jurídica em cada etapa.
        </p>
      </div>

      {/* 4 Steps Flow */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#E5D9C5] shadow-xs space-y-3 relative">
          <div className="w-10 h-10 rounded-xl bg-[#081426] text-[#C5A880] flex items-center justify-center font-extrabold text-base">
            1
          </div>
          <h3 className="font-bold text-[#081426] text-sm">Proprietário Anuncia Grátis</h3>
          <p className="text-xs text-[#5C5346] leading-relaxed">
            O proprietário cadastra fotos, especificações e valor do imóvel em 2 minutos. Sem taxas de adesão e sem falsas exclusividades.
          </p>
        </div>

        <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#E5D9C5] shadow-xs space-y-3 relative">
          <div className="w-10 h-10 rounded-xl bg-[#081426] text-[#C5A880] flex items-center justify-center font-extrabold text-base">
            2
          </div>
          <h3 className="font-bold text-[#081426] text-sm">Corretores Disputam</h3>
          <p className="text-xs text-[#5C5346] leading-relaxed">
            Profissionais credenciados com CRECI ativo enviam propostas competitivas (3%, 3.5%, 4%) detalhando plano de divulgação e fotos profissionais.
          </p>
        </div>

        <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#E5D9C5] shadow-xs space-y-3 relative">
          <div className="w-10 h-10 rounded-xl bg-[#081426] text-[#C5A880] flex items-center justify-center font-extrabold text-base">
            3
          </div>
          <h3 className="font-bold text-[#081426] text-sm">Escolha Transparente</h3>
          <p className="text-xs text-[#5C5346] leading-relaxed">
            O proprietário compara o currículo, reputação com avaliações verificadas e menor comissão, escolhendo quem melhor atende suas expectativas.
          </p>
        </div>

        <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#E5D9C5] shadow-xs space-y-3 relative">
          <div className="w-10 h-10 rounded-xl bg-[#081426] text-[#C5A880] flex items-center justify-center font-extrabold text-base">
            4
          </div>
          <h3 className="font-bold text-[#081426] text-sm">Venda com Sucesso</h3>
          <p className="text-xs text-[#5C5346] leading-relaxed">
            Compradores agendam visitas pelo chat seguro. A comissão negociada só é liberada com a escritura definitiva lavrada em cartório.
          </p>
        </div>
      </div>

      {/* Deep Dive on the 3 Roles */}
      <div className="bg-[#FAF8F5] rounded-3xl p-8 border border-[#E5D9C5] space-y-8">
        <h2 className="text-xl font-bold text-[#081426] text-center">
          Vantagens Exclusivas para Cada Parte
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Proprietário */}
          <div className="bg-white p-6 rounded-2xl border border-[#EFE9DE] space-y-3">
            <div className="w-9 h-9 rounded-xl bg-[#081426] text-[#C5A880] flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-[#081426] text-sm">Para o Proprietário</h4>
            <ul className="text-xs text-[#5C5346] space-y-2 leading-relaxed">
              <li>✓ Economia real: comissões a partir de 3% em vez de 6% fixos.</li>
              <li>✓ Avaliações autênticas: veja o histórico de vendas de cada corretor.</li>
              <li>✓ Autonomia total: possibilidade de reabrir disputa caso o corretor não entregue o combinado.</li>
            </ul>
          </div>

          {/* Corretor Autônomo */}
          <div className="bg-white p-6 rounded-2xl border border-[#EFE9DE] space-y-3">
            <div className="w-9 h-9 rounded-xl bg-[#081426] text-[#C5A880] flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-[#081426] text-sm">Para o Corretor Autônomo</h4>
            <ul className="text-xs text-[#5C5346] space-y-2 leading-relaxed">
              <li>✓ 100% dos honorários: sem intermediários retendo metade da sua comissão.</li>
              <li>✓ Acesso direto a imóveis reais de proprietários dispostos a negociar.</li>
              <li>✓ Perfil profissional com autoridade, número de CRECI auditado e avaliações.</li>
            </ul>
          </div>

          {/* Comprador */}
          <div className="bg-white p-6 rounded-2xl border border-[#EFE9DE] space-y-3">
            <div className="w-9 h-9 rounded-xl bg-[#081426] text-[#C5A880] flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-[#081426] text-sm">Para o Comprador</h4>
            <ul className="text-xs text-[#5C5346] space-y-2 leading-relaxed">
              <li>✓ Sem imóveis falsos, repetidos ou desatualizados.</li>
              <li>✓ Atendimento direto com corretor credenciado e comprometido.</li>
              <li>✓ Chat seguro para agendamento de visitas e envio de propostas.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Security & Rules summary */}
      <div className="bg-[#081426] text-[#FAF8F5] rounded-3xl p-8 border border-[#1A2E4C] shadow-lg space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0F223D] text-[#C5A880] flex items-center justify-center border border-[#C5A880]/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#FAF8F5]">Segurança Jurídica de Primeira Classe na Imnora</h3>
            <p className="text-xs text-[#D4C3A3]">Regras de negócio e intermediação protegida</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#D4C3A3] pt-2">
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-[#C5A880] mt-0.5 shrink-0" />
            <span>
              <strong className="text-[#FAF8F5]">Intermediação Protegida:</strong> A comunicação segue padrões rigorosos do COFECI para resguardar compradores e corretores.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#C5A880] mt-0.5 shrink-0" />
            <span>
              <strong className="text-[#FAF8F5]">Validação de CRECI:</strong> Corretores passam por validação documental antes de realizarem candidaturas e propostas.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Award className="w-4 h-4 text-[#C5A880] mt-0.5 shrink-0" />
            <span>
              <strong className="text-[#FAF8F5]">Avaliações Únicas e Autênticas:</strong> Apenas quem concretizou negócio pode avaliar o corretor, eliminando depoimentos falsos.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Calculator className="w-4 h-4 text-[#C5A880] mt-0.5 shrink-0" />
            <span>
              <strong className="text-[#FAF8F5]">Transações Atômicas:</strong> A escolha do corretor pelo proprietário é registrada com integridade referencial definitiva.
            </span>
          </div>
        </div>

        <div className="pt-4 flex justify-center">
          <button
            onClick={() => onOpenAuth('register')}
            className="px-6 py-3 bg-[#C5A880] hover:bg-[#B89563] text-[#081426] font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            Cadastre-se Gratuitamente na Imnora
          </button>
        </div>
      </div>
    </div>
  );
};
