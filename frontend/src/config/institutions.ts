export interface InstitutionEntry {
  address: string
  name: string
  region: string
}

export const INSTITUTIONS: InstitutionEntry[] = [
  // ── Nigeria ──────────────────────────────────────────────────────────────────
  { address: '0x0000000000000000000000000000000000000001', name: 'University of Lagos (UNILAG)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000002', name: 'Ahmadu Bello University (ABU)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000003', name: 'University of Ibadan (UI)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000004', name: 'University of Nigeria, Nsukka (UNN)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000005', name: 'Obafemi Awolowo University (OAU)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000006', name: 'University of Benin (UNIBEN)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000007', name: 'University of Ilorin (UNILORIN)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000008', name: 'University of Port Harcourt (UNIPORT)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000009', name: 'Federal University of Technology, Minna (FUTMINNA)', region: 'Nigeria' },
  { address: '0x000000000000000000000000000000000000000a', name: 'Covenant University', region: 'Nigeria' },
  { address: '0x000000000000000000000000000000000000000b', name: 'Babcock University', region: 'Nigeria' },
  { address: '0x000000000000000000000000000000000000000c', name: 'Lagos State University (LASU)', region: 'Nigeria' },
  { address: '0x000000000000000000000000000000000000000d', name: 'Federal University of Technology, Akure (FUTA)', region: 'Nigeria' },
  { address: '0x000000000000000000000000000000000000000e', name: 'University of Calabar (UNICAL)', region: 'Nigeria' },
  { address: '0x000000000000000000000000000000000000000f', name: 'Bayero University, Kano (BUK)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000010', name: 'Nnamdi Azikiwe University (UNIZIK)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000011', name: 'University of Jos (UNIJOS)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000012', name: 'University of Maiduguri (UNIMAID)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000013', name: 'Federal University, Oye-Ekiti (FUOYE)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000014', name: 'Rivers State University (RSU)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000015', name: 'Ladoke Akintola University of Technology (LAUTECH)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000016', name: 'Abia State University (ABSU)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000017', name: 'Ekiti State University (EKSU)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000018', name: 'Imo State University (IMSU)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000019', name: 'Delta State University (DELSU)', region: 'Nigeria' },
  { address: '0x000000000000000000000000000000000000001a', name: 'Pan-Atlantic University', region: 'Nigeria' },
  { address: '0x000000000000000000000000000000000000001b', name: 'Bowen University', region: 'Nigeria' },
  { address: '0x000000000000000000000000000000000000001c', name: "Redeemer's University", region: 'Nigeria' },
  { address: '0x000000000000000000000000000000000000001d', name: 'Landmark University', region: 'Nigeria' },
  { address: '0x000000000000000000000000000000000000001e', name: 'Afe Babalola University (ABUAD)', region: 'Nigeria' },

  // ── United States ────────────────────────────────────────────────────────────
  { address: '0x0000000000000000000000000000000000000101', name: 'Harvard University', region: 'United States' },
  { address: '0x0000000000000000000000000000000000000102', name: 'Massachusetts Institute of Technology (MIT)', region: 'United States' },
  { address: '0x0000000000000000000000000000000000000103', name: 'Stanford University', region: 'United States' },
  { address: '0x0000000000000000000000000000000000000104', name: 'University of California, Berkeley (UC Berkeley)', region: 'United States' },
  { address: '0x0000000000000000000000000000000000000105', name: 'Columbia University', region: 'United States' },
  { address: '0x0000000000000000000000000000000000000106', name: 'Yale University', region: 'United States' },
  { address: '0x0000000000000000000000000000000000000107', name: 'Princeton University', region: 'United States' },
  { address: '0x0000000000000000000000000000000000000108', name: 'University of Chicago', region: 'United States' },
  { address: '0x0000000000000000000000000000000000000109', name: 'New York University (NYU)', region: 'United States' },
  { address: '0x000000000000000000000000000000000000010a', name: 'University of California, Los Angeles (UCLA)', region: 'United States' },
  { address: '0x000000000000000000000000000000000000010b', name: 'University of Michigan', region: 'United States' },
  { address: '0x000000000000000000000000000000000000010c', name: 'University of Pennsylvania (UPenn)', region: 'United States' },
  { address: '0x000000000000000000000000000000000000010d', name: 'Duke University', region: 'United States' },
  { address: '0x000000000000000000000000000000000000010e', name: 'Georgia Institute of Technology (Georgia Tech)', region: 'United States' },
  { address: '0x000000000000000000000000000000000000010f', name: 'University of Texas at Austin', region: 'United States' },
  { address: '0x0000000000000000000000000000000000000110', name: 'Howard University', region: 'United States' },

  // ── United Kingdom ───────────────────────────────────────────────────────────
  { address: '0x0000000000000000000000000000000000000201', name: 'University of Oxford', region: 'United Kingdom' },
  { address: '0x0000000000000000000000000000000000000202', name: 'University of Cambridge', region: 'United Kingdom' },
  { address: '0x0000000000000000000000000000000000000203', name: 'Imperial College London', region: 'United Kingdom' },
  { address: '0x0000000000000000000000000000000000000204', name: 'University College London (UCL)', region: 'United Kingdom' },
  { address: '0x0000000000000000000000000000000000000205', name: "King's College London", region: 'United Kingdom' },
  { address: '0x0000000000000000000000000000000000000206', name: 'London School of Economics (LSE)', region: 'United Kingdom' },
  { address: '0x0000000000000000000000000000000000000207', name: 'University of Edinburgh', region: 'United Kingdom' },
  { address: '0x0000000000000000000000000000000000000208', name: 'University of Manchester', region: 'United Kingdom' },
  { address: '0x0000000000000000000000000000000000000209', name: 'University of Birmingham', region: 'United Kingdom' },
  { address: '0x000000000000000000000000000000000000020a', name: 'University of Leeds', region: 'United Kingdom' },
  { address: '0x000000000000000000000000000000000000020b', name: 'University of Warwick', region: 'United Kingdom' },
  { address: '0x000000000000000000000000000000000000020c', name: 'University of Bristol', region: 'United Kingdom' },

  // ── Europe ───────────────────────────────────────────────────────────────────
  { address: '0x0000000000000000000000000000000000000301', name: 'ETH Zurich (Switzerland)', region: 'Europe' },
  { address: '0x0000000000000000000000000000000000000302', name: 'Sorbonne University (France)', region: 'Europe' },
  { address: '0x0000000000000000000000000000000000000303', name: 'Technical University of Munich (Germany)', region: 'Europe' },
  { address: '0x0000000000000000000000000000000000000304', name: 'University of Amsterdam (Netherlands)', region: 'Europe' },
  { address: '0x0000000000000000000000000000000000000305', name: 'Karolinska Institute (Sweden)', region: 'Europe' },
  { address: '0x0000000000000000000000000000000000000306', name: 'University of Copenhagen (Denmark)', region: 'Europe' },
  { address: '0x0000000000000000000000000000000000000307', name: 'Ludwig Maximilian University of Munich (Germany)', region: 'Europe' },
  { address: '0x0000000000000000000000000000000000000308', name: 'Sapienza University of Rome (Italy)', region: 'Europe' },
  { address: '0x0000000000000000000000000000000000000309', name: 'University of Barcelona (Spain)', region: 'Europe' },
  { address: '0x000000000000000000000000000000000000030a', name: 'KU Leuven (Belgium)', region: 'Europe' },
  { address: '0x000000000000000000000000000000000000030b', name: 'Delft University of Technology (Netherlands)', region: 'Europe' },
  { address: '0x000000000000000000000000000000000000030c', name: 'University of Helsinki (Finland)', region: 'Europe' },

  // ── Canada ───────────────────────────────────────────────────────────────────
  { address: '0x0000000000000000000000000000000000000401', name: 'University of Toronto', region: 'Canada' },
  { address: '0x0000000000000000000000000000000000000402', name: 'McGill University', region: 'Canada' },
  { address: '0x0000000000000000000000000000000000000403', name: 'University of British Columbia (UBC)', region: 'Canada' },
  { address: '0x0000000000000000000000000000000000000404', name: 'University of Waterloo', region: 'Canada' },
  { address: '0x0000000000000000000000000000000000000405', name: 'University of Alberta', region: 'Canada' },

  // ── Asia & Oceania ───────────────────────────────────────────────────────────
  { address: '0x0000000000000000000000000000000000000501', name: 'National University of Singapore (NUS)', region: 'Asia & Oceania' },
  { address: '0x0000000000000000000000000000000000000502', name: 'University of Tokyo (Japan)', region: 'Asia & Oceania' },
  { address: '0x0000000000000000000000000000000000000503', name: 'Tsinghua University (China)', region: 'Asia & Oceania' },
  { address: '0x0000000000000000000000000000000000000504', name: 'University of Melbourne (Australia)', region: 'Asia & Oceania' },
  { address: '0x0000000000000000000000000000000000000505', name: 'University of Sydney (Australia)', region: 'Asia & Oceania' },
  { address: '0x0000000000000000000000000000000000000506', name: 'Seoul National University (South Korea)', region: 'Asia & Oceania' },
  { address: '0x0000000000000000000000000000000000000507', name: 'Indian Institute of Technology, Bombay (IIT Bombay)', region: 'Asia & Oceania' },
  { address: '0x0000000000000000000000000000000000000508', name: 'University of Hong Kong (HKU)', region: 'Asia & Oceania' },

  // ── Africa (outside Nigeria) ─────────────────────────────────────────────────
  { address: '0x0000000000000000000000000000000000000601', name: 'University of Cape Town (South Africa)', region: 'Africa' },
  { address: '0x0000000000000000000000000000000000000602', name: 'University of Witwatersrand (South Africa)', region: 'Africa' },
  { address: '0x0000000000000000000000000000000000000603', name: 'University of Ghana, Legon', region: 'Africa' },
  { address: '0x0000000000000000000000000000000000000604', name: 'Makerere University (Uganda)', region: 'Africa' },
  { address: '0x0000000000000000000000000000000000000605', name: 'University of Nairobi (Kenya)', region: 'Africa' },
  { address: '0x0000000000000000000000000000000000000606', name: 'Cairo University (Egypt)', region: 'Africa' },
  { address: '0x0000000000000000000000000000000000000607', name: 'Stellenbosch University (South Africa)', region: 'Africa' },
  { address: '0x0000000000000000000000000000000000000608', name: 'Addis Ababa University (Ethiopia)', region: 'Africa' },

  // ── South America ────────────────────────────────────────────────────────────
  { address: '0x0000000000000000000000000000000000000701', name: 'University of São Paulo (USP, Brazil)', region: 'South America' },
  { address: '0x0000000000000000000000000000000000000702', name: 'University of Buenos Aires (Argentina)', region: 'South America' },
  { address: '0x0000000000000000000000000000000000000703', name: 'Pontificia Universidad Católica de Chile', region: 'South America' },
]
