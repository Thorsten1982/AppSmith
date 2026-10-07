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
  },

  ermittleVentilFarbe: (currentItem, ventSpalte, leerSpalte) => {
    const _reRenderTrigger = appsmith.store.lastUpdate;
    const rawVal = String(currentItem[ventSpalte] || "").trim();
    if (!rawVal) return '#3b82f6'; // Standard Blau
    
    const isLeerCurrent = currentItem[leerSpalte] === true || String(currentItem[leerSpalte]).trim().toUpperCase() === "TRUE";
    if (isLeerCurrent) return '#e5e7eb'; // Grau
    
    const bewaesserungQuelle = appsmith.store.lokaleBewaesserungData || Bewaesserung_Lesen.data || [];
    const btnValFloat = parseFloat(rawVal);

    const alleEintraege = bewaesserungQuelle.filter(row => {
      const vRaw = String(row.Ventil || "").trim();
      if (!vRaw) return false;
      const vFloat = parseFloat(vRaw);
      return vRaw === rawVal || (!isNaN(vFloat) && !isNaN(btnValFloat) && vFloat.toFixed(2) === btnValFloat.toFixed(2));
    });

    if (alleEintraege.length > 0) {
      const parseGermanTimestamp = (str) => {
        if (!str) return 0;
        const teile = String(str).trim().split(' ');
        const d = (teile[0] || '').split('.');
        if (d.length < 3) return 0;
        const t = (teile[1] || '00:00').split(':');
        return new Date(Number(d[2]), Number(d[1]) - 1, Number(d[0]), Number(t[0] || 0), Number(t[1] || 0)).getTime();
      };

      alleEintraege.sort((a, b) => parseGermanTimestamp(b.Zeitstempel) - parseGermanTimestamp(a.Zeitstempel));

      const latest = alleEintraege[0];
      const latestTime = parseGermanTimestamp(latest.Zeitstempel);

      if (latestTime > 0) {
        const dLatest = new Date(latestTime);
        const heute = new Date();

        const istHeute = (
          dLatest.getDate() === heute.getDate() &&
          dLatest.getMonth() === heute.getMonth() &&
          dLatest.getFullYear() === heute.getFullYear()
        );

        if (istHeute) {
          const status = String(latest.Status || "").toLowerCase().trim();
          const modus = String(latest.Modus || "").toLowerCase().trim();

          if (status.includes("fertig")) return '#22c55e'; // GRÜN
          if (modus.includes("jetzt"))  return '#991b1b'; // DUNKELROT
          if (modus.includes("später")) return '#f97316'; // ORANGE
          if (modus.includes("zeit"))   return '#f87171'; // HELLROT
        }
      }
    }
    
    return '#3b82f6'; // Standard Blau
  }
}