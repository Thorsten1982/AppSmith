export default {
  // Aktualisiert den lokalen Store und erzwingt das Re-Render
  speichereEintrag: async (activeVentil, modusWert, programm, bemerkung) => {
    const jetzigerZeitstempel = moment().format('DD.MM.YYYY HH:mm');
    const daten = [...(appsmith.store.lokaleBewaesserungData || Bewaesserung_Lesen.data || [])];

    // Unfertigen Eintrag suchen
    let existIndex = daten.findIndex(r => {
      const match = String(r.Ventil).trim() === String(activeVentil).trim();
      const unfertig = String(r.Status || "").trim().toLowerCase() !== "fertig";
      return match && unfertig;
    });

    const neuerEintrag = {
      Ventil: activeVentil,
      Modus: modusWert,
      Programm: programm || "",
      Zeitstempel: jetzigerZeitstempel,
      Bemerkung: bemerkung || "",
      Status: 'Offen'
    };

    if (existIndex !== -1) {
      daten[existIndex] = { ...daten[existIndex], ...neuerEintrag };
    } else {
      daten.unshift(neuerEintrag);
    }

    // AWAIT ist hier entscheidend (asynchrones storeValue)!
    await storeValue('lokaleBewaesserungData', [...daten]);
    await storeValue('lastUpdate', Date.now());
  }
}