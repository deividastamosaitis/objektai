import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SignaturePad from "react-signature-canvas";

const API = import.meta.env.VITE_API_URL ?? "/api/v1";

// --- tas pats HTML šablonas, kurį naudoji PDF generavimui (be parašo iki pasirašymo) ---
function buildContractHTML({
  number,
  dateStr,
  customer,
  objectAddress,
  notes,
  signatureDataUrl, // prieš pasirašymą paprastai null
}) {
  const css = `
  @page { size: A4; margin: 20mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Noto Sans", Arial, sans-serif; color: #111; }
  .sutartis-container { font-size: 12pt; }
  .sutartis-pdf-box { background: #fff; padding: 10px; }
  .sutartis-title { margin: 10px 0; text-align: center; font-weight: 700; }
  .sutartis-numeris { font-weight: 700; margin-left: 6px; }
  .title-under { display: flex; justify-content: space-between; margin: 4px 12px 8px; font-size: 11pt; }
  .paragraph { width: 100%; padding: 12px; text-align: justify; }
  .input { font-weight: 700; }
  .ikainiai { margin-top: 8px; margin-left: 24px; }
  .susitarimai { margin-top: 10px; padding: 12px; text-align: justify; display: flex; gap: 10px; }
  .susitarimai span { font-weight: 700; }
  .sutartis-footer { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 24px; }
  .sutartis-footer .title { font-weight: 700; }
  .vykdytojas, .uzsakovas { padding: 12px; }
  .vykdytojas-info, .uzsakovas-info { margin-top: 8px; line-height: 1.3; }
  .parasas { margin-top: 12px; width: 200px; height: 80px; object-fit: contain; }
  `;

  const customerBlock = `
    ${customer.company ? `<br/> ${customer.company}` : `${customer.name}`}
    ${customer.name ? `<br/>Atsakingas asmuo: ${customer.name}` : ""}
    ${customer.vat ? `<br/>Įmonės / ūkio kodas: ${customer.vat}` : ""}
    ${customer.phone ? `<br/>Telefono nr.: ${customer.phone}` : ""}
    ${customer.address ? `<br/>Adresas: ${customer.address}` : ""}
    ${customer.email ? `<br/>El. paštas: ${customer.email}` : ""}
  `.trim();

  return `<!doctype html>
<html lang="lt">
<head>
  <meta charset="utf-8" />
  <title>Sutartis ${number || ""}</title>
  <style>
    @font-face {
      font-family: 'Noto Sans';
      src: url('/fonts/NotoSans-Regular.ttf') format('truetype');
      font-weight: 400;
      font-style: normal;
    }
    ${css}
  </style>
</head>
<body>
  <div class="sutartis-container">
    <div class="sutartis-pdf-box">
      <p class="sutartis-title">
        Sutartis nr.: <span class="sutartis-numeris">${number || "—"}</span>
      </p>
      <div class="title-under">
        <p class="kaunas">Kaunas</p>
        <p class="data">${dateStr}</p>
      </div>

      <div class="paragraph">
        <p>
          Uždaroji akcinė bendrovė “TODESA“ (įmonės kodas 302041568, įregistruota 2008 m. spalio 16 d., veiklos adresas Kaunas, Jonavos g. 204a),
          toliau vadinama “VYKDYTOJU“, veikianti pagal bendrovės įstatus, atstovaujama direktoriaus Ričardo Pūko,
          ir <span class="input">${
            customer.company ? customer.company : customer.name
          }</span>
          ${
            customer.vat
              ? `, įmonės arba ūkio kodas: <span class="input">${customer.vat}</span>`
              : ""
          }
          , atstovaujama <span class="input">${
            customer.name ?? ""
          }</span>, toliau vadinama “UŽSAKOVU”, sudarė šią sutartį:
        </p>
      </div>

      <p class="sutartis-title">1. Sutarties objektas</p>
      <div class="paragraph">
        <p>
          1.1 Pagal užsakovo užduotį vykdytojas įsipareigoja įrengti vaizdo stebėjimo sistemą, o užsakovas įsipareigoja priimti vykdytojo atliktą darbą ir už jį apmokėti,
          sutinkamai su šia sutartimi. Objekto adresas: <span class="input">${
            objectAddress || "-"
          }</span>.
          Darbas laikomas atliktas sumontavus vaizdo stebėjimo įrangą ir atlikus jos konfigūravimo darbus užsakovo adresu.
          Sekantis ar vėlesnis konfigūravimas pagal kliento vėlesnius pageidavimus apmokamas 1 asmens taikomu valandiniu įkainiu,
          kuris nurodytas 3.2 punkte.
        </p>
      </div>

      <p class="sutartis-title">2. Darbų atlikimo sąlygos</p>
<div class="paragraph"><p>2.1 Vykdytojas įsipareigoja pradėti darbus ne vėliau kaip per 10
              darbo dienų po sutarties pasirašy mo ir pilno PVM sąskaitos
              faktūros (arba išankstinės sąskaitos) apmokėjimo už vaizdo
              stebėjimo įrangą, jos priedus ir kitus sąskaitoje esančius
              punktus. Šalių sutarimu gali būti nustatyti kitokie dar bų
              pradžios darbai arba keičiami dėl netinkamų oro sąlygų, gamtos
              stichijų ir kitų atvejų, kurie kelia pavojų darbuotojams ar yra
              netinkamos gamtos sąlygos įrangos montavimui. Esant ligų,
              pandemijos, karantino ir kitoms priežastims, vykdytojas informuos
              Užsakovą dėl darbų atlikimo pradžios ar eigos.</p></div>
      <div class="paragraph"><p>2.2 Užsakovas įsipareigoja leisti dirbti vykdytojo darbuotojams ne
              trumpiau kaip 8 val. per dieną. Ne sant tokios galimybės,
              sutarties atlikimo terminas gali būti nukeliamas.</p></div>
      <div class="paragraph"><p>2.3 Jeigu atliekant darbus vykdytojas padarys žalą užsakovui, tai
              vykdytojas įsipareigoja pataisyti trūkumus. Užsakovas privalo
              pateikti brėžinius ir schemas, kur objekte yra aukštos įtampos
              laidai, santechnika, kita instaliacija, ar kitaip informuoti bei
              pažymėti, kuruose vietose negali būti atliekami gręžimo,
              tvirtinimo darbai. Priešingu atveju, Vykdytojas neprivalo
              atlyginti žalos, kuri atsirado mon tuojant vaizdo stebėjimo
              įrangą.</p></div>
      <div class="paragraph"><p>2.4 Vykdytojas įsipareigoja laikytis Lietuvos Respublikos
              civilinio kodekso 6.669 straipsnio nustatytų konfidencialumo
              reikalavimų, taip pat laikyti puslapyje užsakovo objekte įrengtų
              prietaisų sudėtį ir schemas.</p></div>
      <div class="paragraph"><p>2.5 Už instaliacijos bei aparatūros pažeidimus, atsiradusius ne
              dėl Vykdytojo kaltės, atsako Užsako vas.</p></div>
      <div class="paragraph"><p>2.6 Jei Užsakovo objekte reikia montuoti sistemą ar instaliaciją
              aukščiau nei 3 metrai nuo kieto ir sta bilaus pagrindo, vykdytojas
              gali išsinuomoti reikiamą techniką saugiam darbų atlikimui, o
              esančius nuomos kaštus apmokės Užsakovas, baigus darbus, išskyrus,
              jei yra sutarta kitaip. Jei Užsakovas savo turima technika ar
              įranga padeda atlikti darbus, Užsakovas yra atsakingas už darbų
              saugą.</p></div>

      <p class="sutartis-title">3. Atsiskaitymo suma, įkainiai ir tvarka</p>
<div class="paragraph"><p>3.1 Vykdytojo darbų atlikimo įkainis yra valandinis, kuris
              skaičiuojamas nuo išvykimo iš Vykdytojo veiklos adreso, darbų
              atlikimo laikas pas užsakovą iki grįžimo į vykdytojo veiklos
              adresą, kuris yra Kaune, Jonavos g. 204a.</p></div>
      <div class="paragraph">
        <p>
          3.2 <span class="input">Montavimo darbų įkainis</span> 60€ + PVM/val.; <span class="input">Programavimo įkainis</span> 90€ + PVM/val.
          Pirma nuotolinio programavimo valanda po darbų pabaigos – nemokama. Viršvalandžiai +50%, šventinėmis/ne darbo dienomis +100% (jei nesutarta kitaip).
        </p>
      </div>
      <div class="paragraph"><p>3.3 Užsakovas už atliktus darbus atsiskaito per 2 darbo dienas,
              nuo tos datos, kai vykdytojas atsiunčia PVM sąskaitą-faktūrą, už
              atliktus darbus, sunaudotas montavimo medžiagas, išnuomtotą įrangą
              (jei ji buvo reikalinga pagal 2.6 punktą), papildomai panaudotą
              vaizdo stebėjimo įrangą, jos priedus, kom ponentus ir kitus
              priedus, kurių reikėjo darbams atlikti. Išskyrus atvejus, jei
              raštiškai sutarta kitaip (tekstinis pagrindas).</p></div>
      <div class="paragraph"><p>3.4 Visa atsiskaitymo suma turi būti išmokėta vykdytojui per 2
              darbo dienas, to neatlikus, užsakovas traktuoja kaip
              įsipareigojimų nevykdymu ir be oficialaus įspėjimo skaičiuoja 0,5%
              dydžio delspinigius kiekvienai kalendorinei dienai visai sąskaitos
              sumai išskyrus atvejus, jei sutarta kitaip (tekstiniu pa grindu)</p></div>
      <div class="paragraph"><p>3.5 Sumontuotai įrangai suteikiama 24 mėnesių garantija.</p></div>
      <div class="paragraph"><p>3.6 Garantija negalioja ir neįpareigoja vykdytojo šiais
                atvejais:</p></div>
      <div class="ikainiai"><p>3.6.1. Jeigu be vykdytojo žinios bandyta sumontuoti, permontuoti
                esančią įrangą, sistemą ar jos lydinčias dalis, jeigu užsakovas
                ir kiti asmenys bandė pajungti/pakeisti papildomą/esančią įrangą
                į vykdytojo sumontuotą ir sukonfiguruotą vaizdo stebėjimo
                sistemą, pvz be vykdytojo žinios ir su tarimo pajungtos
                papildomos kameros, įrašymo įrenginys, atminties laikmenos,
                interneto routeris, tinklo šakotuvas ar bet kokia kita įranga
                kuri dirba tame pačiame internetiniame tinkle, IP adresu ose
                kaip ir vaizdo stebėjimo įranga, jos dalys, siųstuvai ir t.t.</p></div>
      <div class="ikainiai"><p>3.6.2. Jeigu įranga pažeista mechaniškai, paveikta drėgmės,
                aukštos temperatūros, vandens, ardyta;</p></div>
      <div class="ikainiai"><p>3.6.3. Jeigu pažeidimai įvyko dėl nenugalimos jėgos ar buitinių
                sąlygų poveikio: žemės drebėjimo, žaibo, ugnies,
                potvynio,vandens, drėgmės, viršįtampio, graužikų ir t.t.</p></div>
      <div class="ikainiai"><p>3.6.4. Jeigu užsakovas savarankiškai ir be išankstinio vykdotojo
                įspėjimo atliko sistemos konfiguravimus.</p></div>

      <p class="sutartis-title">4. Nenugalima jėga</p>
<div class="paragraph"><p>4.1 Šalis neatsako už bet kurios iš savo prievolių neįvykdymą,
              jeigu įrodo, kad jis buvo sąlygotas kliūties, kurios ji negalėjo
              kontroliuoti ir kad sutarties sudarymo momentu nebuvo galima
              protingai tikėtis iš jos kliūties numatymo arba tos kliūties ar
              jos pasekmių išvengimo ar įveikimo.</p></div>
      <div class="paragraph"><p>4.2 Šiame straipsnyje numatytas atleidimas nuo atsakomybės galioja
              tuo laikotarpiu, kuriuo metu egzistuoja tokia kliūtis.</p></div>
      <div class="paragraph"><p>4.3 Šalis, negalinti įvykdyti savo įsipareigojimų, privalo raštu
              pranešti kitai šaliai per 7 (septynias) kalendorines dienas nuo
              sužinojimo apie tokių kliūčių atsiradimą dienos ir jų įtaką šalies
              sugebėjimui vykdyti savo įsipareigojimus. Tai negalioja 3.3 ir 3.4
              punktams.</p></div>
      <div class="paragraph"><p>4.4 Nepranešimas arba nesavalaikis pranešimas atima šalies teisę
              remtis bet kuria iš aukščiau nurodytų aplinkybių kaip pagrindu,
              atleidžiančių nuo atsakomybės už įsipareigojimų nevykdymą.</p></div>
      <div class="paragraph"><p>4.5 Tuo atveju, jei šios sutarties 4.1. punkte nurodytos
              aplinkybės nustoja veikti, atitinkama šalis praneša apie tai kitai
              šaliai raštu per 7 (septynias) kalendorines dienas.</p></div>
      <div class="paragraph"><p>4.6 Jei 4.1. punkte nurodytos aplinkybės tęsiasi ilgiau nei 7
              kalendorines dienas, šalys turi teisę abi pusiu raštišku
              susitarimu nutraukti sutartį.</p></div>


      <p class="sutartis-title">5. Baigiamosios nuostatos</p>
      <div class="paragraph"><p>5.1 Ši sutartis galioja iki visiško vykdytojo ir užsakovo abipusių
              pareigų įvykdymo.</p></div>
      <div class="paragraph"><p>5.2 Visi įrengimai yra vykdytojo nuosavybė iki užsakovo visiško
              atsiskaitymo už įrengimus ir atliktus darbus.</p></div>
      <div class="paragraph"><p>5.3 Užsakovas neprieštarauja, kad Jo įmonės vardas būtų viešai
              skelbiamas kaip vykdytojo klientas.</p></div>
      <div class="paragraph"><p>5.4 Jeigu sutartis nutraukiama iki darbų rezultato priėmimo,
              užsakovas turi teisę reikalauti perduoti jam atliktų darbų
              rezultatą, o vykdytojas tokiu atveju turi teisę reikalauti
              apmokėti už faktiškai atliktus darbus.</p></div>
      <div class="paragraph"><p>5.5 Ši sutartis sudaryta dviem egzemplioriais, kurių vienas
              laikomas pas užsakovą , o kitas - pas vykdytoją.</p></div>
      <div class="paragraph"><p>5.6 Šioje sutartyje nenumatyti klausimai, tarp jų ir ginčai
              sprendžiami tarpusavio susitarimu. Nepasiekus susitarimo -
              Lietuvos Respublikos įstatymų numatyta tvarka.</p></div>
      <div class="paragraph"><p>5.7 Priedas Nr.1 – detalizuota sąmata, PVM sąskaita faktūra arba
              kita informacija su įrangos kaina.</p></div>

      <div class="susitarimai">
        <p>Kiti susitarimai:</p>
        <span>${notes && notes.trim() ? notes : "-"}</span>
      </div>

      <div class="sutartis-footer">
        <div class="vykdytojas">
          <span class="title">VYKDYTOJAS</span>
          <div class="vykdytojas-info">
            <p>UAB Todesa</p>
            <p>Jonavos g. 204A, Kaunas</p>
            <p>Įmonės kodas: 302041568</p>
            <p>PVM kodas: LT100004353812</p>
          </div>
          <div class="vykdytojas-info">
            <p>Swedbank: LT107300010111002020</p>
            <p>SEB: LT847044090105342864</p>
            <p>Paysera: LT693500010001366103</p>
          </div>
        </div>

        <div class="uzsakovas">
          <span class="title">UŽSAKOVAS</span>
          <div class="uzsakovas-info">
            ${customerBlock}
            ${
              signatureDataUrl
                ? `<img class="parasas" src="${signatureDataUrl}" alt="Parašas" />`
                : ""
            }
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function Center({ children }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-gray-600">
      {children}
    </div>
  );
}

function Row({ label, value, tall }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2">
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`col-span-2 text-sm ${tall ? "" : "truncate"}`}>
        {value || "—"}
      </div>
    </div>
  );
}

export default function PublicContractSign() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [signerName, setSignerName] = useState("");
  const [agree, setAgree] = useState(false);
  const sigRef = useRef(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch(`${API}/sutartys/public/${token}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.msg || "Neteisinga nuoroda");
        if (!ignore) setData(json.contract);
      } catch (e) {
        setErr(e.message || "Klaida");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [token]);

  const previewHtml = useMemo(() => {
    if (!data) return "";
    const dateStr = new Date().toLocaleDateString("lt-LT");
    const customer = {
      name: data.customerName || "",
      company: data.customerCompany || "",
      vat: data.customerVAT || data.customerCode || "",
      email: data.customerEmail || "",
      phone: data.customerPhone || "",
      address: data.customerAddress || "",
    };
    return buildContractHTML({
      number: data.number || "—",
      dateStr,
      customer,
      objectAddress: data.objectAddress || customer.address || "",
      notes: data.notes || "",
      signatureDataUrl: null, // peržiūroje – be parašo
    });
  }, [data]);

  async function handleSign() {
    setErr("");
    if (!agree) {
      setErr("Pažymėkite, kad susipažinote su sutartimi");
      return;
    }
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setErr("Įveskite parašą");
      return;
    }
    try {
      setSending(true);
      const signatureDataUrl = sigRef.current.toDataURL("image/png");
      const res = await fetch(`${API}/sutartys/public/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureDataUrl, signerName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.msg || "Nepavyko pasirašyti");
      navigate(`/sutartis/signed?file=${encodeURIComponent(json.pdfUrl)}`);
    } catch (e) {
      setErr(e.message || "Klaida");
    } finally {
      setSending(false);
    }
  }

  if (loading) return <Center>Kraunama…</Center>;
  if (err) return <Center>{err}</Center>;
  if (!data) return <Center>Nuoroda nebegalioja</Center>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl p-4">
        <h1 className="text-2xl font-semibold mb-3">Sutarties pasirašymas</h1>

        {/* Peržiūra (pilnas tekstas) */}
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b font-semibold">
            Sutarties peržiūra
          </div>
          <div className="h-[70vh]">
            <iframe
              title="Sutarties peržiūra"
              srcDoc={previewHtml}
              className="w-full h-full"
              sandbox="allow-same-origin"
            />
          </div>
        </div>

        {/* Pasirašymas */}
        <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold mb-2">Parašas</h2>

          <label className="flex items-center gap-2 mb-3 text-sm">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            Patvirtinu, kad susipažinau su sutarties sąlygomis
          </label>

          <div className="rounded-xl border bg-gray-50 overflow-hidden">
            <SignaturePad
              ref={sigRef}
              canvasProps={{ className: "w-full h-48" }}
            />
          </div>

          <div className="mt-2 flex gap-2">
            <button
              className="rounded-lg border px-3 py-1.5 bg-white hover:bg-gray-50"
              onClick={() => sigRef.current?.clear()}
            >
              Išvalyti
            </button>
            {/* Jei norėsi rinkti vardą/pavardę – atkomentuok */}
            {/* <input
              className="rounded-lg border px-3 py-1.5 flex-1"
              placeholder="Vardas, pavardė (nebūtina)"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
            /> */}
            <button
              className="rounded-lg bg-blue-600 text-white px-3 py-1.5 disabled:opacity-50"
              onClick={handleSign}
              disabled={sending || !agree}
              title={
                !agree
                  ? "Pirmiausia pažymėkite, kad susipažinote"
                  : "Pasirašyti"
              }
            >
              {sending ? "Siunčiama…" : "Pasirašyti"}
            </button>
          </div>

          {err && <div className="text-sm text-red-600 mt-2">{err}</div>}
        </div>
      </div>
    </div>
  );
}
