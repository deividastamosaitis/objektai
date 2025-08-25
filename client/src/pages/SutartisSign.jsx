import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { get, uploadSutartisPDF } from "../api.js";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { toAbsoluteUrl } from "../utils/url.js";

function SimpleHeader() {
  return (
    <header className="w-full border-b bg-white">
      <div className="mx-auto max-w-3xl px-4 py-3">
        <h1 className="text-lg font-semibold">Sutarties pasirašymas</h1>
      </div>
    </header>
  );
}

// ---- Pagalba: datos & numerio formatai
const pad = (n) => String(n).padStart(2, "0");
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const yyyymmdd = (iso) => {
  const [y, m, d] = (iso || todayISO()).split("-");
  return `${y}${m}${d}`;
};
const humanLtDate = (iso) => {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString("lt-LT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// ---- Sugeneruojam pradinį sutarties tekstą pagal tavo šabloną
function makeTemplate({ nr, miestas, dataISO, sutartis }) {
  const dateHuman = humanLtDate(dataISO);
  const pavad = (sutartis?.pavadinimas || "").trim() || "—";
  const vat = (sutartis?.VAT || "").toString().trim();
  const asmuo = (sutartis?.asmuo || "").trim() || "—";
  const adresas = (sutartis?.adresas || "").trim() || "—";
  const tel = (sutartis?.telefonas || "").toString().trim() || "—";
  const email = (sutartis?.email || "").trim() || "—";

  // JEI nori — čia gali automatiškai dėti UAB/MB aptikimą ir pan.

  return `Sutartis nr.:${nr}

${miestas}

${dateHuman}

Uždaroji akcinė bendrovė “TODESA“ (įmonės kodas 302041568, įregistruota 2008m. spalio 16 d., kuri įsikūrusi veiklos adresu Kaune, Jonavos g. 204a), toliau vadinama “VYKDYTOJU“, veikianti pagal bendrovės įstatus, atstovaujama direktoriaus Ričardo Pūko, ir ${pavad} , įmonės arba ūkio kodas: ${
    vat || "—"
  } , atstovaujama ${asmuo} , toliau vadinama “UŽSAKOVU”, sudarė šią sutartį:

1. Sutarties objektas

1.1 Pagal užsakovo užduotį vykdytojas įsipareigoja įrengti vaizdo stebėjimo sistemą, o užsakovas įsipareigoja priimti vykdytojo atliktą darbą ir už jį apmokėti, sutinkamai su šia sutartimi. Objekto adresas: ${adresas} . Darbas laikomas atliktas sumontavus vaizdo stebėjimo įrangą ir atlikus jos konfigūravimo darbus užsakovo adresu. Sekantis ar vėlesnis konfigūravimas pagal kliento vėlesnius pageidavimus, apmokamas 1 asmens taikomu valandiniu įkainiu, kuris nurodytas 3.2 punkte

2. Darbų atlikimo sąlygos

2.1 Vykdytojas įsipareigoja pradėti darbus ne vėliau kaip per 10 darbo dienų po sutarties pasirašymo ir pilno PVM sąskaitos faktūros (arba išankstinės sąskaitos) apmokėjimo už vaizdo stebėjimo įrangą, jos priedus ir kitus sąskaitoje esančius punktus. Šalių sutarimu gali būti nustatyti kitokie darbų pradžios terminai arba keičiami dėl netinkamų oro sąlygų, gamtos stichijų ir kitų atvejų, kurie kelia pavojų darbuotojams ar yra netinkamos gamtos sąlygos įrangos montavimui. Esant ligų, pandemijos, karantino ir kitoms priežastims, vykdytojas informuos Užsakovą dėl darbų atlikimo pradžios ar eigos.

2.2 Užsakovas įsipareigoja leisti dirbti vykdytojo darbuotojams ne trumpiau kaip 8 val. per dieną. Nesant tokios galimybės, sutarties atlikimo terminas gali būti nukeliamas.

2.3 Jeigu atliekant darbus vykdytojas padarys žalą užsakovui, tai vykdytojas įsipareigoja pataisyti trūkumus. Užsakovas privalo pateikti brėžinius ir schemas, kur objekte yra aukštos įtampos laidai, santechnika, kita instaliacija, ar kitaip informuoti bei pažymėti, kuriose vietose negali būti atliekami gręžimo, tvirtinimo darbai. Priešingu atveju, Vykdytojas neprivalo atlyginti žalos, kuri atsirado montuojant vaizdo stebėjimo įrangą.

2.4 Vykdytojas įsipareigoja laikytis Lietuvos Respublikos civilinio kodekso 6.669 straipsnio nustatytų konfidencialumo reikalavimų, taip pat laikyti paslaptyje užsakovo objekte įrengtų prietaisų sudėtį ir schemas.

2.5 Už instaliacijos bei aparatūros pažeidimus, atsiradusius ne dėl Vykdytojo kaltės, atsako Užsakovas.

2.6 Jei Užsakovo objekte reikia montuoti sistemą ar instaliaciją aukščiau nei 3 metrai nuo kieto ir stabilaus pagrindo, Vykdytojas gali išsinuomoti reikiamą techniką saugiam darbų atlikimui, o esančius nuomos kaštus apmokės Užsakovas, baigus darbus, išskyrus, jei yra sutarta kitaip. Jei Užsakovas savo turima technika ar įranga padeda atlikti darbus, Užsakovas yra atsakingas už darbų saugą.

3. Atsiskaitymo suma, įkainiai ir tvarka

3.1 Vykdytojo darbų atlikimo įkainis yra valandinis, kuris skaičiuojamas nuo išvykimo iš Vykdytojo veiklos adreso, darbų atlikimo laikas pas Užsakovą iki grįžimo į Vykdytojo veiklos adresą, kuris yra Kaune, Jonavos g. 204a.

3.2 Montavimo darbų įkainis kiekvienam objekte dirbančiam Vykdytojo darbuotojui yra 60€ + PVM / 1 val. Programavimo įkainis 90€ + PVM / 1 val., tačiau pirma nuotolinio programavimo valanda Užsakovui yra nemokama, kuri skirta vaizdo stebėjimo įrangos programavimo korekcijai pagal Užsakovo pageidavimus, kurie atsirado po darbų pabaigos. Šie darbai atliekami nuotoliniu būdu.
Viršvalandžiai: taikomas +50%, o darbų atlikimas šventinėmis ir ne darbo dienomis +100% koeficientas, išskyrus atvejus, jei su Užsakovu sutarta kitaip (tekstinis pagrindas).

3.3 Užsakovas už atliktus darbus atsiskaito per 2 darbo dienas nuo datos, kai Vykdytojas atsiunčia PVM sąskaitą-faktūrą už atliktus darbus, sunaudotas montavimo medžiagas, išnuomotą įrangą (jei ji buvo reikalinga pagal 2.6 punktą), papildomai panaudotą vaizdo stebėjimo įrangą, jos priedus, komponentus ir kitus priedus, kurių reikėjo darbams atlikti, išskyrus atvejus, jei raštiškai sutarta kitaip (tekstinis pagrindas).

3.4 Visa atsiskaitymo suma turi būti išmokėta Vykdytojui per 2 darbo dienas. To neatlikus, Užsakovas laikomas pažeidusiu įsipareigojimus ir be oficialaus įspėjimo skaičiuojami 0,5% dydžio delspinigiai kiekvienai kalendorinei dienai visai sąskaitos sumai, išskyrus atvejus, jei sutarta kitaip (tekstiniu pagrindu).

3.5 Sumontuotai įrangai suteikiama 24 mėnesių garantija.

3.6 Garantija negalioja ir neįpareigoja Vykdytojo šiais atvejais:
3.6.1. Jeigu be Vykdytojo žinios bandyta sumontuoti, permontuoti esančią įrangą, sistemą ar jos lydinčias dalis; jeigu Užsakovas ar kiti asmenys bandė pajungti/pakeisti papildomą/esančią įrangą į Vykdytojo sumontuotą ir sukonfigūruotą vaizdo stebėjimo sistemą (pvz. be Vykdytojo žinios pajungtos papildomos kameros, įrašymo įrenginys, atminties laikmenos, interneto maršrutizatorius, tinklo šakotuvas ar kita įranga, kuri dirba tame pačiame tinkle).
3.6.2. Jeigu įranga pažeista mechaniškai, paveikta drėgmės, aukštos temperatūros, vandens ar ardyta.
3.6.3. Jeigu pažeidimai įvyko dėl nenugalimos jėgos ar buitinių sąlygų poveikio: žemės drebėjimo, žaibo, ugnies, potvynio, vandens, drėgmės, viršįtampio, graužikų ir pan.
3.6.4. Jeigu Užsakovas savarankiškai ir be išankstinio Vykdytojo įspėjimo atliko sistemos konfigūravimus.

4. Nenugalima jėga

4.1 Šalis neatsako už bet kurios iš savo prievolių neįvykdymą, jeigu įrodo, kad jis buvo sąlygotas kliūties, kurios ji negalėjo kontroliuoti ir kad sutarties sudarymo momentu nebuvo galima protingai tikėtis iš jos kliūties numatymo arba tos kliūties ar jos pasekmių išvengimo ar įveikimo.
4.2 Atleidimas nuo atsakomybės galioja laikotarpiu, kurį egzistuoja tokia kliūtis.
4.3 Šalis, negalinti vykdyti savo įsipareigojimų, privalo raštu pranešti kitai šaliai per 7 kalendorines dienas nuo sužinojimo apie kliūtį dienos ir jos įtaką. Tai negalioja 3.3 ir 3.4 punktams.
4.4 Nepranešimas arba nesavalaikis pranešimas atima teisę remtis šiomis aplinkybėmis.
4.5 Kliūčiai nustojus galioti, atitinkama šalis praneša apie tai kitai šaliai per 7 kalendorines dienas.
4.6 Jei kliūtis tęsiasi ilgiau nei 7 kalendorines dienas, šalys turi teisę abipusiu raštišku susitarimu nutraukti sutartį.

5. Baigiamosios nuostatos

5.1 Ši sutartis galioja iki visiško Vykdytojo ir Užsakovo abipusių pareigų įvykdymo.
5.2 Visi įrengimai yra Vykdytojo nuosavybė iki Užsakovo visiško atsiskaitymo už įrengimus ir atliktus darbus.
5.3 Užsakovas neprieštarauja, kad jo įmonės vardas būtų viešai skelbiamas kaip Vykdytojo klientas.
5.4 Jeigu sutartis nutraukiama iki darbų rezultato priėmimo, Užsakovas turi teisę reikalauti perduoti jam atliktų darbų rezultatą, o Vykdytojas tokiu atveju turi teisę reikalauti apmokėti už faktiškai atliktus darbus.
5.5 Šioje sutartyje nenumatyti klausimai, tarp jų ir ginčai, sprendžiami tarpusavio susitarimu, o nesant susitarimo – Lietuvos Respublikos įstatymų tvarka.
5.6 Priedas Nr. 1 – detalizuota sąmata, PVM sąskaita faktūra arba kita informacija su įrangos kaina.

Kiti susitarimai:
${(sutartis?.sutarimai || "").trim() || "—"}

Kontaktai:
Užsakovas: ${pavad}, atstovas: ${asmuo}
Adresas: ${adresas}
Tel.: ${tel}  El. paštas: ${email}
`;
}

export default function SutartisSign() {
  const { id } = useParams();
  const [sutartis, setSutartis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [doneUrl, setDoneUrl] = useState(null);

  const navigate = useNavigate();

  // Formos laukai viršuje
  const [miestas, setMiestas] = useState("Kaunas");
  const [dataISO, setDataISO] = useState(todayISO());
  const [nr, setNr] = useState(yyyymmdd(todayISO()));
  const [bodyText, setBodyText] = useState("");

  // Canvas refs ir piešimas
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasStroke, setHasStroke] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const data = await get(`/sutartys/${id}`);
        if (!ignore) {
          const s = data?.sutartis || null;
          setSutartis(s);
          // Šabloną užpildom tik pirmą kartą
          const initial = makeTemplate({
            nr: yyyymmdd(dataISO),
            miestas,
            dataISO,
            sutartis: s,
          });
          setBodyText(initial);
        }
      } catch (e) {
        if (!ignore) setError(e?.message || "Nepavyko gauti sutarties");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [id]);

  // Keičiasi data → perrašom numerį (galima perrašyti ranka po to)
  useEffect(() => {
    setNr(yyyymmdd(dataISO));
  }, [dataISO]);

  // Jei pakeitei miestą/datą/NR ir nori atsinaujinti tekstą vienu mygtuku — turim „Perkurti tekstą“
  const regenerateText = () => {
    setBodyText(makeTemplate({ nr, miestas, dataISO, sutartis }));
  };

  // Canvas setup (hi-DPI, teisingos koordinatės)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setup = () => {
      const parent = canvas.parentElement;
      const cssW = parent.clientWidth;
      const cssH = Math.max(220, Math.round(cssW * 0.4));
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";

      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2 * dpr;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      setHasStroke(false);
    };

    setup();
    const onResize = () => setup();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const xClient = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const yClient = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (xClient - rect.left) * scaleX,
      y: (yClient - rect.top) * scaleY,
    };
  };

  const onStart = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    canvas.setPointerCapture?.(e.pointerId);
    drawing.current = true;
    const ctx = canvas.getContext("2d");
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const onMove = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasStroke(true);
  };
  const onEnd = (e) => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    canvas.releasePointerCapture?.(e.pointerId);
  };

  const clearCanvas = () => {
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = (window.devicePixelRatio || 1) * 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setHasStroke(false);
  };

  // PDF generacija su page-break'ais
  const makePdfAndUpload = async () => {
    if (!sutartis) throw new Error("Nėra sutarties");
    if (!hasStroke) throw new Error("Prašome padėti parašą");

    // Paruošiam pdfmake šriftus (vieną kartą)
    pdfMake.vfs = pdfFonts.vfs;
    pdfMake.fonts = {
      Roboto: {
        normal: "Roboto-Regular.ttf",
        bold: "Roboto-Medium.ttf",
        italics: "Roboto-Italic.ttf",
        bolditalics: "Roboto-MediumItalic.ttf",
      },
    };

    // Dinaminės reikšmės
    const pavad = sutartis.pavadinimas || "—";
    const vat = sutartis.VAT || "—";
    const asmuo = sutartis.asmuo || "—";
    const adresas = sutartis.adresas || "—";
    const tel = sutartis.telefonas || "—";
    const email = sutartis.email || "—";
    const sutarimai = sutartis.sutarimai || "—";

    // Parašo paveikslėlis iš canvas
    const signatureDataUrl = canvasRef.current.toDataURL("image/png");

    // Stiliai ir maketas
    const docDefinition = {
      pageSize: "A4",
      pageMargins: [56, 56, 56, 56], // ~2cm
      defaultStyle: { font: "Roboto", fontSize: 11, lineHeight: 1.25 },
      styles: {
        h1: { fontSize: 18, bold: true, margin: [0, 0, 0, 4] },
        h2: { fontSize: 13, bold: true, margin: [0, 12, 0, 6] },
        meta: { fontSize: 11, margin: [0, 2, 0, 0] },
        small: { fontSize: 9, color: "#666" },
        cellLabel: { bold: true, margin: [0, 2, 0, 2] },
      },
      footer: (currentPage, pageCount) => ({
        margin: [56, 0, 56, 20],
        columns: [
          {
            text: `Puslapis ${currentPage} / ${pageCount}`,
            alignment: "right",
            style: "small",
          },
        ],
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: -8,
            x2: 475,
            y2: -8,
            lineColor: "#e6e6e6",
            lineWidth: 0.5,
          },
        ],
      }),
      content: [
        // Header: kairėje pavadinimas, dešinėje Nr./Miestas/Data
        {
          columns: [
            { text: "UAB TODESA", style: "h1" },
            {
              stack: [
                {
                  text: `Sutarties Nr.: ${nr}`,
                  style: "meta",
                  alignment: "right",
                },
                {
                  text: `Miestas: ${miestas}`,
                  style: "meta",
                  alignment: "right",
                },
                {
                  text: `Data: ${humanLtDate(dataISO)}`,
                  style: "meta",
                  alignment: "right",
                },
              ],
              width: "auto",
            },
          ],
        },
        {
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 8,
              x2: 475,
              y2: 8,
              lineWidth: 0.8,
              lineColor: "#dddddd",
            },
          ],
        },
        { text: "SUTARTIS", style: "h1", margin: [0, 16, 0, 0] },

        // Įžanga su bold dinaminiais laukais
        {
          margin: [0, 12, 0, 0],
          text: [
            "Uždaroji akcinė bendrovė “TODESA“ (įmonės kodas 302041568, įregistruota 2008 m. spalio 16 d., kuri įsikūrusi veiklos adresu Kaune, Jonavos g. 204a), toliau vadinama “VYKDYTOJU“, veikianti pagal bendrovės įstatus, atstovaujama direktoriaus Ričardo Pūko, ir ",
            { text: pavad, bold: true },
            ", įmonės arba ūkio kodas: ",
            { text: vat, bold: true },
            ", atstovaujama ",
            { text: asmuo, bold: true },
            ", toliau vadinama “UŽSAKOVU”, sudarė šią sutartį:",
          ],
        },

        // 1. Sutarties objektas
        { text: "1. Sutarties objektas", style: "h2" },
        {
          text: [
            "1.1 Pagal užsakovo užduotį vykdytojas įsipareigoja įrengti vaizdo stebėjimo sistemą, o užsakovas įsipareigoja priimti vykdytojo atliktą darbą ir už jį apmokėti, sutinkamai su šia sutartimi. Objekto adresas: ",
            { text: adresas, bold: true },
            ". Darbas laikomas atliktas sumontavus vaizdo stebėjimo įrangą ir atlikus jos konfigūravimo darbus užsakovo adresu. Sekantis ar vėlesnis konfigūravimas pagal kliento vėlesnius pageidavimus, apmokamas 1 asmens taikomu valandiniu įkainiu, kuris nurodytas 3.2 punkte.",
          ],
        },

        // 2. Darbų atlikimo sąlygos
        { text: "2. Darbų atlikimo sąlygos", style: "h2" },
        {
          text: "2.1 Vykdytojas įsipareigoja pradėti darbus ne vėliau kaip per 10 darbo dienų po sutarties pasirašymo ir pilno PVM sąskaitos faktūros (arba išankstinės sąskaitos) apmokėjimo už vaizdo stebėjimo įrangą, jos priedus ir kitus sąskaitoje esančius punktus. Šalių sutarimu gali būti nustatyti kitokie darbų pradžios terminai arba keičiami dėl netinkamų oro sąlygų, gamtos stichijų ir kitų atvejų, kurie kelia pavojų darbuotojams ar yra netinkamos gamtos sąlygos įrangos montavimui. Esant ligų, pandemijos, karantino ir kitoms priežastims, vykdytojas informuos Užsakovą dėl darbų atlikimo pradžios ar eigos.",
        },
        {
          text: "2.2 Užsakovas įsipareigoja leisti dirbti vykdytojo darbuotojams ne trumpiau kaip 8 val. per dieną. Nesant tokios galimybės, sutarties atlikimo terminas gali būti nukeliamas.",
        },
        {
          text: "2.3 Jeigu atliekant darbus vykdytojas padarys žalą užsakovui, tai vykdytojas įsipareigoja pataisyti trūkumus. Užsakovas privalo pateikti brėžinius ir schemas, kur objekte yra aukštos įtampos laidai, santechnika, kita instaliacija, ar kitaip informuoti bei pažymėti, kuriose vietose negali būti atliekami gręžimo, tvirtinimo darbai. Priešingu atveju, Vykdytojas neprivalo atlyginti žalos, kuri atsirado montuojant vaizdo stebėjimo įrangą.",
        },
        {
          text: "2.4 Vykdytojas įsipareigoja laikytis Lietuvos Respublikos civilinio kodekso 6.669 straipsnio nustatytų konfidencialumo reikalavimų, taip pat laikyti paslaptyje užsakovo objekte įrengtų prietaisų sudėtį ir schemas.",
        },
        {
          text: "2.5 Už instaliacijos bei aparatūros pažeidimus, atsiradusius ne dėl Vykdytojo kaltės, atsako Užsakovas.",
        },
        {
          text: "2.6 Jei Užsakovo objekte reikia montuoti sistemą ar instaliaciją aukščiau nei 3 metrai nuo kieto ir stabilaus pagrindo, Vykdytojas gali išsinuomoti reikiamą techniką saugiam darbų atlikimui, o esančius nuomos kaštus apmokės Užsakovas, baigus darbus, išskyrus, jei yra sutarta kitaip. Jei Užsakovas savo turima technika ar įranga padeda atlikti darbus, Užsakovas yra atsakingas už darbų saugą.",
        },

        // 3. Įkainiai
        { text: "3. Atsiskaitymo suma, įkainiai ir tvarka", style: "h2" },
        {
          text: "3.1 Vykdytojo darbų atlikimo įkainis yra valandinis, kuris skaičiuojamas nuo išvykimo iš Vykdytojo veiklos adreso, darbų atlikimo laikas pas Užsakovą iki grįžimo į Vykdytojo veiklos adresą, kuris yra Kaune, Jonavos g. 204a.",
        },
        {
          text: "3.2 Montavimo darbų įkainis kiekvienam objekte dirbančiam Vykdytojo darbuotojui yra 60€ + PVM / 1 val. Programavimo įkainis 90€ + PVM / 1 val., tačiau pirma nuotolinio programavimo valanda Užsakovui yra nemokama, kuri skirta vaizdo stebėjimo įrangos programavimo korekcijai pagal Užsakovo pageidavimus, kurie atsirado po darbų pabaigos. Šie darbai atliekami nuotoliniu būdu. Viršvalandžiai: taikomas +50%, o darbų atlikimas šventinėmis ir ne darbo dienomis +100% koeficientas, išskyrus atvejus, jei su Užsakovu sutarta kitaip (tekstinis pagrindas).",
        },
        {
          text: "3.3 Užsakovas už atliktus darbus atsiskaito per 2 darbo dienas nuo datos, kai Vykdytojas atsiunčia PVM sąskaitą-faktūrą už atliktus darbus, sunaudotas montavimo medžiagas, išnuomotą įrangą (jei ji buvo reikalinga pagal 2.6 punktą), papildomai panaudotą vaizdo stebėjimo įrangą, jos priedus, komponentus ir kitus priedus, kurių reikėjo darbams atlikti, išskyrus atvejus, jei raštiškai sutarta kitaip (tekstinis pagrindas).",
        },
        {
          text: "3.4 Visa atsiskaitymo suma turi būti išmokėta Vykdytojui per 2 darbo dienas. To neatlikus, Užsakovas laikomas pažeidusiu įsipareigojimus ir be oficialaus įspėjimo skaičiuojami 0,5% dydžio delspinigiai kiekvienai kalendorinei dienai visai sąskaitos sumai, išskyrus atvejus, jei sutarta kitaip (tekstiniu pagrindu).",
        },
        { text: "3.5 Sumontuotai įrangai suteikiama 24 mėnesių garantija." },
        {
          text: "3.6 Garantija negalioja ir neįpareigoja Vykdytojo atvejais, kai įranga ar sistema buvo keista be Vykdytojo žinios; įranga pažeista mechaniškai ar dėl aplinkos poveikio; arba Užsakovas be išankstinio įspėjimo atliko sistemos konfigūravimą.",
        },

        // 4. Nenugalima jėga
        { text: "4. Nenugalima jėga", style: "h2" },
        {
          text: "4.1 Šalis neatsako už prievolių neįvykdymą, jeigu jis buvo sąlygotas kliūties, kurios negalėjo kontroliuoti ir kurios sudarymo momentu negalėjo protingai numatyti ar išvengti.",
        },
        {
          text: "4.2 Atleidimas nuo atsakomybės galioja laikotarpiu, kurį egzistuoja kliūtis.",
        },
        {
          text: "4.3 Šalis, negalinti vykdyti įsipareigojimų, privalo pranešti kitai šaliai per 7 kalendorines dienas; tai negalioja 3.3–3.4 punktams.",
        },
        {
          text: "4.4 Nepranešimas arba nesavalaikis pranešimas atima teisę remtis šiomis aplinkybėmis.",
        },
        {
          text: "4.5 Kliūčiai nustojus galioti, atitinkama šalis praneša apie tai per 7 kalendorines dienas.",
        },
        {
          text: "4.6 Jei kliūtis tęsiasi ilgiau nei 7 kalendorines dienas, šalys gali nutraukti sutartį abipusiu raštišku susitarimu.",
        },

        // 5. Baigiamosios nuostatos
        { text: "5. Baigiamosios nuostatos", style: "h2" },
        {
          text: "5.1 Ši sutartis galioja iki visiško Vykdytojo ir Užsakovo abipusių pareigų įvykdymo.",
        },
        {
          text: "5.2 Visi įrengimai yra Vykdytojo nuosavybė iki Užsakovo visiško atsiskaitymo.",
        },
        {
          text: "5.3 Užsakovas neprieštarauja, kad jo įmonės vardas būtų viešai skelbiamas kaip Vykdytojo klientas.",
        },
        {
          text: "5.4 Jei sutartis nutraukiama iki darbų rezultato priėmimo, Užsakovas gali reikalauti perduoti atliktų darbų rezultatą, o Vykdytojas turi teisę reikalauti apmokėti už faktiškai atliktus darbus.",
        },
        {
          text: "5.5 Šioje sutartyje nenumatyti klausimai ir ginčai sprendžiami derybomis, o nesant susitarimo – pagal LR įstatymus.",
        },
        {
          text: "5.6 Priedas Nr. 1 – detalizuota sąmata, PVM sąskaita faktūra ar kita informacija su įrangos kaina.",
        },

        // Kiti susitarimai
        { text: "Kiti susitarimai", style: "h2" },
        { text: sutarimai },

        // Vykdytojas / Užsakovas – dviejų stulpelių blokas
        {
          style: "h2",
          margin: [0, 12, 0, 6],
          text: "Šalių rekvizitai",
        },
        {
          columns: [
            {
              width: "*",
              stack: [
                { text: "VYKDYTOJAS", style: "cellLabel" },
                "UAB Todesa",
                "Jonavos g. 204a, Kaunas",
                "Įmonės kodas 302041568",
                "PVM kodas LT100004353812",
                "Swedbank: LT107300010111002020",
                "SEB: LT847044090105342864",
                "Paysera: LT693500010001366103",
              ],
            },
            {
              width: "*",
              stack: [
                { text: "UŽSAKOVAS", style: "cellLabel" },
                pavad,
                adresas,
                `Įmonės kodas: ${vat}`,
                `Telefono nr.: ${tel}`,
                `El. paštas: ${email}`,
              ],
            },
          ],
          columnGap: 16,
        },

        // Parašas
        { text: "Užsakovo parašas:", style: "h2" },
        {
          image: signatureDataUrl,
          width: 260, // proporcingai sumažinta
          margin: [0, 4, 0, 4],
        },
        { text: `Data: ${new Date().toLocaleString("lt-LT")}`, style: "meta" },
      ],
    };

    // Sukuriam PDF ir gaunam Blob, tada įkeliame kaip ir anksčiau
    await new Promise((resolve, reject) => {
      try {
        pdfMake.createPdf(docDefinition).getBlob(async (blob) => {
          try {
            const filename = `sutartis-${(pavad || "klientas")
              .toLowerCase()
              .replace(/[^a-z0-9]+/gi, "-")}-${nr}.pdf`;
            const fd = new FormData();
            fd.append("id", sutartis._id);
            fd.append(
              "file",
              new File([blob], filename, { type: "application/pdf" })
            );

            const res = await uploadSutartisPDF(fd);
            const url = res?.sutartis?.pdf?.filepath;
            if (url) {
              setDoneUrl(url);
              // Automatinis atsisiuntimas (veiks ir kitame domene)
              try {
                const r = await fetch(toAbsoluteUrl(url));
                const blobDownloaded = await r.blob();
                const tmp = URL.createObjectURL(blobDownloaded);
                const a = document.createElement("a");
                a.href = tmp;
                a.download = filename; // tas pats vardas, kurį naudojai įkeliant
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(tmp);
              } catch {
                // Atsarginis variantas – jei fetch nepavyktų, bent jau atidarys naujame lange
                window.open(url, "_blank");
              }
              navigate(`/sutartys/success/${sutartis._id}`);
            }
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {loading && <div>Kraunama…</div>}
        {error && (
          <div className="text-sm p-2 rounded-lg bg-red-50 border border-red-200">
            {error}
          </div>
        )}

        {sutartis && (
          <>
            {/* Sutarties tekstas */}
            <section className="bg-white rounded-2xl shadow-sm border p-5 space-y-3">
              <h2 className="text-lg font-semibold">Sutarties tekstas</h2>
              <div className="w-full rounded-xl border px-3 py-2 h-96 overflow-y-auto whitespace-pre-wrap leading-6 bg-gray-50 text-gray-800">
                {bodyText}
              </div>
              <p className="text-xs text-gray-500">
                Tekstas yra automatiškai sugeneruotas pagal užsakovo duomenis ir
                negali būti redaguojamas.
              </p>
            </section>

            {/* Parašas */}
            <section className="bg-white rounded-2xl shadow-sm border p-5">
              <h2 className="text-lg font-semibold mb-3">Padėkite parašą</h2>
              <div className="rounded-xl border bg-white p-3 select-none touch-none">
                <canvas
                  ref={canvasRef}
                  className="w-full block rounded-lg"
                  onPointerDown={onStart}
                  onPointerMove={onMove}
                  onPointerUp={onEnd}
                  onPointerLeave={onEnd}
                />
              </div>

              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="rounded-lg border px-3 py-1.5 bg-white hover:bg-gray-50"
                >
                  Išvalyti
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    try {
                      setSaving(true);
                      await makePdfAndUpload();
                    } catch (e) {
                      setError(e?.message || "Nepavyko pasirašyti");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="rounded-lg bg-blue-600 text-white px-4 py-2 disabled:opacity-50"
                >
                  {saving ? "Keliama…" : "Pasirašyti ir išsaugoti PDF"}
                </button>
              </div>

              {doneUrl && (
                <div className="mt-4 text-sm">
                  ✅ PDF išsaugotas.{" "}
                  <a
                    className="text-blue-600 underline"
                    href={toAbsoluteUrl(doneUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Atsidaryti PDF
                  </a>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
