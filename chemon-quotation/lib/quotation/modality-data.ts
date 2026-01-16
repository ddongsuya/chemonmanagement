import { ModalityLevel1, SelectedModality } from '@/types/workflow-quotation';

export const modalityData: ModalityLevel1[] = [
  {
    level1_id: "SM",
    level1_name: "저분자화합물",
    level1_name_en: "Small Molecules",
    icon: "💊",
    level2: [
      {
        level2_id: "SM-SYN",
        level2_name: "합성의약품",
        level2_name_en: "Synthetic Drugs",
        level3: [
          { level3_id: "SM-SYN-GEN", level3_name: "일반 합성의약품", level3_name_en: "General Synthetic" }
        ]
      },
      {
        level2_id: "SM-NAT",
        level2_name: "천연물의약품",
        level2_name_en: "Natural Products",
        level3: [
          { level3_id: "SM-NAT-GEN", level3_name: "일반 천연물", level3_name_en: "General Natural Products" },
          { level3_id: "SM-NAT-HRB", level3_name: "생약제제", level3_name_en: "Herbal Medicine" }
        ]
      },
      {
        level2_id: "SM-CMB",
        level2_name: "복합제",
        level2_name_en: "Combination Products",
        level3: [
          { level3_id: "SM-CMB-FDC", level3_name: "고정용량복합제", level3_name_en: "Fixed-Dose Combination" }
        ]
      }
    ]
  },
  {
    level1_id: "BIO",
    level1_name: "바이오의약품",
    level1_name_en: "Biologics",
    icon: "🧬",
    level2: [
      {
        level2_id: "BIO-AB",
        level2_name: "항체의약품",
        level2_name_en: "Antibody Therapeutics",
        level3: [
          { level3_id: "BIO-AB-MAB", level3_name: "단일클론항체", level3_name_en: "Monoclonal Antibody" },
          { level3_id: "BIO-AB-BIS", level3_name: "이중항체", level3_name_en: "Bispecific Antibody" },
          { level3_id: "BIO-AB-ADC", level3_name: "항체약물접합체", level3_name_en: "ADC" },
          { level3_id: "BIO-AB-FRG", level3_name: "항체단편", level3_name_en: "Antibody Fragment" }
        ]
      },
      {
        level2_id: "BIO-RP",
        level2_name: "재조합단백질",
        level2_name_en: "Recombinant Proteins",
        level3: [
          { level3_id: "BIO-RP-HOR", level3_name: "호르몬/성장인자", level3_name_en: "Hormones/Growth Factors" },
          { level3_id: "BIO-RP-ENZ", level3_name: "효소", level3_name_en: "Enzymes" },
          { level3_id: "BIO-RP-CYT", level3_name: "사이토카인", level3_name_en: "Cytokines" },
          { level3_id: "BIO-RP-FUS", level3_name: "융합단백질", level3_name_en: "Fusion Proteins" }
        ]
      },
      {
        level2_id: "BIO-PEP",
        level2_name: "펩타이드의약품",
        level2_name_en: "Peptide Therapeutics",
        level3: [
          { level3_id: "BIO-PEP-SYN", level3_name: "합성펩타이드", level3_name_en: "Synthetic Peptide" },
          { level3_id: "BIO-PEP-REC", level3_name: "재조합펩타이드", level3_name_en: "Recombinant Peptide" }
        ]
      },
      {
        level2_id: "BIO-VAC",
        level2_name: "백신",
        level2_name_en: "Vaccines",
        level3: [
          { level3_id: "BIO-VAC-PRO", level3_name: "예방백신", level3_name_en: "Prophylactic Vaccine" },
          { level3_id: "BIO-VAC-THE", level3_name: "치료백신", level3_name_en: "Therapeutic Vaccine" }
        ]
      }
    ]
  },
  {
    level1_id: "CELL",
    level1_name: "세포치료제",
    level1_name_en: "Cell Therapy",
    icon: "🔬",
    level2: [
      {
        level2_id: "CELL-SOM",
        level2_name: "체세포치료제",
        level2_name_en: "Somatic Cell Therapy",
        level3: [
          { level3_id: "CELL-SOM-AUT", level3_name: "자가유래", level3_name_en: "Autologous" },
          { level3_id: "CELL-SOM-ALO", level3_name: "동종유래", level3_name_en: "Allogeneic" }
        ]
      },
      {
        level2_id: "CELL-STE",
        level2_name: "줄기세포치료제",
        level2_name_en: "Stem Cell Therapy",
        level3: [
          { level3_id: "CELL-STE-ADU", level3_name: "성체줄기세포", level3_name_en: "Adult Stem Cells" },
          { level3_id: "CELL-STE-IPS", level3_name: "유도만능줄기세포", level3_name_en: "iPSC" },
          { level3_id: "CELL-STE-ESC", level3_name: "배아줄기세포", level3_name_en: "ESC" }
        ]
      },
      {
        level2_id: "CELL-IMM",
        level2_name: "면역세포치료제",
        level2_name_en: "Immune Cell Therapy",
        level3: [
          { level3_id: "CELL-IMM-CAR-T", level3_name: "CAR-T", level3_name_en: "CAR-T" },
          { level3_id: "CELL-IMM-CAR-NK", level3_name: "CAR-NK", level3_name_en: "CAR-NK" },
          { level3_id: "CELL-IMM-TIL", level3_name: "TIL", level3_name_en: "TIL" },
          { level3_id: "CELL-IMM-TCR", level3_name: "TCR-T", level3_name_en: "TCR-T" }
        ]
      }
    ]
  },
  {
    level1_id: "GENE",
    level1_name: "유전자치료제",
    level1_name_en: "Gene Therapy",
    icon: "🧪",
    level2: [
      {
        level2_id: "GENE-VIR",
        level2_name: "바이러스벡터",
        level2_name_en: "Viral Vector",
        level3: [
          { level3_id: "GENE-VIR-AAV", level3_name: "AAV", level3_name_en: "AAV" },
          { level3_id: "GENE-VIR-LEN", level3_name: "렌티바이러스", level3_name_en: "Lentivirus" },
          { level3_id: "GENE-VIR-ADN", level3_name: "아데노바이러스", level3_name_en: "Adenovirus" },
          { level3_id: "GENE-VIR-RET", level3_name: "레트로바이러스", level3_name_en: "Retrovirus" }
        ]
      },
      {
        level2_id: "GENE-NON",
        level2_name: "비바이러스벡터",
        level2_name_en: "Non-viral Vector",
        level3: [
          { level3_id: "GENE-NON-LNP", level3_name: "LNP", level3_name_en: "LNP" },
          { level3_id: "GENE-NON-PLA", level3_name: "플라스미드DNA", level3_name_en: "Plasmid DNA" },
          { level3_id: "GENE-NON-NAN", level3_name: "기타나노입자", level3_name_en: "Other Nanoparticles" }
        ]
      },
      {
        level2_id: "GENE-EDT",
        level2_name: "유전자편집",
        level2_name_en: "Gene Editing",
        level3: [
          { level3_id: "GENE-EDT-CRI", level3_name: "CRISPR/Cas9", level3_name_en: "CRISPR/Cas9" },
          { level3_id: "GENE-EDT-BAS", level3_name: "Base editing", level3_name_en: "Base Editing" },
          { level3_id: "GENE-EDT-PRI", level3_name: "Prime editing", level3_name_en: "Prime Editing" }
        ]
      }
    ]
  },
  {
    level1_id: "OLIGO",
    level1_name: "핵산치료제",
    level1_name_en: "Oligonucleotide Therapeutics",
    icon: "💉",
    level2: [
      {
        level2_id: "OLIGO-ASO",
        level2_name: "ASO",
        level2_name_en: "Antisense Oligonucleotide",
        level3: [
          { level3_id: "OLIGO-ASO-GEN", level3_name: "일반ASO", level3_name_en: "General ASO" },
          { level3_id: "OLIGO-ASO-GAL", level3_name: "GalNAc-ASO", level3_name_en: "GalNAc-ASO" }
        ]
      },
      {
        level2_id: "OLIGO-SIR",
        level2_name: "siRNA",
        level2_name_en: "siRNA",
        level3: [
          { level3_id: "OLIGO-SIR-GAL", level3_name: "GalNAc-siRNA", level3_name_en: "GalNAc-siRNA" },
          { level3_id: "OLIGO-SIR-LNP", level3_name: "LNP-siRNA", level3_name_en: "LNP-siRNA" }
        ]
      },
      {
        level2_id: "OLIGO-MRN",
        level2_name: "mRNA",
        level2_name_en: "mRNA",
        level3: [
          { level3_id: "OLIGO-MRN-LNP", level3_name: "LNP-mRNA", level3_name_en: "LNP-mRNA" }
        ]
      },
      {
        level2_id: "OLIGO-APT",
        level2_name: "Aptamer",
        level2_name_en: "Aptamer",
        level3: [
          { level3_id: "OLIGO-APT-GEN", level3_name: "일반Aptamer", level3_name_en: "General Aptamer" }
        ]
      },
      {
        level2_id: "OLIGO-MIR",
        level2_name: "miRNA",
        level2_name_en: "miRNA",
        level3: [
          { level3_id: "OLIGO-MIR-MIM", level3_name: "miRNA mimic", level3_name_en: "miRNA Mimic" },
          { level3_id: "OLIGO-MIR-INH", level3_name: "miRNA inhibitor", level3_name_en: "miRNA Inhibitor" }
        ]
      }
    ]
  },
  {
    level1_id: "RADIO",
    level1_name: "방사성의약품",
    level1_name_en: "Radiopharmaceuticals",
    icon: "☢️",
    level2: [
      {
        level2_id: "RADIO-DX",
        level2_name: "진단용",
        level2_name_en: "Diagnostic",
        level3: [
          { level3_id: "RADIO-DX-PET", level3_name: "PET", level3_name_en: "PET" },
          { level3_id: "RADIO-DX-SPE", level3_name: "SPECT", level3_name_en: "SPECT" }
        ]
      },
      {
        level2_id: "RADIO-TX",
        level2_name: "치료용",
        level2_name_en: "Therapeutic",
        level3: [
          { level3_id: "RADIO-TX-BET", level3_name: "β-방출", level3_name_en: "Beta-emitter" },
          { level3_id: "RADIO-TX-ALP", level3_name: "α-방출", level3_name_en: "Alpha-emitter" }
        ]
      }
    ]
  },
  {
    level1_id: "DEVICE",
    level1_name: "의료기기",
    level1_name_en: "Medical Devices",
    icon: "🔧",
    level2: [
      {
        level2_id: "DEVICE-IMP",
        level2_name: "이식형",
        level2_name_en: "Implantable",
        level3: [
          { level3_id: "DEVICE-IMP-ORT", level3_name: "정형외과용", level3_name_en: "Orthopedic" },
          { level3_id: "DEVICE-IMP-CVS", level3_name: "심혈관용", level3_name_en: "Cardiovascular" },
          { level3_id: "DEVICE-IMP-NEU", level3_name: "신경계용", level3_name_en: "Neurological" },
          { level3_id: "DEVICE-IMP-DEN", level3_name: "치과용", level3_name_en: "Dental" },
          { level3_id: "DEVICE-IMP-OPH", level3_name: "안과용", level3_name_en: "Ophthalmic" }
        ]
      },
      {
        level2_id: "DEVICE-IVD",
        level2_name: "체외진단",
        level2_name_en: "IVD",
        level3: [
          { level3_id: "DEVICE-IVD-GEN", level3_name: "일반IVD", level3_name_en: "General IVD" }
        ]
      },
      {
        level2_id: "DEVICE-CMB",
        level2_name: "조합제품",
        level2_name_en: "Combination Products",
        level3: [
          { level3_id: "DEVICE-CMB-DES", level3_name: "약물방출스텐트", level3_name_en: "Drug-Eluting Stent" },
          { level3_id: "DEVICE-CMB-PFS", level3_name: "프리필드시린지", level3_name_en: "Prefilled Syringe" },
          { level3_id: "DEVICE-CMB-PAT", level3_name: "경피패치", level3_name_en: "Transdermal Patch" }
        ]
      }
    ]
  },
  {
    level1_id: "MICRO",
    level1_name: "마이크로바이옴",
    level1_name_en: "Microbiome",
    icon: "🦠",
    level2: [
      {
        level2_id: "MICRO-LBP",
        level2_name: "생균치료제",
        level2_name_en: "Live Biotherapeutic Products",
        level3: [
          { level3_id: "MICRO-LBP-SIN", level3_name: "단일균주", level3_name_en: "Single Strain" },
          { level3_id: "MICRO-LBP-MUL", level3_name: "다중균주", level3_name_en: "Multi-Strain" }
        ]
      },
      {
        level2_id: "MICRO-FMT",
        level2_name: "분변이식",
        level2_name_en: "FMT",
        level3: [
          { level3_id: "MICRO-FMT-GEN", level3_name: "일반FMT", level3_name_en: "General FMT" }
        ]
      },
      {
        level2_id: "MICRO-SYN",
        level2_name: "합성마이크로바이옴",
        level2_name_en: "Synthetic Microbiome",
        level3: [
          { level3_id: "MICRO-SYN-DEF", level3_name: "정의된컨소시엄", level3_name_en: "Defined Consortia" }
        ]
      }
    ]
  },
  {
    level1_id: "ADV",
    level1_name: "기타첨단바이오",
    level1_name_en: "Other Advanced Biologics",
    icon: "✨",
    level2: [
      {
        level2_id: "ADV-EXO",
        level2_name: "엑소좀",
        level2_name_en: "Exosomes",
        level3: [
          { level3_id: "ADV-EXO-NAT", level3_name: "천연엑소좀", level3_name_en: "Native Exosomes" },
          { level3_id: "ADV-EXO-ENG", level3_name: "엔지니어링엑소좀", level3_name_en: "Engineered Exosomes" }
        ]
      },
      {
        level2_id: "ADV-VLP",
        level2_name: "VLP",
        level2_name_en: "Virus-Like Particles",
        level3: [
          { level3_id: "ADV-VLP-VAC", level3_name: "백신용VLP", level3_name_en: "VLP Vaccine" },
          { level3_id: "ADV-VLP-DEL", level3_name: "전달체VLP", level3_name_en: "VLP Delivery" }
        ]
      },
      {
        level2_id: "ADV-ONC",
        level2_name: "온콜리틱바이러스",
        level2_name_en: "Oncolytic Virus",
        level3: [
          { level3_id: "ADV-ONC-HSV", level3_name: "HSV기반", level3_name_en: "HSV-based" },
          { level3_id: "ADV-ONC-ADN", level3_name: "아데노기반", level3_name_en: "Adenovirus-based" },
          { level3_id: "ADV-ONC-VAC", level3_name: "백시니아기반", level3_name_en: "Vaccinia-based" },
          { level3_id: "ADV-ONC-OTH", level3_name: "기타", level3_name_en: "Other" }
        ]
      }
    ]
  }
];

// 헬퍼 함수들
export function getModalityLevel1(id: string) {
  return modalityData.find(m => m.level1_id === id);
}

export function getModalityLevel2(level1Id: string, level2Id: string) {
  const level1 = getModalityLevel1(level1Id);
  return level1?.level2.find(m => m.level2_id === level2Id);
}

export function getModalityLevel3(level1Id: string, level2Id: string, level3Id: string) {
  const level2 = getModalityLevel2(level1Id, level2Id);
  return level2?.level3.find(m => m.level3_id === level3Id);
}

export function getModalityFullName(modality: SelectedModality): string {
  return `${modality.level1_name} > ${modality.level2_name} > ${modality.level3_name}`;
}
