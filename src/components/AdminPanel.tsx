import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { PlatformSetting, SecurityTestResult } from '../types.js';
import {
  ShieldCheck,
  Users,
  Building2,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Settings,
  FileText,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Sliders
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'verifications' | 'settings' | 'security_tests' | 'audit_logs'>('security_tests');
  const [metrics, setMetrics] = useState<any>(null);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<SecurityTestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testsSummary, setTestsSummary] = useState<{ allPassed: boolean; total: number; passed: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const fetchMetricsAndData = async () => {
    setIsLoading(true);
    try {
      const [mRes, vRes, sRes, lRes] = await Promise.all([
        apiRequest('/api/admin/metrics'),
        apiRequest('/api/admin/verifications'),
        apiRequest('/api/admin/settings'),
        apiRequest('/api/admin/audit-logs')
      ]);
      setMetrics(mRes.metrics);
      setVerifications(vRes.verifications);
      setSettings(sRes.settings);
      setAuditLogs(lRes.auditLogs);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetricsAndData();
    // Auto-run security tests on first mount for instant verification!
    runSecurityTestSuite();
  }, []);

  const runSecurityTestSuite = async () => {
    setIsRunningTests(true);
    try {
      const res = await apiRequest<{
        allPassed: boolean;
        totalTests: number;
        passedTests: number;
        results: SecurityTestResult[];
      }>('/api/admin/run-security-tests', { method: 'POST' });

      setTestResults(res.results);
      setTestsSummary({
        allPassed: res.allPassed,
        total: res.totalTests,
        passed: res.passedTests
      });
    } catch (err: any) {
      console.error('Error running security tests:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleDecision = async (id: string, decision: 'approved' | 'rejected' | 'suspended') => {
    try {
      await apiRequest(`/api/admin/verifications/${id}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision })
      });
      setMessage(`Corretor ${decision === 'approved' ? 'aprovado' : decision} com sucesso!`);
      fetchMetricsAndData();
    } catch (err: any) {
      setMessage(`Erro: ${err.message}`);
    }
  };

  const handleUpdateSetting = async (key: string, value: number) => {
    try {
      await apiRequest('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ key, value })
      });
      setMessage(`Configuração "${key}" atualizada.`);
      fetchMetricsAndData();
    } catch (err: any) {
      setMessage(`Erro: ${err.message}`);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Painel de Administração e Segurança
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Governança da plataforma elo, fila de credenciamento CRECI e validação de regras não-negociáveis.
          </p>
        </div>

        <button
          onClick={runSecurityTestSuite}
          disabled={isRunningTests}
          className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
          {isRunningTests ? 'Executando Testes...' : 'Rodar Testes de Segurança (Seção 11.9)'}
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="font-bold">&times;</button>
        </div>
      )}

      {/* Metrics overview */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="text-xs font-medium text-slate-400">Total Transacionado (GMV)</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {formatCurrency(metrics.financial?.total_gmv || 0)}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              {metrics.financial?.transactions_count || 0} vendas concluídas
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="text-xs font-medium text-slate-400">Receita da Plataforma elo</div>
            <div className="text-2xl font-extrabold text-purple-700 mt-1">
              {formatCurrency(metrics.financial?.total_revenue || 0)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Via taxa da plataforma
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="text-xs font-medium text-slate-400">Fila de Corretores</div>
            <div className="text-2xl font-extrabold text-amber-600 mt-1">
              {metrics.pendingVerificationsCount}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Aguardando análise de CRECI
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="text-xs font-medium text-slate-400">Imóveis no Marketplace</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {metrics.propertiesByStatus?.reduce((acc: number, curr: any) => acc + curr.count, 0) || 0}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Ativos e negociando
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('security_tests')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'security_tests'
              ? 'border-purple-700 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Testes Automatizados de Segurança (Seção 11.9)
          {testsSummary && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${testsSummary.allPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              {testsSummary.passed}/{testsSummary.total} OK
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('verifications')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'verifications'
              ? 'border-purple-700 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Fila de Verificação de CRECI
          {metrics?.pendingVerificationsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
              {metrics.pendingVerificationsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-purple-700 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Taxas & Parâmetros da Plataforma
        </button>

        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'audit_logs'
              ? 'border-purple-700 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Auditoria de Segurança
        </button>
      </div>

      {/* Tab 1: Security Test Suite (Section 11.9) */}
      {activeTab === 'security_tests' && (
        <div className="space-y-4">
          <div className="bg-purple-50/60 border border-purple-200/80 p-4 rounded-2xl flex items-start justify-between gap-4">
            <div className="text-xs text-purple-900 space-y-1">
              <div className="font-bold text-sm">Bateria de Segurança Automatizada — Seção 11.9</div>
              <p>
                O elo implementa verificação em nível de banco de dados e de API para todas as regras críticas:
                bloqueio de contato direto comprador-proprietário, independência estrita de taxas, prevenção de candidaturas duplicadas,
                aceitação atômica e proteção contra escalação de privilégios.
              </p>
            </div>
            <button
              onClick={runSecurityTestSuite}
              disabled={isRunningTests}
              className="shrink-0 px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
              Re-executar
            </button>
          </div>

          <div className="space-y-3">
            {testResults.map((test, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {test.passed ? (
                      <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                        <XCircle className="w-4 h-4" />
                      </span>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{test.testName}</h4>
                      <p className="text-[11px] text-slate-500">{test.requirement}</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                      test.passed ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {test.passed ? 'APROVADO' : 'FALHOU'}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 font-mono">
                  {test.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Verifications Queue */}
      {activeTab === 'verifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Fila de Corretores Autônomos</h3>
            <span className="text-xs text-slate-400">Total: {verifications.length} cadastros</span>
          </div>

          <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {verifications.map((v) => (
              <div key={v.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {v.photo_url ? (
                    <img src={v.photo_url} alt={v.full_name} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-800 text-white font-bold flex items-center justify-center">
                      {v.full_name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      {v.full_name}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        CRECI {v.creci_number}-{v.creci_state}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {v.email} • Documento: {v.document_url || 'CRECI Físico Anexado'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    v.status === 'approved' ? 'bg-emerald-50 text-emerald-800' :
                    v.status === 'rejected' ? 'bg-rose-50 text-rose-800' :
                    'bg-amber-50 text-amber-800'
                  }`}>
                    {v.status === 'approved' ? 'Aprovado' : v.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                  </span>

                  {v.status !== 'approved' && (
                    <button
                      onClick={() => handleDecision(v.id, 'approved')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Aprovar CRECI
                    </button>
                  )}

                  {v.status !== 'rejected' && (
                    <button
                      onClick={() => handleDecision(v.id, 'rejected')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Rejeitar
                    </button>
                  )}

                  {v.status === 'approved' && (
                    <button
                      onClick={() => handleDecision(v.id, 'suspended')}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Suspender
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Dynamic Platform Settings (Configurable, never hardcoded!) */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600">
            <strong>Arquitetura Dinâmica:</strong> Os parâmetros econômicos da plataforma elo são armazenados na tabela <code>platform_settings</code>. As chaves de taxa da plataforma e de comissão do corretor são completamente independentes e não interferem entre si.
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
            {settings.map((s) => (
              <div key={s.setting_key} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 text-sm font-mono">{s.setting_key}</div>
                  <div className="text-xs text-slate-500">{s.description}</div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    defaultValue={s.setting_value}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val !== s.setting_value) {
                        handleUpdateSetting(s.setting_key, val);
                      }
                    }}
                    className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-right"
                  />
                  <span className="text-xs text-slate-500 font-semibold">% ou R$</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'audit_logs' && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Trilha de Auditoria Imutável (Seção 11.8)</h3>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="p-3">Data/Hora</th>
                  <th className="p-3">Ação</th>
                  <th className="p-3">Entidade</th>
                  <th className="p-3">ID Alvo</th>
                  <th className="p-3">IP / Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3 font-bold text-slate-900">{log.action}</td>
                    <td className="p-3 text-slate-600">{log.target_entity || '-'}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">{log.target_id?.substring(0, 16) || '-'}</td>
                    <td className="p-3 text-slate-500 font-mono text-[11px] truncate max-w-xs">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
