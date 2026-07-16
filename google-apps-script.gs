/**
 * DOPPA — Recebedor de leads + aceites de termo para Google Sheets
 * ------------------------------------------------------------
 * Cole em Extensões → Apps Script da sua planilha, depois
 * Implantar → Gerenciar implantações → editar → Nova versão.
 *
 *  - Leads da LP  → aba padrão (a primeira).
 *  - Aceites do termo (tipo=termo) → aba "Termos" (criada sozinha).
 *
 * Os cabeçalhos são criados automaticamente.
 */

function doPost(e) {
  try {
    var p = e.parameter || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (p.tipo === "termo") {
      // ----- aceite do Termo de Adesão → aba "Termos" -----
      var t = ss.getSheetByName("Termos") || ss.insertSheet("Termos");
      if (t.getLastRow() === 0) {
        t.appendRow(["Data/Hora", "Nome", "CPF", "CNPJ/MEI", "Email", "Telefone",
                     "Discord", "Instagram", "Versão", "Aceite", "User-Agent"]);
      }
      t.appendRow([
        new Date(), p.nome || "", p.cpf || "", p.cnpj || "", p.email || "",
        p.telefone || "", p.discord || "", p.instagram || "", p.versao || "",
        p.aceite || "", p.user_agent || ""
      ]);
    } else {
      // ----- lead da LP → a aba de sempre (getActiveSheet, como funcionava) -----
      var sheet = ss.getActiveSheet();
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Data/Hora", "Nome", "Email", "Telefone", "Experiência", "Maioridade", "Origem", "Afiliado (btag)"]);
      }
      sheet.appendRow([
        new Date(), p.nome || "", p.email || "", p.telefone || "",
        p.experiencia || "", p.maioridade || "", p.origem || "landing-page", p.btag || ""
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Teste rápido pelo editor (opcional)
function doGet() {
  return ContentService.createTextOutput("Doppa endpoint OK");
}
