export default {
  // 1. Berechnet die vergangenen Tage seit dem letzten Eintrag
  getTageHer: (eintraege) => {
    if (!eintraege || eintraege.length === 0) return "Nie";

    const gueltigeDaten = eintraege.map(e => {
      if (!e.Zeitstempel) return null;
      
      const teile = String(e.Zeitstempel).trim().split(' ');
      const datumTeil = teile[0]; 
      const zeitTeil = teile[1] || "00:00"; 

      const dBits = datumTeil.split('.');
      if (dBits.length < 3) return null;

      const isoFormat = `${dBits[2]}-${dBits[1].padStart(2, '0')}-${dBits[0].padStart(2, '0')}T${zeitTeil}:00`;
      const parsedDate = new Date(isoFormat);

      return isNaN(parsedDate.getTime()) ? null : parsedDate;
    }).filter(d => d !== null);

    if (gueltigeDaten.length === 0) return "Nie";

    gueltigeDaten.sort((a, b) => b - a);
    const neuestesDatum = gueltigeDaten[0];

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

  // 2. Ermittelt die Button-Farbe je nach Status
  ermittleVentilFarbe: (currentItem, ventSpalte, leerSpalte) => {
    const rawVal = String(currentItem[ventSpalte] || "").trim();
    if (!rawVal) return '#3b82f6';
    
    const isLeerCurrent = currentItem[leerSpalte] === true || String(currentItem[leerSpalte]).trim().toUpperCase() === "TRUE";
    if (isLeerCurrent) return '#e5e7eb';
    
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

          if (status.includes("fertig")) return '#22c55e'; 
          if (modus.includes("jetzt"))  return '#991b1b'; 
          if (modus.includes("später")) return '#f97316'; 
          if (modus.includes("zeit"))   return '#f87171'; 
        }
      }
    }
    
    return '#3b82f6';
  },

  // 3. Formatiert den Text auf den Ventil-Buttons
  formatiereVentilText: (currentItem, ventSpalte, leerSpalte) => {
    const rawVal = String(currentItem[ventSpalte] || "").trim();
    if (!rawVal) return "";
    
    const btnVal = parseFloat(rawVal).toFixed(2);

    const isLeer = currentItem[leerSpalte] === true || String(currentItem[leerSpalte]).toUpperCase() === "TRUE";
    if (appsmith.store['Ventil_Leer_' + btnVal] || isLeer) {
      return btnVal;
    }

    const bewaesserungQuelle = appsmith.store.lokaleBewaesserungData || Bewaesserung_Lesen.data || [];
    const filter = bewaesserungQuelle.filter(row => 
      parseFloat(row.Ventil || 0).toFixed(2) === btnVal
    );

    const formattedName = btnVal.startsWith("2") ? "2. " + btnVal : btnVal;

    if (filter.length === 0) return formattedName;
    
    const statusText = Data_Helper.getTageHer(filter);
    return `${formattedName} (${statusText})`;
  },

  // 4. Speichert den Eintrag im lokalen Store (mit Re-Render-Trigger)
  speichereEintrag: async (activeVentil, modusWert, programm, bemerkung) => {
    const jetzigerZeitstempel = moment().format('DD.MM.YYYY HH:mm');
    const daten = [...(appsmith.store.lokaleBewaesserungData || Bewaesserung_Lesen.data || [])];

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

    await storeValue('lokaleBewaesserungData', [...daten]);
    await storeValue('lastUpdate', Date.now());
  }
}