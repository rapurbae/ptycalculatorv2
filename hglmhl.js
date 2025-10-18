document.getElementById("calc-form").addEventListener("submit", function (e) {
  e.preventDefault();

  // Ambil input
  const BC = parseFloat(document.getElementById("bucketCapacity").value);
  const F = parseFloat(document.getElementById("fillFactor").value);
  const CTE = parseFloat(document.getElementById("cycleTimeExca300").value);
  const TB = parseFloat(document.getElementById("totalBucket").value);
  const VC = parseFloat(document.getElementById("vesselCapacity").value);
  const MT = parseFloat(document.getElementById("manuverTime").value);
  const DT = parseFloat(document.getElementById("dumpingTime").value);
  const SL = parseFloat(document.getElementById("speedLoad").value);
  const SE = parseFloat(document.getElementById("speedEmpty").value);
  const KURS = parseFloat(document.getElementById("kursRupiah").value);
  const HD = parseFloat(document.getElementById("haulingDistance").value);
  const OT = parseFloat(document.getElementById("overtimeshift").value);
  const EX300 = parseFloat(document.getElementById("exca300").value);
  const EX200 = parseFloat(document.getElementById("exca200").value);
  const EX200SEL = parseFloat(document.getElementById("exca200sel").value);
  const DOZER = parseFloat(document.getElementById("dozer").value);

  // Konstanta MATERIAL HGL & MGL
  const MP = 4.2;
  const ODPM = 0.00013;
  const DMAX = 2000;
  const FE300 = 22, DE300 = 87858, CM300 = 50049;
  const FE200 = 16, DE200 = 46185, CM200 = 51265;
  const FDT = 8, DDT = 33914, CMDT = 84500;
  const FDZ = 24, DDZ = 140826, CMDZ = 55230;
  const FC = 14000;
  const EF = 0.75, SF = 0.86;
  const DM = 1.583;
  const BS = 3500000;
  const TT = 700000;

  // Hitung q
  const q = BC * F;

  // Excavator Productivity
  const prodExca = q * 3600 * EF * SF / CTE;
  const prodExcaTon = prodExca * DM;

  // Loading Time
  const LT = CTE * TB;

  // Travel Time
  const TL = (HD / 1000) / SL * 3600;
  const TE = (HD / 1000) / SE * 3600;

  // Dump Truck Cycle
  const CTD = LT + TL + TE + MT + DT;

  // Ritase & Dump Truck Productivity
  const RPH = 60 / (CTD / 60);
  const prodDT = EF * VC * 3600 * SF / CTD;
  const prodDTTon = prodDT * DM;

  // Fleet Matching
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
  const fuelDT = FM * FDT * FC;
  const fuelDZ = DOZER * FDZ * FC;
  //total overtime
  const TO = ((BS / 173) * OT) / 16.5;

  //allinbasic
  const AB = ((BS / 30) + (TT / 30)) / 16.5;

  //SO
  const SO = AB + TO;

  const costExca300 = fuelExca300 + (EX300 * (DE300 + CM300 + SO));
  const costExca200 = fuelExca200 + ((EX200 + EX200SEL) * (DE200 + SO + CM200));
  const costDT = fuelDT + (FM * (DDT + SO + CMDT));
  const costDZ = fuelDZ + (DOZER * (DDZ + SO + CMDZ));

  const costTotal = costExca300 + costExca200 + costDT + costDZ;

  // Profit
  const profitIDR = revTotal - costTotal;

  // Format Number
  const formatC = costTotal.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });
  const formatR = revTotal.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });
  const formatIDR = profitIDR.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });

  // Output
  document.getElementById("output").innerHTML = `
  <label>Excavator 300 Productivity (Ton/Hour)</label>
  <input type="text" value="${prodExcaTon.toFixed(2)}" readonly>

  <label>Dump Truck Productivity (Ton/Hour)</label>
  <input type="text" value="${prodDTTon.toFixed(2)}" readonly>

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
