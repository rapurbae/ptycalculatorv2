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
  const DOZER = parseFloat(document.getElementById("dozer").value);

  // Konstanta
  const MP = 1.790;
  const ODPM = 0.00018;
  const DMAX = 700;
  const FE300 = 22, DE300 = 87858, CM300 = 50049;
  const FE200 = 16, DE200 = 46185, CM200 = 51265;
  const FDT = 8, DDT = 33914, CMDT = 84500;
  const FDZ = 24, DDZ = 140826, CMDZ = 55230;
  const FC = 14000;
  const Swell = 0.82;
  const BS = 3500000;
  const TT = 700000;
  const CC = 2000000;
  const PMC = 18000;
  const SGAC = 10000;
  const HSEC = 4263.89;

  // ambil timestamp excavator
  const timesExca = [
    +document.getElementById("startLoading").value,
    +document.getElementById("digging").value,
    +document.getElementById("spotting1").value,
    +document.getElementById("swingLoad").value,
    +document.getElementById("spotting2").value,
    +document.getElementById("dumpingExca").value,
    +document.getElementById("spotting3").value,
    +document.getElementById("swingEmpty").value,
    +document.getElementById("spotting4").value
  ];

  const durationsExca = [];
  for (let i = 1; i < timesExca.length; i++) {
    if (timesExca[i] && timesExca[i-1]) {
      durationsExca.push(timesExca[i] - timesExca[i-1]);
    } else {
      durationsExca.push(0);
    }
  }

  const diggingTime   = durationsExca[0];
  const spotting1Time = durationsExca[1];
  const swingLoadTime = durationsExca[2];
  const spotting2Time = durationsExca[3];
  const dumpingTime   = durationsExca[4];
  const spotting3Time = durationsExca[5];
  const swingEmptyTime= durationsExca[6];
  const spotting4Time = durationsExca[7];

  const cycleExca = diggingTime + spotting1Time + swingLoadTime +
                    spotting2Time + dumpingTime + spotting3Time +
                    swingEmptyTime + spotting4Time;

  const totalSpottingTime = spotting1Time + spotting2Time + spotting3Time + spotting4Time;
  const pureCycleExca = cycleExca - totalSpottingTime;
  const effExca = (cycleExca > 0) ? pureCycleExca / cycleExca : 0;

  const q = BC * F;
  const prodExca = (cycleExca > 0) ?
    (q * 3600 * effExca * Swell) / cycleExca : 0;

  const startDT = +document.getElementById("startLoadingdt").value;
  const manuverDT = +document.getElementById("manuver").value;

  let cycleDT = 0;  
  if (manuverDT && startDT) {
    cycleDT = (manuverDT - startDT) + (cycleExca * TB);
  }

  const prodDT = (cycleDT > 0) ?
    (VC * 3600 * Swell) / cycleDT : 0;

  const RPH = (cycleDT > 0) ? 60 / (cycleDT / 60) : 0;

  const FM = (prodDT > 0) ? prodExca / prodDT : 0;

  // Overdistance
  const OD = Math.max(0, HD - DMAX);

  // Revenue
  const revMat = prodExca * MP * KURS;
  const revDist = OD * ODPM * prodExca * KURS;
  const revTotal = revMat + revDist;

  // Cost
  const fuelExca300 = FE300 * FC * EX300;
  const fuelExca200 = EX200 * FE200 * FC;
  const fuelDT = FM * FDT * FC;
  const fuelDZ = DOZER * FDZ * FC;

  //total overtime
  const TO = ((BS / 173) * OT) / 16.5;

  //allinbasic
  const AB = ((BS / 30) + (TT / 30)) / 16.5;

  //SO
  const SO = AB + TO;

  const costExca300 = fuelExca300 + (EX300 * (DE300 + CM300 + SO));
  const costExca200 = fuelExca200 + (EX200 * (DE200 + CM200 + SO));
  const costDT = fuelDT + (FM * (DDT + CMDT + SO));
  const costDZ = fuelDZ + (DOZER * (DDZ + CMDZ + SO));
  const POH = (EX300 + EX200 + FM + DOZER) * (CC / 30);
  const GAOP = ((EX300 + EX200 + FM + DOZER) * 0.5 * PMC * 3) + ((EX300 + EX200 + FM + DOZER) * 0.5 * PMC * 4) + ((EX300 + EX200 + FM + DOZER) * 0.5 * SGAC);
  const HSOP = (EX300 + EX200 + FM + DOZER) * HSEC;

  const costTotal = costExca300 + costExca200 + costDT + costDZ + POH + GAOP + HSOP;

  // Profit
  const profitIDR = revTotal - costTotal;

  // Format Number
  const formatC = costTotal.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });
  const formatR = revTotal.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });
  const formatIDR = profitIDR.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });

  // Kirim data ke Google Sheets
  fetch("https://script.google.com/macros/s/AKfycbwfIK9u1BHK0tLPRqoLaZTERd2uDte88hS4wC-iHBgsA5dExuYBkcEsxutTJ6UJebI4/exec", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    material: "ob",
    area: document.getElementById("area").value,
    cuaca: document.getElementById("cuaca").value,
    cycleExca: cycleExca.toFixed(2),
    prodExca: prodExca.toFixed(2),
    cycleDT: cycleDT.toFixed(2),
    prodDT: prodDT.toFixed(2),
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

  <label>Excavator 300 Productivity (Bcm/Hour)</label>
  <input type="text" value="${prodExca.toFixed(2)}" readonly>
  
  <label>Dump Truck Productivity (Bcm/Hour)</label>
  <input type="text" value="${prodDT.toFixed(2)}" readonly>

  <label>Ritase/Hour</label>
  <input type="text" value="${RPH.toFixed(2)}" readonly>

  <label>Fleet Matching (Unit)</label>
  <input type="text" value="${FM.toFixed(2)}" readonly>

  <label>Cost Total (Rupiah/Hour)</label>
  <input type="text" value="${formatC}" readonly>

  <label>Revenue Total (Rupiah/Hour)</label>
  <input type="text" value="${formatR}" readonly>

  <label>Profit (Rupiah/Hour)</label>
  <input type="text" value="${formatIDR}" readonly>
`;

});


