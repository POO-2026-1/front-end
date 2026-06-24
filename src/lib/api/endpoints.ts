/**
 * Funções tipadas para cada endpoint da Campus Virtual API, agrupadas por
 * módulo de negócio. Espelham os caminhos descritos no Swagger (/api/...).
 */

import { api } from "./client";
import type {
  AlunoRiscoResponse,
  AtividadeApoioRequest,
  AtividadeApoioResponse,
  AtividadeRequest,
  AtividadeResponse,
  AtualizarPerfilRequest,
  ContestacaoParecerRequest,
  ContestacaoRequest,
  ContestacaoResponse,
  ContestacaoStatus,
  DashboardResponse,
  DisciplinaRequest,
  DisciplinaResponse,
  DocentePendenteResponse,
  ForumRequest,
  ForumResponse,
  FrequenciaEdicaoRequest,
  FrequenciaRegistroRequest,
  FrequenciaResponse,
  FrequenciaResumoResponse,
  HistoricoAcademicoResponse,
  LogAuditoriaResponse,
  LoginRequest,
  MaterialResponse,
  MatriculaRequest,
  MatriculaResponse,
  MensagemForumRequest,
  MensagemPrivadaRequest,
  MensagemResponse,
  NotaLoteRequest,
  NotaRequest,
  NotaResponse,
  PageResponse,
  PreferenciasRequest,
  ProvaSubstitutivaDecisaoRequest,
  ProvaSubstitutivaRequest,
  ProvaSubstitutivaResponse,
  RecomendacaoResponse,
  RecuperarSenhaRequest,
  RedefinirSenhaRequest,
  RegisterRequest,
  RelatorioDisciplinaResponse,
  Role,
  SubmissaoResponse,
  TokenResponse,
  TopicoRequest,
  TopicoResponse,
  UsuarioResponse,
} from "./types";

// ---------------------------------------------------------------------------
// Auth (RF01, RF02, RF04)
// ---------------------------------------------------------------------------

export const authApi = {
  login: (body: LoginRequest) => api.post<TokenResponse>("/api/auth/login", body),
  register: (body: RegisterRequest) => api.post<UsuarioResponse>("/api/auth/register", body),
  recuperarSenha: (body: RecuperarSenhaRequest) =>
    api.post<void>("/api/auth/recuperar-senha", body),
  redefinirSenha: (body: RedefinirSenhaRequest) =>
    api.post<void>("/api/auth/redefinir-senha", body),
};

// ---------------------------------------------------------------------------
// Usuários (RF05, RF06, RF33)
// ---------------------------------------------------------------------------

export const usuariosApi = {
  me: () => api.get<UsuarioResponse>("/api/usuarios/me"),
  atualizarPerfil: (body: AtualizarPerfilRequest) =>
    api.put<UsuarioResponse>("/api/usuarios/me", body),
  atualizarPreferencias: (body: PreferenciasRequest) =>
    api.put<UsuarioResponse>("/api/usuarios/me/preferencias", body),
  listar: (params: { role?: Role; page?: number; size?: number } = {}) =>
    api.get<PageResponse<UsuarioResponse>>("/api/usuarios", params),
  porId: (id: string) => api.get<UsuarioResponse>(`/api/usuarios/${id}`),
  atualizar: (id: string, body: AtualizarPerfilRequest) =>
    api.put<UsuarioResponse>(`/api/usuarios/${id}`, body),
  bloqueio: (id: string, bloquear: boolean) =>
    api.patch<UsuarioResponse>(`/api/usuarios/${id}/bloqueio`, undefined, { bloquear }),
  reativar: (id: string) => api.patch<UsuarioResponse>(`/api/usuarios/${id}/reativar`),
  remover: (id: string) => api.delete<void>(`/api/usuarios/${id}`),
};

// ---------------------------------------------------------------------------
// Disciplinas & Matrículas (RF07, RF20)
// ---------------------------------------------------------------------------

export const disciplinasApi = {
  listar: (params: { page?: number; size?: number } = {}) =>
    api.get<PageResponse<DisciplinaResponse>>("/api/disciplinas", params),
  porId: (id: string) => api.get<DisciplinaResponse>(`/api/disciplinas/${id}`),
  criar: (body: DisciplinaRequest) => api.post<DisciplinaResponse>("/api/disciplinas", body),
  atualizar: (id: string, body: DisciplinaRequest) =>
    api.put<DisciplinaResponse>(`/api/disciplinas/${id}`, body),
  remover: (id: string) => api.delete<void>(`/api/disciplinas/${id}`),
};

export const matriculasApi = {
  minhas: (params: { page?: number; size?: number } = {}) =>
    api.get<PageResponse<MatriculaResponse>>("/api/matriculas/minhas", params),
  porDisciplina: (disciplinaId: string) =>
    api.get<MatriculaResponse[]>(`/api/matriculas/disciplina/${disciplinaId}`),
  criar: (body: MatriculaRequest) => api.post<MatriculaResponse>("/api/matriculas", body),
  aprovar: (id: string) => api.patch<MatriculaResponse>(`/api/matriculas/${id}/aprovar`),
  remover: (id: string) => api.delete<void>(`/api/matriculas/${id}`),
};

// ---------------------------------------------------------------------------
// Atividades, Notas, Submissões (RF10, RF21, RF24)
// ---------------------------------------------------------------------------

export const atividadesApi = {
  criar: (body: AtividadeRequest) => api.post<AtividadeResponse>("/api/atividades", body),
  porDisciplina: (disciplinaId: string) =>
    api.get<AtividadeResponse[]>(`/api/atividades/disciplina/${disciplinaId}`),
  porId: (id: string) => api.get<AtividadeResponse>(`/api/atividades/${id}`),
  atualizar: (id: string, body: AtividadeRequest) =>
    api.put<AtividadeResponse>(`/api/atividades/${id}`, body),
  remover: (id: string) => api.delete<void>(`/api/atividades/${id}`),
  publicar: (id: string) => api.patch<AtividadeResponse>(`/api/atividades/${id}/publicar`),

  submissoes: (atividadeId: string) =>
    api.get<SubmissaoResponse[]>(`/api/atividades/${atividadeId}/submissoes`),
  enviarSubmissao: (atividadeId: string, arquivo: File) => {
    const form = new FormData();
    form.append("file", arquivo); // o back-end espera o campo multipart "file"
    return api.upload<SubmissaoResponse>(`/api/atividades/${atividadeId}/submissoes`, form);
  },

  notas: (atividadeId: string) =>
    api.get<NotaResponse[]>(`/api/atividades/${atividadeId}/notas`),
  lancarNota: (atividadeId: string, body: NotaRequest) =>
    api.post<NotaResponse>(`/api/atividades/${atividadeId}/notas`, body),
  lancarNotasLote: (atividadeId: string, body: NotaLoteRequest) =>
    api.post<NotaResponse[]>(`/api/atividades/${atividadeId}/notas/lote`, body),
  publicarNotas: (atividadeId: string) =>
    api.patch<void>(`/api/atividades/${atividadeId}/notas/publicar`),
};

export const submissoesApi = {
  minhas: () => api.get<SubmissaoResponse[]>("/api/submissoes/minhas"),
};

export const notasApi = {
  minhas: () => api.get<NotaResponse[]>("/api/notas/minhas"),
};

// ---------------------------------------------------------------------------
// Frequência (RF11, RF25)
// ---------------------------------------------------------------------------

export const frequenciasApi = {
  registrar: (body: FrequenciaRegistroRequest) =>
    api.post<FrequenciaResponse[]>("/api/frequencias/registro", body),
  porDisciplina: (disciplinaId: string, data: string) =>
    api.get<FrequenciaResponse[]>(`/api/frequencias/disciplina/${disciplinaId}`, { data }),
  editar: (id: string, body: FrequenciaEdicaoRequest) =>
    api.put<FrequenciaResponse>(`/api/frequencias/${id}`, body),
  minhas: () => api.get<FrequenciaResponse[]>("/api/frequencias/minhas"),
  meuResumo: (disciplinaId: string) =>
    api.get<FrequenciaResumoResponse>(
      `/api/frequencias/minhas/disciplina/${disciplinaId}/resumo`,
    ),
};

// ---------------------------------------------------------------------------
// Contestações (RF12, RF32, RF34)
// ---------------------------------------------------------------------------

export const contestacoesApi = {
  criar: (body: ContestacaoRequest) =>
    api.post<ContestacaoResponse>("/api/contestacoes", body),
  minhas: (params: { page?: number; size?: number } = {}) =>
    api.get<PageResponse<ContestacaoResponse>>("/api/contestacoes/minhas", params),
  listar: (params: { status?: ContestacaoStatus; page?: number; size?: number } = {}) =>
    api.get<PageResponse<ContestacaoResponse>>("/api/contestacoes", params),
  porProtocolo: (protocolo: string) =>
    api.get<ContestacaoResponse>(`/api/contestacoes/protocolo/${protocolo}`),
  historicoAluno: (alunoId: string) =>
    api.get<ContestacaoResponse[]>(`/api/contestacoes/aluno/${alunoId}/historico`),
  parecer: (id: string, body: ContestacaoParecerRequest) =>
    api.patch<ContestacaoResponse>(`/api/contestacoes/${id}/parecer`, body),
};

// ---------------------------------------------------------------------------
// Comunicação — Fóruns e Mensagens (RF15, RF16, RF27)
// ---------------------------------------------------------------------------

export const forunsApi = {
  criar: (body: ForumRequest) => api.post<ForumResponse>("/api/foruns", body),
  porDisciplina: (disciplinaId: string) =>
    api.get<ForumResponse[]>(`/api/foruns/disciplina/${disciplinaId}`),
  topicos: (forumId: string) => api.get<TopicoResponse[]>(`/api/foruns/${forumId}/topicos`),
  criarTopico: (forumId: string, body: TopicoRequest) =>
    api.post<TopicoResponse>(`/api/foruns/${forumId}/topicos`, body),
  mensagens: (topicoId: string) =>
    api.get<MensagemResponse[]>(`/api/foruns/topicos/${topicoId}/mensagens`),
  responder: (topicoId: string, body: MensagemForumRequest) =>
    api.post<MensagemResponse>(`/api/foruns/topicos/${topicoId}/mensagens`, body),
};

export const mensagensApi = {
  enviar: (body: MensagemPrivadaRequest) =>
    api.post<MensagemResponse>("/api/mensagens", body),
  recebidas: () => api.get<MensagemResponse[]>("/api/mensagens/recebidas"),
  conversa: (usuarioId: string) =>
    api.get<MensagemResponse[]>(`/api/mensagens/conversa/${usuarioId}`),
  marcarLida: (id: string) => api.patch<MensagemResponse>(`/api/mensagens/${id}/lida`),
};

// ---------------------------------------------------------------------------
// Materiais & Mídia (RF13, RF22, RF23)
// ---------------------------------------------------------------------------

interface CriarMaterialParams {
  disciplinaId: string;
  titulo: string;
  descricao?: string;
  tipo?: string;
  textoAlternativo?: string;
  urlExterna?: string;
}

export const materiaisApi = {
  porDisciplina: (disciplinaId: string) =>
    api.get<MaterialResponse[]>(`/api/materiais/disciplina/${disciplinaId}`),
  porId: (id: string) => api.get<MaterialResponse>(`/api/materiais/${id}`),
  remover: (id: string) => api.delete<void>(`/api/materiais/${id}`),
  criar: (params: CriarMaterialParams, arquivo?: File) => {
    const form = new FormData();
    if (arquivo) form.append("file", arquivo); // o back-end espera o campo multipart "file"
    return api.upload<MaterialResponse>("/api/materiais", form, {
      disciplinaId: params.disciplinaId,
      titulo: params.titulo,
      descricao: params.descricao,
      tipo: params.tipo,
      textoAlternativo: params.textoAlternativo,
      urlExterna: params.urlExterna,
    });
  },
};

// ---------------------------------------------------------------------------
// Provas Substitutivas (RF17, RF26)
// ---------------------------------------------------------------------------

export const provasSubstitutivasApi = {
  solicitar: (body: ProvaSubstitutivaRequest) =>
    api.post<ProvaSubstitutivaResponse>("/api/provas-substitutivas", body),
  minhas: (params: { page?: number; size?: number } = {}) =>
    api.get<PageResponse<ProvaSubstitutivaResponse>>("/api/provas-substitutivas/minhas", params),
  porDisciplina: (disciplinaId: string) =>
    api.get<ProvaSubstitutivaResponse[]>(
      `/api/provas-substitutivas/disciplina/${disciplinaId}`,
    ),
  decidir: (id: string, body: ProvaSubstitutivaDecisaoRequest) =>
    api.patch<ProvaSubstitutivaResponse>(`/api/provas-substitutivas/${id}/decisao`, body),
};

// ---------------------------------------------------------------------------
// Recomendações (RF14)
// ---------------------------------------------------------------------------

export const recomendacoesApi = {
  minhas: () => api.get<RecomendacaoResponse[]>("/api/recomendacoes"),
};

// ---------------------------------------------------------------------------
// Gestão & Analytics (RF28–RF31, RF34, RF35)
// ---------------------------------------------------------------------------

export const gestaoApi = {
  dashboard: () => api.get<DashboardResponse>("/api/gestao/dashboard"),
  alertasRisco: () => api.get<AlunoRiscoResponse[]>("/api/gestao/alertas-risco"),
  monitoramentoNotas: () => api.get<DocentePendenteResponse[]>("/api/gestao/monitoramento-notas"),
  relatorioDisciplina: (disciplinaId: string) =>
    api.get<RelatorioDisciplinaResponse>(`/api/gestao/relatorios/disciplina/${disciplinaId}`),
  historicoAluno: (alunoId: string) =>
    api.get<HistoricoAcademicoResponse>(`/api/gestao/alunos/${alunoId}/historico`),
};

export const atividadesApoioApi = {
  listar: () => api.get<AtividadeApoioResponse[]>("/api/atividades-apoio"),
  criar: (body: AtividadeApoioRequest) =>
    api.post<AtividadeApoioResponse>("/api/atividades-apoio", body),
};

// ---------------------------------------------------------------------------
// Auditoria (RNF01)
// ---------------------------------------------------------------------------

export const auditoriaApi = {
  listar: (
    params: { entidade?: string; entidadeId?: string; page?: number; size?: number } = {},
  ) => api.get<PageResponse<LogAuditoriaResponse>>("/api/auditoria", params),
};
