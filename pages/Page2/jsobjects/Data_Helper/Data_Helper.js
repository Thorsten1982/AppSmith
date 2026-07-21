export default {
  getTageHer: (eintraege) => {
    if (!eintraege || eintraege.length === 0) return "Nie";
    const sortierteEintraege = eintraege.map(e => {
        const [d, t] = e.Zeitstempel.split(' ');
        const [day, month, year] = d.split('.');
        return new Date(`${year}-${month}-${day}T${t}:00`);
    }).sort((a, b) => b - a);
    const neuestesDatum = sortierteEintraege[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    neuestesDatum.setHours(0, 0, 0, 0);
    const diffTime = today - neuestesDatum;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Heute";
    if (diffDays > 0) return diffDays + " Tage";
    return "Heute";
  }
}