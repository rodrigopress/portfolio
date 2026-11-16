/* ============================================================
   LIGA O PORTFÓLIO AO PAINEL
   1. Vídeos: o site lê a tabela "videos" (só os visíveis) e monta as categorias.
      Mudou no painel, mudou no site, sem publicar de novo.
   2. Formulário: cada mensagem entra na tabela "marcas" como Lead
      (e continua indo pro seu e-mail, como antes).
   3. Visitas: grava uma linha na tabela "visitas" por visita,
      sem serviço de fora e sem pedir nada pro visitante.
   Se o banco estiver fora do ar, o site segue funcionando normalmente.
   ============================================================ */
(function () {
  const db = window.banco;
  if (!db) return;

  /* ---------- 1. VÍDEOS ---------- */
  (async () => {
    try {
      const { data, error } = await db.from("videos")
        .select("titulo,link,nicho,marca,destaque,ordem")
        .eq("visivel", true)
        .order("ordem", { ascending: true });
      if (error || !Array.isArray(data)) return;
      const ehYoutube = (l) => /youtu\.?be/i.test(l);
      categorias.forEach(c => { c.videos = []; });
      data.forEach(v => {
        const cat = categorias.find(c => c.chave === v.nicho);
        if (!cat || !v.link) return;
        cat.videos.push({
          marca: v.marca || v.titulo || "",
          destaque: v.destaque || "",
          ...(ehYoutube(v.link) ? { youtube: v.link } : { arquivo: v.link })
        });
      });
      renderizaCategorias("revela visivel");
    } catch (e) { /* sem banco: o site fica como está */ }
  })();

  /* ---------- 2. FORMULÁRIO → MARCAS (como Lead) ---------- */
  window.gravaLeadNoBanco = async function (d) {
    try {
      const obs = [d.marca ? "Contato: " + d.nome : "", d.mensagem ? "Mensagem pelo site: " + d.mensagem : ""].filter(Boolean).join("\n");
      await db.from("marcas").insert({
        nome: (d.marca || d.nome || "").slice(0, 200),
        email: (d.email || "").slice(0, 200),
        situacao: "lead",
        obs: obs.slice(0, 5000),
        ultimo_contato: new Date().toISOString().slice(0, 10)
      });
    } catch (e) { /* se falhar, a mensagem ainda vai pro e-mail */ }
  };

  /* ---------- 3. VISITA ---------- */
  try {
    const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    const souEu = localStorage.getItem("naoContarVisita") === "1";
    const chave = "visitaContada:" + location.pathname;
    if (local || souEu || sessionStorage.getItem(chave)) return;
    sessionStorage.setItem(chave, "1");

    const params = new URLSearchParams(location.search);
    let origem = params.get("utm_source") || params.get("origem") || "";
    if (!origem && document.referrer) {
      let host = "";
      try { host = new URL(document.referrer).hostname.replace(/^www\./, ""); } catch (e) {}
      if (host && host !== location.hostname) origem = host;
    }
    const nomes = [
      [/instagram/i, "Instagram"], [/^l\.?facebook|facebook|fb\.com|^fb$/i, "Facebook"], [/google/i, "Google"],
      [/whatsapp|wa\.me/i, "WhatsApp"], [/linkedin|lnkd/i, "LinkedIn"], [/tiktok/i, "TikTok"],
      [/youtube|youtu\.be/i, "YouTube"], [/^t\.co$|twitter|^x\.com/i, "X"], [/bing/i, "Bing"],
      [/linktr\.ee|linktree/i, "Linktree"]
    ];
    const achado = nomes.find(([re]) => re.test(origem));
    origem = achado ? achado[1] : (origem || "Direto");
    db.from("visitas").insert({ pagina: location.pathname.slice(0, 300), origem: origem.slice(0, 100) }).then(() => {}, () => {});
  } catch (e) { /* nunca atrapalha o site */ }
})();
