/**
 * Tipos TypeScript que espelham os DTOs da Campus Virtual API.
 * Fonte da verdade: contrato OpenAPI servido em /api-docs
 * (Swagger UI em http://localhost:8080/swagger-ui/index.html).
 */

// ---------------------------------------------------------------------------
// Envelope padrão de resposta da API
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type Role = "ALUNO" | "PROFESSOR" | "GESTOR";
export type Tema = "CLARO" | "ESCURO";
export type MatriculaStatus = "PENDENTE" | "ATIVA" | "CANCELADA";
export type AtividadeTipo = "ATIVIDADE" | "PROVA" | "TESTE";
export type FrequenciaStatus = "PRESENCA" | "FALTA";
export type ContestacaoTipo = "NOTA" | "FALTA";
export type ContestacaoStatus = "ABERTA" | "EM_ANALISE" | "DEFERIDA" | "INDEFERIDA";
export type MensagemVisibilidade = "PRIVADA" | "FORUM";
export type MaterialTipo = "PDF" | "VIDEO" | "LINK" | "OUTRO";
export type ProvaSubstitutivaStatus = "SOLICITADA" | "APROVADA" | "REJEITADA" | "AGENDADA";
export type AuditoriaAcao = "CRIACAO" | "ATUALIZACAO" | "EXCLUSAO" | "ACESSO_NEGADO";

// ---------------------------------------------------------------------------
// Identidade & Acesso (IAM)
// ---------------------------------------------------------------------------

export interface LoginRequest {
  credencial: string;
  senha: string;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
  cpf?: string;
  matricula?: string;
  role: Role;
  telefone?: string;
}

export interface RecuperarSenhaRequest {
  email: string;
}

export interface RedefinirSenhaRequest {
  token: string;
  novaSenha: string;
}

export interface UsuarioResponse {
  id: string;
  nome: string;
  email: string;
  cpf?: string;
  matricula?: string;
  role: Role;
  telefone?: string;
  fotoUrl?: string;
  ativo: boolean;
  bloqueado: boolean;
  tema: Tema;
  tamanhoFonte: number;
  somNotificacao: boolean;
  criadoEm: string;
}

export interface UsuarioResumoResponse {
  id: string;
  nome: string;
  email: string;
  role: Role;
}

export interface TokenResponse {
  token: string;
  tipo: string;
  expiresIn: number;
  usuario: UsuarioResponse;
}

export interface AtualizarPerfilRequest {
  nome?: string;
  telefone?: string;
  fotoUrl?: string;
}

export interface PreferenciasRequest {
  tema: Tema;
  tamanhoFonte: number;
  somNotificacao: boolean;
}

// ---------------------------------------------------------------------------
// Acadêmico / Disciplinas / Matrículas
// ---------------------------------------------------------------------------

export interface DisciplinaRequest {
  nome: string;
  codigo: string;
  descricao?: string;
  periodo: string;
  professorId?: string;
}

export interface DisciplinaResponse {
  id: string;
  nome: string;
  codigo: string;
  descricao?: string;
  periodo: string;
  professor?: UsuarioResumoResponse;
  totalMatriculados: number;
  criadoEm: string;
}

export interface DisciplinaResumoResponse {
  id: string;
  nome: string;
  codigo: string;
  periodo: string;
}

export interface MatriculaRequest {
  alunoId?: string;
  disciplinaId: string;
}

export interface MatriculaResponse {
  id: string;
  aluno: UsuarioResumoResponse;
  disciplina: DisciplinaResumoResponse;
  status: MatriculaStatus;
  criadoEm: string;
}

// ---------------------------------------------------------------------------
// Atividades, Provas, Notas, Submissões
// ---------------------------------------------------------------------------

export interface QuestaoRequest {
  enunciado: string;
  pontuacao: number;
  ordem?: number;
  textoAlternativo?: string;
}

export interface QuestaoResponse {
  id: string;
  enunciado: string;
  pontuacao: number;
  ordem?: number;
  textoAlternativo?: string;
}

export interface AtividadeRequest {
  disciplinaId: string;
  tipo: AtividadeTipo;
  titulo: string;
  descricao?: string;
  prazo?: string;
  pontuacaoMaxima?: number;
  textoAlternativo?: string;
  publicada?: boolean;
  questoes?: QuestaoRequest[];
}

export interface AtividadeResponse {
  id: string;
  disciplina: DisciplinaResumoResponse;
  tipo: AtividadeTipo;
  titulo: string;
  descricao?: string;
  prazo?: string;
  pontuacaoMaxima?: number;
  textoAlternativo?: string;
  publicada: boolean;
  questoes?: QuestaoResponse[];
  criadoEm: string;
}

export interface AtividadeResumoResponse {
  id: string;
  titulo: string;
  tipo: AtividadeTipo;
  prazo?: string;
  pontuacaoMaxima?: number;
}

export interface NotaRequest {
  alunoId: string;
  valor: number;
}

export interface NotaLoteRequest {
  notas: NotaRequest[];
}

export interface NotaResponse {
  id: string;
  atividade: AtividadeResumoResponse;
  aluno: UsuarioResumoResponse;
  valor: number;
  publicada: boolean;
  atualizadoEm: string;
}

export interface SubmissaoResponse {
  id: string;
  atividade: AtividadeResumoResponse;
  aluno: UsuarioResumoResponse;
  arquivoId: string;
  nomeArquivo: string;
  foraDoPrazo: boolean;
  enviadoEm: string;
}

// ---------------------------------------------------------------------------
// Frequência
// ---------------------------------------------------------------------------

export interface FrequenciaItemRequest {
  alunoId: string;
  presente: boolean;
  justificativa?: string;
}

export interface FrequenciaRegistroRequest {
  disciplinaId: string;
  data: string;
  itens: FrequenciaItemRequest[];
}

export interface FrequenciaEdicaoRequest {
  presente: boolean;
  justificativa?: string;
}

export interface FrequenciaResponse {
  id: string;
  disciplina: DisciplinaResumoResponse;
  aluno: UsuarioResumoResponse;
  data: string;
  status: FrequenciaStatus;
  justificativa?: string;
}

export interface FrequenciaResumoResponse {
  disciplina: DisciplinaResumoResponse;
  totalAulas: number;
  presencas: number;
  faltas: number;
  percentualPresenca: number;
  minimoExigido: number;
  atingiuMinimo: boolean;
}

// ---------------------------------------------------------------------------
// Contestações
// ---------------------------------------------------------------------------

export interface ContestacaoRequest {
  tipo: ContestacaoTipo;
  disciplinaId: string;
  registroId: string;
  justificativa: string;
}

export interface ContestacaoParecerRequest {
  status: ContestacaoStatus;
  parecer?: string;
  encaminhadoParaId?: string;
}

export interface ContestacaoResponse {
  id: string;
  protocolo: string;
  tipo: ContestacaoTipo;
  disciplina: DisciplinaResumoResponse;
  aluno: UsuarioResumoResponse;
  registroId: string;
  justificativa: string;
  status: ContestacaoStatus;
  parecer?: string;
  encaminhadoPara?: UsuarioResumoResponse;
  criadoEm: string;
  atualizadoEm: string;
}

// ---------------------------------------------------------------------------
// Comunicação — Fóruns e Mensagens
// ---------------------------------------------------------------------------

export interface ForumRequest {
  disciplinaId: string;
  titulo: string;
  descricao?: string;
}

export interface ForumResponse {
  id: string;
  disciplina: DisciplinaResumoResponse;
  titulo: string;
  descricao?: string;
  criadoEm: string;
}

export interface TopicoRequest {
  titulo: string;
}

export interface TopicoResponse {
  id: string;
  forumId: string;
  titulo: string;
  autor: UsuarioResumoResponse;
  criadoEm: string;
}

export interface MensagemForumRequest {
  conteudo: string;
}

export interface MensagemPrivadaRequest {
  /** Identifica o destinatário pelo ID (uso interno, ex.: responder uma conversa). */
  destinatarioId?: string;
  /** Alternativa pública ao ID: o destinatário é resolvido pelo e-mail no back-end. */
  destinatarioEmail?: string;
  disciplinaId?: string;
  conteudo: string;
}

export interface MensagemResponse {
  id: string;
  autor: UsuarioResumoResponse;
  visibilidade: MensagemVisibilidade;
  conteudo: string;
  destinatario?: UsuarioResumoResponse;
  topicoId?: string;
  lida: boolean;
  criadoEm: string;
}

// ---------------------------------------------------------------------------
// Materiais & Mídia
// ---------------------------------------------------------------------------

export interface MaterialResponse {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: MaterialTipo;
  textoAlternativo?: string;
  urlExterna?: string;
  arquivoId?: string;
  nomeArquivo?: string;
  mimeType?: string;
  tamanho?: number;
  disciplina: DisciplinaResumoResponse;
  autor: UsuarioResumoResponse;
  criadoEm: string;
}

// ---------------------------------------------------------------------------
// Provas Substitutivas
// ---------------------------------------------------------------------------

export interface ProvaSubstitutivaRequest {
  disciplinaId: string;
  justificativa: string;
}

export interface ProvaSubstitutivaDecisaoRequest {
  status: ProvaSubstitutivaStatus;
  parecer?: string;
  agendadaPara?: string;
}

export interface ProvaSubstitutivaResponse {
  id: string;
  aluno: UsuarioResumoResponse;
  disciplina: DisciplinaResumoResponse;
  justificativa: string;
  status: ProvaSubstitutivaStatus;
  agendadaPara?: string;
  parecer?: string;
  avaliadaPor?: UsuarioResumoResponse;
  criadoEm: string;
}

// ---------------------------------------------------------------------------
// Gestão & Analytics
// ---------------------------------------------------------------------------

export interface DashboardResponse {
  totalAlunos: number;
  totalProfessores: number;
  totalDisciplinas: number;
  totalAtividades: number;
  totalSubmissoes: number;
  taxaAprovacao: number;
  alunosEmRisco: number;
}

export interface AlunoRiscoResponse {
  aluno: UsuarioResumoResponse;
  disciplina: DisciplinaResumoResponse;
  mediaNotas: number;
  percentualPresenca: number;
  motivos: string[];
}

export interface DocentePendenteResponse {
  professor: UsuarioResumoResponse;
  disciplina: DisciplinaResumoResponse;
  atividadeId: string;
  atividadeTitulo: string;
  prazo?: string;
  totalAlunos: number;
  notasLancadas: number;
  notasPendentes: number;
}

export interface RelatorioItemResponse {
  aluno: UsuarioResumoResponse;
  mediaNotas: number;
  percentualPresenca: number;
  situacao: string;
}

export interface RelatorioDisciplinaResponse {
  disciplina: DisciplinaResumoResponse;
  itens: RelatorioItemResponse[];
}

export interface HistoricoAcademicoResponse {
  aluno: UsuarioResumoResponse;
  notas: NotaResponse[];
  frequenciaPorDisciplina: FrequenciaResumoResponse[];
  contestacoes: ContestacaoResponse[];
}

export interface AtividadeApoioRequest {
  titulo: string;
  descricao?: string;
  disciplinaId?: string;
  publicoAlvo?: string;
  agendadaPara: string;
}

export interface AtividadeApoioResponse {
  id: string;
  titulo: string;
  descricao?: string;
  disciplina?: DisciplinaResumoResponse;
  publicoAlvo?: string;
  agendadaPara: string;
  gestor: UsuarioResumoResponse;
  criadoEm: string;
}

// ---------------------------------------------------------------------------
// Recomendações
// ---------------------------------------------------------------------------

export interface RecomendacaoResponse {
  disciplina: DisciplinaResumoResponse;
  motivo: string;
  materiais: MaterialResponse[];
}

// ---------------------------------------------------------------------------
// Auditoria
// ---------------------------------------------------------------------------

export interface LogAuditoriaResponse {
  id: string;
  entidade: string;
  entidadeId: string;
  acao: AuditoriaAcao;
  responsavelId: string;
  responsavelNome: string;
  detalhe?: string;
  momento: string;
}
