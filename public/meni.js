/* ════════════════════════════════════════════════════════════
   PINIT ORDER — jelovnik.
   Ovaj fajl koristi i server (require) i browser (global MENU).
   Cijene su u KM. "prep" = planirano vrijeme pripreme u minutama.
   Za izmjenu jelovnika mijenja se SAMO ovaj fajl.
   ════════════════════════════════════════════════════════════ */

var KATEGORIJE = [
  { id: 'predjelo', naziv: 'Predjelo' },
  { id: 'glavno',   naziv: 'Glavno jelo' },
  { id: 'prilog',   naziv: 'Prilozi' },
  { id: 'salata',   naziv: 'Salate' },
  { id: 'desert',   naziv: 'Deserti' },
  { id: 'pice',     naziv: 'Pića' }
];

var MENU = [
  /* ── PREDJELO ── */
  { id: 'pita',    naziv: 'Sarajevska pita',   opis: 'burek, 4 komada',        kat: 'predjelo', cijena: 6.00,  prep: 10, ic: 'burek' },
  { id: 'meze',    naziv: 'Meze plata',        opis: 'sir, sudžuka, kajmak',   kat: 'predjelo', cijena: 14.00, prep: 8,  ic: 'meze' },
  { id: 'juha',    naziv: 'Juha od povrća',    opis: 'domaća, sa rezancima',   kat: 'predjelo', cijena: 4.00,  prep: 4,  ic: 'juha' },

  /* ── GLAVNO ── */
  { id: 'cevapi',  naziv: 'Ćevapi',            opis: '10 komada, lepinja, luk',kat: 'glavno',   cijena: 9.00,  prep: 12, ic: 'cevapi' },
  { id: 'pljeska', naziv: 'Pljeskavica',       opis: 'punjena, sa kajmakom',   kat: 'glavno',   cijena: 10.00, prep: 14, ic: 'pljeskavica' },
  { id: 'snicla',  naziv: 'Bečka šnicla',      opis: 'teletina, limun',        kat: 'glavno',   cijena: 13.00, prep: 16, ic: 'snicla' },
  { id: 'pile',    naziv: 'Pileći file',       opis: 'sa žara, začinsko bilje',kat: 'glavno',   cijena: 12.00, prep: 15, ic: 'piletina' },
  { id: 'pastrmka',naziv: 'Pastrmka sa žara',  opis: 'cijela, blitva',         kat: 'glavno',   cijena: 16.00, prep: 18, ic: 'riba' },
  { id: 'pizza',   naziv: 'Pizza Margherita',  opis: 'krušna peć',             kat: 'glavno',   cijena: 10.00, prep: 12, ic: 'pizza' },
  { id: 'pasta',   naziv: 'Pasta bolonjeze',   opis: 'domaći sos, parmezan',   kat: 'glavno',   cijena: 11.00, prep: 14, ic: 'pasta' },
  { id: 'grah',    naziv: 'Grah sa suhim mesom',opis: 'iz zemljane posude',    kat: 'glavno',   cijena: 8.00,  prep: 6,  ic: 'grah' },

  /* ── PRILOG ── */
  { id: 'pomfrit', naziv: 'Pomfrit',           opis: 'porcija',                kat: 'prilog',   cijena: 4.00,  prep: 6,  ic: 'pomfrit' },
  { id: 'lepinja', naziv: 'Domaća lepinja',    opis: 'iz peći',                kat: 'prilog',   cijena: 1.50,  prep: 2,  ic: 'hljeb' },

  /* ── SALATA ── */
  { id: 'sopska',  naziv: 'Šopska salata',     opis: 'sir, paprika, paradajz', kat: 'salata',   cijena: 5.00,  prep: 5,  ic: 'salata' },
  { id: 'zelena',  naziv: 'Zelena salata',     opis: 'sezonska',               kat: 'salata',   cijena: 3.50,  prep: 3,  ic: 'salata' },

  /* ── DESERT ── */
  { id: 'baklava', naziv: 'Baklava',           opis: 'domaća, orah',           kat: 'desert',   cijena: 4.00,  prep: 3,  ic: 'baklava' },
  { id: 'palacinke',naziv: 'Palačinke',        opis: 'čokolada ili džem',      kat: 'desert',   cijena: 5.00,  prep: 8,  ic: 'palacinke' },
  { id: 'sladoled',naziv: 'Sladoled',          opis: '3 kugle',                kat: 'desert',   cijena: 4.00,  prep: 2,  ic: 'sladoled' },

  /* ── PIĆE ── */
  { id: 'kafa',    naziv: 'Bosanska kafa',     opis: 'sa ratlukom',            kat: 'pice',     cijena: 2.00,  prep: 3,  ic: 'kafa' },
  { id: 'caj',     naziv: 'Čaj',               opis: 'limun, med',             kat: 'pice',     cijena: 2.00,  prep: 4,  ic: 'caj' },
  { id: 'voda',    naziv: 'Voda 0.5l',         opis: 'negazirana',             kat: 'pice',     cijena: 2.00,  prep: 1,  ic: 'voda' },
  { id: 'cola',    naziv: 'Coca-Cola 0.33l',   opis: 'sa ledom',               kat: 'pice',     cijena: 3.00,  prep: 1,  ic: 'cola' },
  { id: 'sok',     naziv: 'Cijeđeni sok',      opis: 'narandža',               kat: 'pice',     cijena: 3.50,  prep: 2,  ic: 'sok' },
  { id: 'pivo',    naziv: 'Točeno pivo 0.5l',  opis: 'hladno',                 kat: 'pice',     cijena: 4.00,  prep: 2,  ic: 'pivo' }
];

/* pića i deserti idu šanku, ostalo kuhinji */
var SANK = ['pice'];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MENU: MENU, KATEGORIJE: KATEGORIJE, SANK: SANK };
}
