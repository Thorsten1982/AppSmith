export default {
  getTageHer: (eintraege) => {
    if (!eintraege || eintraege.length === 0) return "Nie";

    // 1. Alle Datumsangaben sicher parsen (auch unvollständige Zeitstempel abfangen)
    const gueltigeDaten = eintraege.map(e => {
      if (!e.Zeitstempel) return null;
      
      const teile = String(e.Zeitstempel).trim().split(' ');
      const datumTeil = teile[0]; // z.B. "07.10.2026"
      const zeitTeil = teile[1] || "00:00"; // Fallback, falls Uhrzeit fehlt

      const dBits = datumTeil.split('.');
      if (dBits.length < 3) return null;

      // Erstellt ein gültiges ISO-Format (YYYY-MM-DDTHH:mm:00)
      const isoFormat = `${dBits[2]}-${dBits[1].padStart(2, '0')}-${dBits[0].padStart(2, '0')}T${zeitTeil}:00`;
      const parsedDate = new Date(isoFormat);

      return isNaN(parsedDate.getTime()) ? null : parsedDate;
    }).filter(d => d !== null); // Ungültige Datumsangaben aussortieren

    if (gueltigeDaten.length === 0) return "Nie";

    // 2. Nach Neuestem Datum sortieren
    gueltigeDaten.sort((a, b) => b - a);
    const neuestesDatum = gueltigeDaten[0];

    // 3. Tagesdifferenz berechnen
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);

    const zielDatum = new Date(neuestesDatum);
    zielDatum.setHours(0, 0, 0, 0);

    const diffTime = heute - zielDatum;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Heute";
    if (diffDays === 1) return "1 Tag";
    return `${diffDays} Tage`;
  }
}