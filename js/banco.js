/* ============================================================
   Ligação com o banco de dados (Supabase)
   As duas informações abaixo ficam SÓ aqui. Todas as páginas usam este arquivo.
   A chave abaixo é a pública (publishable). Ela pode ficar no site:
   quem protege os dados são as regras de segurança (RLS) do banco.sql.
   Nunca coloque a chave secreta (service_role / secret) em arquivo nenhum.
   ============================================================ */
window.SUPABASE_URL = "https://lgsuvebudyojendmctyz.supabase.co";
window.SUPABASE_CHAVE = "sb_publishable_7vxxlLJBCVX9FDfynlACgQ_KbzezlsB";

/* O e-mail do dono do painel (o mesmo que está no banco.sql) */
window.EMAIL_DONO = "contatopressrodrigo@gmail.com";

/* Cria a conexão. Se a biblioteca do Supabase não carregar (internet fora, por exemplo),
   window.banco fica vazio e cada página segue funcionando do jeito que der. */
window.banco = (window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_CHAVE)
  : null;
