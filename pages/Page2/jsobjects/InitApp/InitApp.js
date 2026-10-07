export default {
  initApp: async () => {
    // 1. Daten aus Google Sheets lesen
    await Bewaesserung_Lesen.run();
    await Stammdaten.run();

    // 2. Den lokalen Store mit den echten Excel-Daten befüllen
    await storeValue('lokaleBewaesserungData', Bewaesserung_Lesen.data || []);
    await storeValue('lokaleStammdaten', Stammdaten.data || []);
  }
}