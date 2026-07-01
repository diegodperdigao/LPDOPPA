/**
 * DOPPA — Recebedor de leads para Google Sheets
 * ------------------------------------------------------------
 * Cole este código em Extensões → Apps Script da sua planilha,
 * depois Implantar → Novo implantação → App da Web.
 *
 * PASSO A PASSO:
 *  1. Crie uma planilha nova no Google Sheets.
 *  2. Menu  Extensões  →  Apps Script.
 *  3. Apague o que estiver lá e cole TODO este arquivo.
 *  4. Clique em  Implantar  →  Novo implantação.
 *  5. Engrenagem ⚙ → tipo "App da Web".
 *     - Executar como:  Eu (sua conta)
 *     - Quem tem acesso: Qualquer pessoa
 *  6. Implantar → autorize o acesso → copie a "URL do app da web".
 *  7. Cole essa URL em js/script.js  →  CONFIG.SHEET_ENDPOINT.
 *
 * A primeira linha (cabeçalho) é criada automaticamente.
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Cria cabeçalho na primeira vez
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Data/Hora", "Nome", "Email", "Telefone", "Experiência", "Maioridade", "Origem"]);
    }

    var p = e.parameter || {};
    sheet.appendRow([
      new Date(),
      p.nome || "",
      p.email || "",
      p.telefone || "",
      p.experiencia || "",
      p.maioridade || "",
      p.origem || "landing-page"
    ]);

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
  return ContentService.createTextOutput("Doppa lead endpoint OK");
}
