export async function listGoogleDocs(token: string) {
  const url = "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.document'&fields=files(id,name,mimeType)";
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to list docs');
  const data = await res.json();
  return data.files || [];
}

export async function readGoogleDoc(token: string, documentId: string) {
  const res = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to read doc');
  const doc = await res.json();
  
  let text = '';
  if (doc.body && doc.body.content) {
    doc.body.content.forEach((el: any) => {
      if (el.paragraph && el.paragraph.elements) {
        el.paragraph.elements.forEach((elem: any) => {
          if (elem.textRun && elem.textRun.content) {
            text += elem.textRun.content;
          }
        });
      }
    });
  }
  return { title: doc.title, text };
}

export async function createGoogleSheet(token: string, title: string, rows: string[][]) {
  // Create spreadsheet
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ properties: { title } })
  });
  if (!res.ok) throw new Error('Failed to create sheet');
  const sheet = await res.json();
  const spreadsheetId = sheet.spreadsheetId;

  // Append data
  const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: rows })
  });
  if (!updateRes.ok) throw new Error('Failed to populate sheet');
  
  return spreadsheetId;
}
