function recordTime(phaseId) {
  const now = performance.now() / 1000; // detik sejak page load
  document.getElementById(phaseId).value = now.toFixed(3);

  const timeDisplayId = {
    startLoading: 'start-loading-time',
    digging: 'digging-time',
    spotting1: 'spotting1-time',
    swingLoad: 'swing-load-time',
    spotting2: 'spotting2-time',
    dumpingExca: 'dumping-exca-time',
    spotting3: 'spotting3-time',
    swingEmpty: 'swing-empty-time',
    spotting4: 'spotting4-time',
    startLoadingdt: 'start-loading-time-dt',
    manuver: 'manuver-time'
  }[phaseId];

  const nowDate = new Date();
  const timeStr = nowDate.toLocaleTimeString('en-GB') + '.' +
    nowDate.getMilliseconds().toString().padStart(3, '0');
  document.getElementById(timeDisplayId).textContent = timeStr;
}

function resetTimeCall() {
  const ids = [
    'startLoading','digging','spotting1','swingLoad',
    'spotting2','dumpingExca','spotting3','swingEmpty','spotting4',
    'startLoadingdt','manuver'
  ];

  ids.forEach(id => {
    document.getElementById(id).value = '';
    const textId = id.replace(/([A-Z])/g, "-$1").toLowerCase() + '-time';
    if (document.getElementById(textId)) {
      document.getElementById(textId).textContent = '-';
    }
  });
}

document.getElementById("calc-form").addEventListener("submit", function (e) {
  e.preventDefault();

  // Ambil input
  const BC = parseFloat(document.getElementById("bucketCapacity").value);
  const F = parseFloat(document.getElementById("fillFactor").value);
  const TB = parseFloat(document.getElementById("totalBucket").value);
  const VC = parseFloat(document.getElementById("vesselCapacity").value);
  const KURS = parseFloat(document.getElementById("kursRupiah").value);
  const HD = parseFloat(document.getElementById("haulingDistance").value);
  const OT = parseFloat(document.getElementById("overtimeshift").value);
  const EX300 = parseFloat(document.getElementById("exca300").value);
  const EX200 = parseFloat(document.getElementById("exca200").value);
  const EX200SEL = parseFloat(document.getElementById("exca200sel").value);
  const DOZER = parseFloat(document.getElementById("dozer").value);
  const TDT = parseFloat(document.getElementById("dt").value);

  // Konstanta MATERIAL HGL & MGL
  const MP = 4.2;
  const ODPM = 0.00013;
  const DMAX = 2000;
  const FE300 = 22, DE300 = 87858, SE300 = 443468, CM300 = 50049;
  const FE200 = 16, DE200 = 46185, SE200 = 443468, CM200 = 51265;
  const FDT = 8, DDT = 33914, SDT = 443468, CMDT = 84500;
  const FDZ = 24, DDZ = 140826, SDZ = 443468, CMDZ = 55230;
  const FC = 14000;
  const Swell = 0.86;
  const DM = 1.583;
  const BS = 3500000;
  const TT = 700000;
  const CC = 2000000;
  const PMC = 18000;
  const SGAC = 10000;
  const HSEC = 4263.89;

  // Ambil waktu excavator dalam detik
    const startLoading = +document.getElementById("startLoading").value;
    const digging = +document.getElementById("digging").value;
    const spotting1 = +document.getElementById("spotting1").value;
    const swingLoad = +document.getElementById("swingLoad").value;
    const spotting2 = +document.getElementById("spotting2").value;
    const dumpingExca = +document.getElementById("dumpingExca").value;
    const spotting3 = +document.getElementById("spotting3").value;
    const swingEmpty = +document.getElementById("swingEmpty").value;
    const spotting4 = +document.getElementById("spotting4").value;

    // Ambil waktu dump truck dalam detik
    const startLoadingDT = +document.getElementById("startLoadingdt").value;
    const manuverDT = +document.getElementById("manuver").value;

    // Validasi input waktu excavator
    const allTimesExca = [startLoading, digging, spotting1, swingLoad, spotting2, dumpingExca, spotting3, swingEmpty, spotting4];
    if (allTimesExca.some(t => t === 0 || isNaN(t))) {
      alert("Lengkapi semua pencatatan waktu excavator sebelum menghitung.");
      return;
    }

    // Validasi input waktu dump truck
    if (startLoadingDT === 0 || isNaN(startLoadingDT) || manuverDT === 0 || isNaN(manuverDT)) {
      alert("Lengkapi semua pencatatan waktu dump truck sebelum menghitung.");
      return;
    }

    // Hitung durasi masing-masing tahapan excavator
    const dDig = digging - startLoading;
    const dSpot1 = spotting1 - digging;
    const dSwingL = swingLoad - spotting1;
    const dSpot2 = spotting2 - swingLoad;
    const dDumpExca = dumpingExca - spotting2;
    const dSpot3 = spotting3 - dumpingExca;
    const dSwingE = swingEmpty - spotting3;
    const dSpot4 = spotting4 - swingEmpty;

    // Perhitungan sesuai rumus baru
    const cycleExca = dDig + dSpot1 + dSwingL + dSpot2 + dDumpExca + dSpot3 + dSwingE + dSpot4;
    const totalSpottingTime = dSpot1 + dSpot2 + dSpot3 + dSpot4;
    const pureCycleExca = cycleExca - totalSpottingTime;
    const effExca = pureCycleExca / cycleExca;

    const q = BC * F;
    const prodExca = (q * 3600 * effExca * Swell) / cycleExca;
    const prodExcaTon = prodExca * DM;

    // Perhitungan dump truck sesuai rumus baru
    const cycleDT = (manuverDT - startLoadingDT) + (cycleExca * TB);
    const RPH = 60 / (cycleDT / 60);
    const prodDT = (VC * 3600 * Swell) / cycleDT;
    const prodDTTon = prodDT * DM;
    const FM = prodExcaTon / prodDTTon;

  // Overdistance
  const OD = Math.max(0, HD - DMAX);

  // Revenue
  const revMat = prodExcaTon  * MP * KURS;
  const revDist = OD * ODPM * prodExcaTon * KURS;
  const revTotal = revMat + revDist;

  // Cost
  const fuelExca300 = FE300 * FC * EX300;
  const fuelExca200 = (EX200 + EX200SEL) * FE200 * FC;
  const fuelDT = TDT * FDT * FC;
  const fuelDZ = DOZER * FDZ * FC;

  //total overtime
  const TO = ((BS / 173) * OT) / 16.5;

  //allinbasic
  const AB = ((BS / 30) + (TT / 30)) / 16.5;

  //SO
  const SO = AB + TO;

  const costExca300 = fuelExca300 + (EX300 * (DE300 + CM300 + SO));
  const costExca200 = fuelExca200 + ((EX200 + EX200SEL) * (DE200 + SO + CM200));
  const costDT = fuelDT + (TDT * (DDT + SO + CMDT));
  const costDZ = fuelDZ + (DOZER * (DDZ + SO + CMDZ));
  const POH = (EX300 + EX200 + TDT + DOZER + EX200SEL) * (CC / 30);
  const GAOP = ((EX300 + EX200 + TDT + DOZER + EX200SEL) * 0.5 * PMC * 3) + ((EX300 + EX200 + TDT + DOZER + EX200SEL) * 0.5 * PMC * 4) + ((EX300 + EX200 + TDT + DOZER + EX200SEL) * 0.5 * SGAC);
  const HSOP = (EX300 + EX200 + TDT + DOZER + EX200SEL) * HSEC;

  const costTotal = costExca300 + costExca200 + costDT + costDZ + POH + GAOP + HSOP;

  // Profit
  const profitIDR = revTotal - costTotal;

  // Format Number
  const formatIDR = profitIDR.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });

  fetch("https://script.google.com/macros/s/AKfycbxBkxFhZT9N2Z400MA7dddI7Bgogj8GX6T7dWqvBeUEzwi3I7FUcUh8V7Fz1a9irpSE/exec", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    material: "hglmgl",
    area: document.getElementById("area").value,
    cuaca: document.getElementById("cuaca").value,
    cycleExca: cycleExca.toFixed(2),
    prodExcaTon: prodExcaTon.toFixed(2),
    cycleDT: cycleDT.toFixed(2),
    prodDTTon: prodDTTon.toFixed(2),
    RPH: RPH.toFixed(2),
    FM: FM.toFixed(2),
    costTotal: costTotal,
    revTotal: revTotal,
    profitIDR: profitIDR
  })
});

  // Output
  document.getElementById("output").innerHTML = `
  <label>Cycle Time Excavator 300 (s)</label>
  <input type="text" value="${cycleExca.toFixed(2)}" readonly>

  <label>Cycle Time Dumptruck (s)</label>
  <input type="text" value="${cycleDT.toFixed(2)}" readonly>

  <label>Excavator 300 Productivity (Ton/Hour)</label>
  <input type="text" value="${prodExcaTon.toFixed(2)}" readonly>

  <label>Dump Truck Productivity (Ton/Hour)</label>
  <input type="text" value="${prodDTTon.toFixed(2)}" readonly>

  <label>Ritase/Hour</label>
  <input type="text" value="${RPH.toFixed(2)}" readonly>

  <label>Fleet Matching (Unit)</label>
  <input type="text" value="${FM.toFixed(2)}" readonly>

  <label>Cost Total (Rupiah/Hour)</label>
  <input type="text" value="${costTotal.toFixed(2)}" readonly>

  <label>Revenue Total (Rupiah/Hour)</label>
  <input type="text" value="${revTotal.toFixed(2)}" readonly>

  <label>Profit (Rupiah/Hour)</label>
  <input type="text" value="${formatIDR}" readonly>
  `;
});
