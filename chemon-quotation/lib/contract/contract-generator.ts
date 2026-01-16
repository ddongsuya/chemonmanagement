import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  BorderStyle,
  WidthType,
  Packer,
  HeadingLevel,
  TableLayoutType,
  VerticalAlign,
} from 'docx';
import { ContractData } from './types';
import { formatNumber } from './number-to-korean';

// 테이블 셀 기본 스타일
const defaultBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
};

// 제목 생성
function createTitle(isDraft: boolean): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [
      new TextRun({
        text: `위 탁 연 구 계 약 서${isDraft ? '(안)' : ''}`,
        bold: true,
        size: 36,
      }),
    ],
  });
}

// 부제목
function createSubtitle(): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [
      new TextRun({
        text: '(Contract Sheet)',
        size: 22,
      }),
    ],
  });
}

// 계약 당사자 조항
function createPartiesClause(data: ContractData): Paragraph {
  return new Paragraph({
    spacing: { after: 300 },
    children: [
      new TextRun({ text: data.customer.companyName, bold: true }),
      new TextRun({ text: ' (이하 "갑"이라 한다.)와 ' }),
      new TextRun({ text: '코아스템켐온㈜', bold: true }),
      new TextRun({ text: ' (이하 "을"이라 한다.)과 "갑"의 ' }),
      new TextRun({ text: data.project.name, bold: true }),
      new TextRun({ text: '(이하 "연구"라 한다.) 수행을 위하여 "을"이 "갑"으로부터 관련사항에 대한 연구를 위탁 받아 수행하기로 하고 아래와 같이 합의한다.' }),
    ],
  });
}


// 조항 생성 함수
function createArticle(number: number, title: string, content: (Paragraph | Table)[]): (Paragraph | Table)[] {
  return [
    new Paragraph({
      spacing: { before: 300, after: 200 },
      children: [
        new TextRun({ text: `제 ${number} 조 ${title}`, bold: true }),
      ],
    }),
    ...content,
  ];
}

// 일반 문단 생성
function createParagraph(text: string, indent: boolean = false): Paragraph {
  return new Paragraph({
    spacing: { after: 150 },
    indent: indent ? { left: 400 } : undefined,
    children: [new TextRun({ text })],
  });
}

// 번호 문단 생성
function createNumberedParagraph(number: string, text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 150 },
    children: [
      new TextRun({ text: `${number} ${text}` }),
    ],
  });
}

// 연구 내용 테이블 (제2조)
function createResearchTable(data: ContractData): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            borders: defaultBorders,
            children: [new Paragraph({ children: [new TextRun({ text: '연구과제명', bold: true })] })],
          }),
          new TableCell({
            width: { size: 80, type: WidthType.PERCENTAGE },
            borders: defaultBorders,
            children: [new Paragraph({ children: [new TextRun({ text: data.project.name })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: defaultBorders,
            children: [new Paragraph({ children: [new TextRun({ text: '연 구 비', bold: true })] })],
          }),
          new TableCell({
            borders: defaultBorders,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `금 ${data.payment.advancePayment.amountInKorean}원정 ` }),
                  new TextRun({ text: `(₩ ${formatNumber(data.payment.subtotal)})` }),
                ],
              }),
              new Paragraph({ children: [new TextRun({ text: '부가세 별도', size: 20 })] }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: defaultBorders,
            children: [new Paragraph({ children: [new TextRun({ text: '연구기간', bold: true })] })],
          }),
          new TableCell({
            borders: defaultBorders,
            children: [new Paragraph({ children: [new TextRun({ text: data.period.displayText })] })],
          }),
        ],
      }),
    ],
  });
}

// 지급 조건 테이블 (제4조)
function createPaymentTable(data: ContractData): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      // 헤더
      new TableRow({
        children: [
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            borders: defaultBorders,
            shading: { fill: 'F0F0F0' },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '구분', bold: true })] })],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: defaultBorders,
            shading: { fill: 'F0F0F0' },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '금액', bold: true })] })],
          }),
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            borders: defaultBorders,
            shading: { fill: 'F0F0F0' },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '지불', bold: true })] })],
          }),
        ],
      }),
      // 선금
      new TableRow({
        children: [
          new TableCell({
            borders: defaultBorders,
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '선금' })] })],
          }),
          new TableCell({
            borders: defaultBorders,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `금 ${data.payment.advancePayment.amountInKorean}원정` }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `(₩ ${formatNumber(data.payment.advancePayment.amount)}) 부가세 별도`, size: 20 }),
                ],
              }),
            ],
          }),
          new TableCell({
            borders: defaultBorders,
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ children: [new TextRun({ text: data.payment.advancePayment.dueCondition })] })],
          }),
        ],
      }),
      // 잔금
      new TableRow({
        children: [
          new TableCell({
            borders: defaultBorders,
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '잔금' })] })],
          }),
          new TableCell({
            borders: defaultBorders,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `금 ${data.payment.remainingPayment.amountInKorean}원정` }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `(₩ ${formatNumber(data.payment.remainingPayment.amount)}) 부가세 별도`, size: 20 }),
                ],
              }),
            ],
          }),
          new TableCell({
            borders: defaultBorders,
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ children: [new TextRun({ text: data.payment.remainingPayment.dueCondition })] })],
          }),
        ],
      }),
    ],
  });
}


// 서명란 생성
function createSignatureBlock(data: ContractData): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      // 갑
      new TableRow({
        children: [
          new TableCell({
            borders: defaultBorders,
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [new TextRun({ text: '"갑"', bold: true })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.customer.companyName })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.customer.address, size: 20 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: `대표이사 : ${data.customer.ceoName} (인)` })] }),
            ],
          }),
        ],
      }),
      // 을
      new TableRow({
        children: [
          new TableCell({
            borders: defaultBorders,
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [new TextRun({ text: '"을"', bold: true })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '코아스템켐온㈜ 양지지점' })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '경기도 용인시 처인구 양지면 남평로 240', size: 20 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: '대표이사 : 양 길 안 (인)' })] }),
            ],
          }),
        ],
      }),
    ],
  });
}

// 견적서 별첨 테이블
function createQuotationTable(data: ContractData): Table {
  const headerRow = new TableRow({
    children: [
      new TableCell({ borders: defaultBorders, shading: { fill: 'F0F0F0' }, width: { size: 8, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No', bold: true, size: 20 })] })] }),
      new TableCell({ borders: defaultBorders, shading: { fill: 'F0F0F0' }, width: { size: 40, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '시험명', bold: true, size: 20 })] })] }),
      new TableCell({ borders: defaultBorders, shading: { fill: 'F0F0F0' }, width: { size: 12, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '동물종', bold: true, size: 20 })] })] }),
      new TableCell({ borders: defaultBorders, shading: { fill: 'F0F0F0' }, width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '기간', bold: true, size: 20 })] })] }),
      new TableCell({ borders: defaultBorders, shading: { fill: 'F0F0F0' }, width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '단가', bold: true, size: 20 })] })] }),
      new TableCell({ borders: defaultBorders, shading: { fill: 'F0F0F0' }, width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '금액', bold: true, size: 20 })] })] }),
    ],
  });

  const itemRows = data.quotation.items.map((item) =>
    new TableRow({
      children: [
        new TableCell({ borders: defaultBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(item.no), size: 20 })] })] }),
        new TableCell({ borders: defaultBorders, children: [new Paragraph({ children: [new TextRun({ text: item.testName, size: 20 })] })] }),
        new TableCell({ borders: defaultBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.species || '-', size: 20 })] })] }),
        new TableCell({ borders: defaultBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.duration || '-', size: 20 })] })] }),
        new TableCell({ borders: defaultBorders, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatNumber(item.unitPrice), size: 20 })] })] }),
        new TableCell({ borders: defaultBorders, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatNumber(item.totalPrice), size: 20 })] })] }),
      ],
    })
  );

  // 합계 행
  const totalRow = new TableRow({
    children: [
      new TableCell({ borders: defaultBorders, columnSpan: 5, shading: { fill: 'F0F0F0' }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: '합계 (VAT 별도)', bold: true, size: 20 })] })] }),
      new TableCell({ borders: defaultBorders, shading: { fill: 'F0F0F0' }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatNumber(data.payment.subtotal), bold: true, size: 20 })] })] }),
    ],
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [headerRow, ...itemRows, totalRow],
  });
}


// 모든 조항 생성
function createAllArticles(data: ContractData): (Paragraph | Table)[] {
  const articles: (Paragraph | Table)[] = [];

  // 제1조 연구의 목적
  articles.push(...createArticle(1, '연구의 목적', [
    createParagraph('본 연구는 비임상시험을 "갑"으로부터 용역 받아 동물실험 등을 실시하며, 이를 통하여 "갑"의 연구수행의 결과물을 확보하는 데 있다.'),
  ]));

  // 제2조 연구의 내용 및 범위
  articles.push(...createArticle(2, '연구의 내용 및 범위', [
    createParagraph('"을"은 "갑"이 지원하는 연구비에 의해 연구를 실시하며, "갑"과 "을"의 합의 하에 변경 가능하다. 또한, "갑"에 의하여 실험을 추가하는 경우 추가 비용에 대하여는 "갑"과 "을"의 협의 하에 "갑"은 추가 비용을 지불한다.'),
    createResearchTable(data),
  ]));

  // 제3조 연구 일정
  articles.push(...createArticle(3, '연구 일정', [
    createNumberedParagraph('1)', '본 연구기간 동안의 세부일정은 시험계획서에 명기된 내용으로 하며, "갑"과 "을" 쌍방의 합의에 의하여 조정될 수 있다.'),
    createNumberedParagraph('2)', '시험물질은 협의된 개시 일정의 3주 전까지 입고되어야 하며, 물질 입고 지연 및 의뢰자의 일방적인 시험 취소 등으로 인한 동물실 일정 변경은 계약금액의 5% 수수료(부가세 별도) 비용이 발생된다.'),
  ]));

  // 제4조 연구용역비
  articles.push(...createArticle(4, '연구용역비', [
    createNumberedParagraph('1)', `본 용역을 수행함에 있어서, "갑"은 "을"에게 연구용역비로 금 ${data.payment.advancePayment.amountInKorean}원정 (₩ ${formatNumber(data.payment.subtotal)}) 부가세 별도를 지급한다.`),
    createNumberedParagraph('2)', '연구용역비는 현금으로 지급하며, 지급조건은 아래의 표에 따른다. 지체시 연 12%의 비율로 계산한 금원을 배상한다.'),
    createPaymentTable(data),
    createNumberedParagraph('3)', '"갑"은 "을"에게 부가세를 포함한 연구용역비를 세금계산서 발행일로부터 30일 이내 신한은행 (계좌번호 : 140-007-295200, 예금주 : 코아스템켐온㈜)으로 입금하도록 한다.'),
  ]));

  // 제5조 상호협조
  articles.push(...createArticle(5, '상호협조', [
    createParagraph('"을"은 전 연구과정을 통하여 "갑"의 요청이 있을 때는 수시로 연구내용에 관하여 "갑"과 협의하며, "갑" 또한 필요한 사항을 "을"에게 적극 협조한다.'),
  ]));

  // 제6조 보고서 및 관계자료 제출
  articles.push(...createArticle(6, '보고서 및 관계자료 제출', [
    createNumberedParagraph('1)', '"갑"과 "을"은 연구개시 후 수시로 연구진척에 관한 내용에 관하여 상의할 수 있고, 연구결과에 대하여 "갑"에게 결과보고서를 제출한다.'),
    createNumberedParagraph('2)', '"을"은 "갑"또는 "갑"이 지정하는 자의 연구개발 현장 확인, 관계서류의 열람, 관계자료의 제출요청에 성실히 응하도록 하여야 한다.'),
  ]));

  // 제7조 연구의 완성 및 종료
  articles.push(...createArticle(7, '연구의 완성 및 종료', [
    createParagraph('본 연구는 "을"이 "갑"에게 제출한 결과보고서(안)를 검토하고 연구가 완료된 것을 승낙함으로써 종료되며, "갑"은 필요한 경우 "을"에게 보고서 내용의 보완을 요청할 수 있다.'),
  ]));

  // 제8조 비밀정보
  articles.push(...createArticle(8, '비밀정보', [
    createNumberedParagraph('1)', '"비밀정보"라 함은 "을"이 본 계약과 관련하여 구두, 문서, 컴퓨터 파일, Fax등 "갑"으로부터 제공받거나 인지하게 된 일체의 정보를 말하며, 이를 비롯한 기타 쌍방의 "비밀정보"는 상호간의 서면 동의 없이 양 당사자를 제외한 제 3자에게 반출, 복사, 복제, 유출, 판매, 누설, 발표되어서는 아니 된다. 단 관련 법령이나 공공기관의 결정 및/또는 명령에 의한 경우는 예외로 한다.'),
    createNumberedParagraph('2)', '"을"은 "갑"으로부터 제공받은 비밀정보의 제 3자에게로의 공개와 전달을 방지하기 위하여 "을"은 내부적으로 동일 수준의 비밀정보를 보호하는 것과 같이 최대한 보호하여야 할 의무와 책임이 있다.'),
    createNumberedParagraph('3)', '본 조의 비밀준수의무는 본 계약의 계약기간 종료에도 불구하고 본 계약이 종료된 날로부터 10년간 그 효력이 지속되는 것으로 한다.'),
  ]));

  // 제9조 연구결과의 귀속
  articles.push(...createArticle(9, '연구결과의 귀속', [
    createNumberedParagraph('1)', '"을"은 본 연구의 연구결과, Know-How 및 본 연구결과로 기대되는 특허권 및 지적재산권, 유형적 발생품, 시작품, 보고서의 판권 등은 "갑"의 소유임을 인정하고 "갑"으로 하여금 당해 권리를 승계할 수 있도록 협조한다. 또한 "을"은 연구결과에 대해 "갑"의 명의로 특허 등 지적 재산권을 확보하는 조치를 취하기 위하여 최대한 노력하여야 한다.'),
    createNumberedParagraph('2)', '"을"은 "갑"에게 승계하거나, "갑"이 취득한 본 연구의 연구결과를 직접 실시하거나 제3자에게 이에 대한 실시권을 설정할 수 없다.'),
    createNumberedParagraph('3)', '"을"은 연구 결과물이 제3자의 지식재산권을 침해하지 않는다는 것을 보증하지 않으며 제3자의 지식재산권을 침해할 경우 손해배상 등의 책임을 지지 않는다.'),
  ]));

  // 제10조 보관
  articles.push(...createArticle(10, '보 관', [
    createNumberedParagraph('1)', '최종보고서 제출일로부터 5년간 연구에 관련된 "결과보고서, Raw data 및 검체"(이하 "연구자료"라 한다.)는 "을"의 "자료보관실"에서 보관하며, "갑"의 요청이나 시험계획서에 따른 변경이 필요한 경우에 그 이후의 보관에 대하여는 "갑"과 협의한다. "갑"은 보관기간의 연장 여부를 결정하여야 하고, 보관기간이 연장이 되는 경우에는 "을"에게 보관료를 지불한다.'),
    createNumberedParagraph('2)', '"갑"은 보관기간의 연장 여부에 대해서 회신을 해야하며, 문의 후 2개월 이내에 회신이 없는 경우, "을"은 해당 연구자료를 폐기할 수 있다.'),
  ]));

  // 제11조 계약의 변경
  articles.push(...createArticle(11, '계약의 변경', [
    createParagraph('"갑" 또는 "을"의 요청이 있거나 필요한 경우에는 서면 합의에 의하여 본 계약서의 내용을 변경할 수 있다.'),
  ]));

  // 제12조 계약의 해지
  articles.push(...createArticle(12, '계약의 해지', [
    createNumberedParagraph('1)', '"갑"은 "을"이 본 연구를 수행할 능력이 없다고 명백하고 객관적으로 인정될 경우에는 즉시 "을"에게 이를 통보하고 협의한 후 계약을 해지 할 수 있다.'),
    createNumberedParagraph('2)', '"갑"은 "을"이 본 계약을 위배하여 아래의 내용 등과 같이 원활한 연구수행이 극히 곤란하다고 명백하고 객관적으로 인정될 경우에는 즉시 "을"에게 이의 개선을 통고하고 통고 후 14일 이내에 시정되지 않으면 본 계약을 해지할 수 있다.'),
    createParagraph('(가) 기술개발 수행이 정지상태가 되어 소기의 기술개발성과를 기대하기 곤란하거나 완수할 능력이 없다고 인정되는 경우', true),
    createParagraph('(나) 기타 중대한 사유로 인하여 본 기술개발사업의 계속 수행이 불가능하거나 불필요하다고 인정되는 경우', true),
    createNumberedParagraph('3)', '"을"은 "갑"이 본 계약을 위배하여 아래의 내용 등과 같이 원활한 연구수행에 곤란함을 초래한다고 인정될 경우에는 즉시 "갑"에게 이의 개선을 통고하고 통고 후 1주일 이내에 시정되지 않으면 본 계약을 해지할 수 있다.'),
    createParagraph('(가) 정당한 사유 없이 연구 용역비의 지출이 2주 이상 지연될 때', true),
    createParagraph('(나) 기타 중대한 사유로 인하여 본 기술개발사업의 계속 수행이 불가능하거나 불필요하다고 인정되는 경우', true),
    createNumberedParagraph('4)', '위 1), 2) 및 3)항에 의하여 계약이 해지될 경우 "을"은 해지일로부터 1개월 이내에 해지 시까지의 결과보고서를 "갑"에게 제출하여야 하며, "을"은 제 4조에 의하여 수령한 연구 용역비 중 본 연구수행에 소요된 비용("갑"의 귀책사유로 인하여 계약이 해지될 경우 "을"에게 발생한 손해액 포함)을 제외하고 나머지 잔액 또는 추가 비용을 "갑"에게 반환 또는 요청할 수 있다.'),
  ]));

  // 제13조 계약의 효력발생
  articles.push(...createArticle(13, '계약의 효력발생', [
    createParagraph('본 계약은 당사자가 서명 날인한 날로부터 유효하다. "을"은 "갑"의 서면동의 없이 본 계약에 의하여 취득하는 제반 권리를 제 3자에게 제공하거나 양도할 수 없다.'),
  ]));

  // 제14조 지체상금
  articles.push(...createArticle(14, '지체상금', [
    createParagraph('"을"이 제2조에 명시되어 있는 연구기간을 초과하여 연구의 완성 또는 종료의 지체가 20일 이상 계속되는 경우, "을"은 "갑"에게 납득할 만한 정당한 사유와 근거를 제시하여야 하며, 이의 입증과 제시가 불가할 경우에 "을"은 "갑"에게 지체일수에 대한 지체상금을 현금으로 지급하되 지체 상금률은 1일 지체당 총 연구개발비의 1/1000을 지급한다. 단 "갑"의 귀책사유 또는 불가항력적인 사유로 인해 "을"이 제2조의 연구기간을 준수하지 못한 경우에는 예외로 한다.'),
  ]));

  // 제15조 손해배상
  articles.push(...createArticle(15, '손해배상', [
    createParagraph('본 계약의 일방 당사자가 본 계약을 위반하거나, 기타 고의 또는 과실로 인하여 상대방에게 손해가 발생하는 경우 귀책당사자는 상대방의 손해를 배상하여야 한다.'),
  ]));

  // 제16조 분쟁해결 및 관할법원
  articles.push(...createArticle(16, '분쟁해결 및 관할법원', [
    createNumberedParagraph('1)', '본 계약서에 명시되지 아니한 사항이나 해석상 불분명한 사항에 대해서는 관련법규, 관계 법령 및 일반적 상관례에 따라 상호 호혜적 입장에서 당사자간에 협의하여 결정한다.'),
    createNumberedParagraph('2)', '당사자간 우호적으로 분쟁이 해결되지 않을 경우 대한민국의 법률을 적용하여 서울중앙지방법원을 관할 법원으로 한다.'),
  ]));

  return articles;
}


// 메인 계약서 생성 함수
export async function generateContract(data: ContractData): Promise<Blob> {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,    // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children: [
        // 제목
        createTitle(data.contract.isDraft),
        createSubtitle(),
        
        // 계약 당사자 문구
        createPartiesClause(data),
        
        // 제1조 ~ 제16조
        ...createAllArticles(data),
        
        // 증명 문구
        new Paragraph({
          spacing: { before: 400, after: 200 },
          children: [
            new TextRun({ text: '위 사항을 증명하기 위하여 각 당사자는 서명, 날인하여 각각 1부씩 보관한다.' }),
          ],
        }),
        
        // 별첨 안내
        new Paragraph({
          spacing: { before: 200, after: 400 },
          children: [
            new TextRun({ text: '# 별첨 1. 견적서', bold: true }),
          ],
        }),
        
        // 계약일
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 400 },
          children: [
            new TextRun({ text: data.contract.date, bold: true, size: 28 }),
          ],
        }),
        
        // 서명란
        createSignatureBlock(data),
        
        // 페이지 나누기 효과 (빈 문단들)
        new Paragraph({ spacing: { before: 600 }, children: [] }),
        
        // 별첨 견적서 제목
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 400 },
          children: [
            new TextRun({ text: '# 별첨 1. 견적서', bold: true, size: 28 }),
          ],
        }),
        
        // 견적번호
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: `견적번호: ${data.quotation.quotationNo}` }),
          ],
        }),
        
        // 견적서 테이블
        createQuotationTable(data),
      ],
    }],
  });
  
  return await Packer.toBlob(doc);
}

// 계약서 데이터 생성 헬퍼 함수
export function createContractDataFromQuotation(
  quotationData: {
    quotationNo: string;
    items: { testName: string; species?: string; duration?: string; unitPrice: number; quantity: number; totalPrice: number }[];
    subtotal: number;
  },
  formData: {
    customerName: string;
    customerAddress: string;
    customerCeo: string;
    projectName: string;
    startDate: string;
    endDate: string;
    advanceRate: number;
    contractDate: string;
    isDraft: boolean;
  }
): ContractData {
  const { numberToKorean, formatDateKorean, calculateWeeks } = require('./number-to-korean');
  
  const subtotal = quotationData.subtotal;
  const advanceAmount = Math.floor(subtotal * (formData.advanceRate / 100));
  const remainingAmount = subtotal - advanceAmount;
  const totalWeeks = calculateWeeks(formData.startDate, formData.endDate);
  
  return {
    customer: {
      companyName: formData.customerName,
      address: formData.customerAddress,
      ceoName: formData.customerCeo,
    },
    project: {
      name: formData.projectName,
    },
    payment: {
      subtotal,
      vatRate: 10,
      vatAmount: Math.floor(subtotal * 0.1),
      totalAmount: Math.floor(subtotal * 1.1),
      advancePayment: {
        rate: formData.advanceRate,
        amount: advanceAmount,
        amountInKorean: numberToKorean(advanceAmount),
        dueCondition: '계약일로부터 30일 이내',
      },
      remainingPayment: {
        rate: 100 - formData.advanceRate,
        amount: remainingAmount,
        amountInKorean: numberToKorean(remainingAmount),
        dueCondition: '최종결과보고서(안) 제출 후 30일 이내',
      },
    },
    period: {
      startDate: formatDateKorean(formData.startDate),
      endDate: formatDateKorean(formData.endDate),
      totalWeeks,
      displayText: `${formatDateKorean(formData.startDate)} ~ ${formatDateKorean(formData.endDate)} (약 ${totalWeeks}주)`,
    },
    contract: {
      date: formatDateKorean(formData.contractDate),
      isDraft: formData.isDraft,
    },
    quotation: {
      quotationNo: quotationData.quotationNo,
      items: quotationData.items.map((item, index) => ({
        no: index + 1,
        testName: item.testName,
        species: item.species,
        duration: item.duration,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
      })),
    },
  };
}
