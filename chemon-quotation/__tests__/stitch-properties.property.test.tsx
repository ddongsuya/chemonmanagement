/**
 * Property-Based Tests for Stitch Shared Components
 *
 * **Feature: stitch-design-system**
 *
 * Property 1: No-Line Rule 준수
 * **Validates: Requirements 2.1, 9.4**
 *
 * Property 2: Surface Hierarchy 배경색 일관성
 * **Validates: Requirements 1.2, 3.5**
 *
 * Property 3: Badge Pill 스타일 일관성
 * **Validates: Requirements 1.4, 5.1, 5.2, 5.3**
 */

import * as fc from 'fast-check';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import React from 'react';

import { StitchCard, SURFACE_COLORS } from '@/components/ui/StitchCard';
import { StitchBadge, STATUS_BADGE_MAP } from '@/components/ui/StitchBadge';
import {
  StitchTable,
  StitchTableHeader,
  StitchTableBody,
  StitchTableRow,
  StitchTableHead,
  StitchTableCell,
} from '@/components/ui/StitchTable';

// ─── Arbitraries ───

type SurfaceVariant = keyof typeof SURFACE_COLORS;
const surfaceVariantArb = fc.constantFrom(
  ...Object.keys(SURFACE_COLORS) as SurfaceVariant[]
);

const statusKeyArb = fc.constantFrom(
  ...Object.keys(STATUS_BADGE_MAP)
);

const paddingArb = fc.constantFrom('sm', 'md', 'lg') as fc.Arbitrary<'sm' | 'md' | 'lg'>;
const hoverArb = fc.boolean();

// Layout border classes that violate the No-Line Rule
const FORBIDDEN_BORDER_CLASSES = [
  'border-border',
  'border-b',
  'border-t',
  'border-l',
  'border-r',
];

// ─── Property 1: No-Line Rule 준수 ───

describe('Property 1: No-Line Rule 준수', () => {
  /**
   * **Validates: Requirements 2.1, 9.4**
   *
   * For any StitchCard variant/hover/padding combination,
   * the rendered className must NOT contain layout border classes.
   */
  it('StitchCard never contains layout border classes for any variant/hover/padding', () => {
    fc.assert(
      fc.property(
        surfaceVariantArb,
        hoverArb,
        paddingArb,
        (variant, hover, padding) => {
          const { container } = render(
            <StitchCard variant={variant} hover={hover} padding={padding}>
              content
            </StitchCard>
          );
          const el = container.firstChild as HTMLElement;

          FORBIDDEN_BORDER_CLASSES.forEach((cls) => {
            expect(el.className).not.toContain(cls);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 2.1, 9.4**
   *
   * For StitchTable rendered output, the outer container
   * must NOT contain layout border classes.
   */
  it('StitchTable outer container never contains layout border classes', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // no variant needed, just run multiple times
        () => {
          const { container } = render(
            <StitchTable>
              <StitchTableHeader>
                <StitchTableRow>
                  <StitchTableHead>Header</StitchTableHead>
                </StitchTableRow>
              </StitchTableHeader>
              <StitchTableBody>
                <StitchTableRow>
                  <StitchTableCell>Cell</StitchTableCell>
                </StitchTableRow>
              </StitchTableBody>
            </StitchTable>
          );
          const outer = container.firstChild as HTMLElement;

          FORBIDDEN_BORDER_CLASSES.forEach((cls) => {
            expect(outer.className).not.toContain(cls);
          });
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ─── Property 2: Surface Hierarchy 배경색 일관성 ───

describe('Property 2: Surface Hierarchy 배경색 일관성', () => {
  // The valid background hex values from Surface_Hierarchy + bg-white for elevated
  const VALID_BG_PATTERNS = [
    '#FFF8F1',
    '#FAF2E9',
    '#F5EDE3',
    '#EFE7DD',
    '#E9E1D8',
    'bg-white',
  ];

  /**
   * **Validates: Requirements 1.2, 3.5**
   *
   * For any StitchCard variant, the rendered background class
   * must correspond to one of the 5 Surface colors or bg-white for elevated.
   */
  it('StitchCard background always matches a Surface Hierarchy color or bg-white', () => {
    fc.assert(
      fc.property(
        surfaceVariantArb,
        (variant) => {
          const { container } = render(
            <StitchCard variant={variant}>content</StitchCard>
          );
          const el = container.firstChild as HTMLElement;
          const className = el.className;

          // At least one valid bg pattern must be present
          const hasValidBg = VALID_BG_PATTERNS.some((pattern) =>
            className.includes(pattern)
          );
          expect(hasValidBg).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 1.2, 3.5**
   *
   * The SURFACE_COLORS mapping must be exhaustive — every variant key
   * maps to a class containing one of the defined hex values or bg-white.
   */
  it('every SURFACE_COLORS entry maps to a valid Surface Hierarchy value', () => {
    fc.assert(
      fc.property(
        surfaceVariantArb,
        (variant) => {
          const bgClass = SURFACE_COLORS[variant];
          const matchesSurface = VALID_BG_PATTERNS.some((hex) =>
            bgClass.includes(hex)
          );
          expect(matchesSurface).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 3: Badge Pill 스타일 일관성 ───

describe('Property 3: Badge Pill 스타일 일관성', () => {
  const REQUIRED_PILL_CLASSES = [
    'rounded-full',
    'uppercase',
    'tracking-wider',
    'font-bold',
    'text-xs',
  ];

  /**
   * **Validates: Requirements 1.4, 5.1, 5.2, 5.3**
   *
   * For any status from STATUS_BADGE_MAP, the rendered StitchBadge
   * className must include all Pill_Badge style classes.
   */
  it('StitchBadge always includes pill style classes for any STATUS_BADGE_MAP status', () => {
    fc.assert(
      fc.property(
        statusKeyArb,
        (status) => {
          const { container } = render(
            <StitchBadge status={status}>{status}</StitchBadge>
          );
          const el = container.firstChild as HTMLElement;

          REQUIRED_PILL_CLASSES.forEach((cls) => {
            expect(el.className).toContain(cls);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 1.4, 5.1, 5.2, 5.3**
   *
   * For any status from STATUS_BADGE_MAP, the rendered StitchBadge
   * must apply the correct bg and text color classes from the map.
   */
  it('StitchBadge applies correct STATUS_BADGE_MAP colors for any status', () => {
    fc.assert(
      fc.property(
        statusKeyArb,
        (status) => {
          const { container } = render(
            <StitchBadge status={status}>{status}</StitchBadge>
          );
          const el = container.firstChild as HTMLElement;
          const { bg, text } = STATUS_BADGE_MAP[status];

          // The bg class value (e.g. "bg-emerald-50") should appear in className
          expect(el.className).toContain(bg);
          // The text class value (e.g. "text-emerald-600") should appear in className
          expect(el.className).toContain(text);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ─── Additional Imports for Properties 4–6 ───

import { StitchInput } from '@/components/ui/StitchInput';
import { StitchPageHeader } from '@/components/ui/StitchPageHeader';

// ─── Property 4: Input Border-None 일관성 ───

describe('Property 4: Input Border-None 일관성', () => {
  /**
   * **Validates: Requirements 1.5, 6.1, 6.4**
   *
   * For any StitchInput rendered with random label/hasError combinations,
   * the input element className must include border-none and rounded-xl.
   */

  const labelArb = fc.constantFrom('고객사', 'EMAIL', '전화번호', 'Name', '주소', undefined);
  const hasErrorArb = fc.boolean();

  it('StitchInput always includes border-none and rounded-xl', () => {
    fc.assert(
      fc.property(
        labelArb,
        hasErrorArb,
        (label, hasError) => {
          const { container } = render(
            <StitchInput label={label} hasError={hasError} placeholder="test" />
          );
          const input = container.querySelector('input') as HTMLElement;

          expect(input.className).toContain('border-none');
          expect(input.className).toContain('rounded-xl');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('StitchInput never contains legacy border classes', () => {
    fc.assert(
      fc.property(
        labelArb,
        hasErrorArb,
        (label, hasError) => {
          const { container } = render(
            <StitchInput label={label} hasError={hasError} placeholder="test" />
          );
          const input = container.querySelector('input') as HTMLElement;

          // Must not contain old-style border classes
          expect(input.className).not.toContain('border-border');
          expect(input.className).not.toContain('border-input');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 5: Editorial Typography 일관성 ───

describe('Property 5: Editorial Typography 일관성', () => {
  /**
   * **Validates: Requirements 4.1, 4.2**
   *
   * For metadata labels, verify className includes text-[10px] or text-[11px],
   * uppercase, tracking-widest.
   * For page titles (StitchPageHeader), verify font-extrabold or font-black
   * and tracking-tight.
   */

  const labelTextArb = fc.constantFrom(
    'QUOTATIONS', 'CUSTOMERS', 'LEADS', 'PIPELINE', 'CONTRACTS', 'STUDIES'
  );
  const titleTextArb = fc.constantFrom(
    '견적 관리', '고객사 목록', '리드 관리', '파이프라인', '계약 관리', '스터디'
  );
  const largeArb = fc.boolean();

  it('StitchPageHeader label always has editorial metadata typography', () => {
    fc.assert(
      fc.property(
        labelTextArb,
        titleTextArb,
        (label, title) => {
          const { container } = render(
            <StitchPageHeader label={label} title={title} />
          );
          const labelEl = container.querySelector('p') as HTMLElement;

          // Metadata label must have text-[10px] or text-[11px]
          const hasSmallText =
            labelEl.className.includes('text-[10px]') ||
            labelEl.className.includes('text-[11px]');
          expect(hasSmallText).toBe(true);

          expect(labelEl.className).toContain('uppercase');
          expect(labelEl.className).toContain('tracking-widest');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('StitchPageHeader title always has font-extrabold or font-black and tracking-tight', () => {
    fc.assert(
      fc.property(
        titleTextArb,
        largeArb,
        (title, large) => {
          const { container } = render(
            <StitchPageHeader title={title} large={large} />
          );
          const h1 = container.querySelector('h1') as HTMLElement;

          const hasBoldWeight =
            h1.className.includes('font-extrabold') ||
            h1.className.includes('font-black');
          expect(hasBoldWeight).toBe(true);

          expect(h1.className).toContain('tracking-tight');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('StitchInput label has editorial metadata typography when label is provided', () => {
    const inputLabelArb = fc.constantFrom(
      '고객사', '이메일', '전화번호', '담당자', '주소'
    );

    fc.assert(
      fc.property(
        inputLabelArb,
        (label) => {
          const { container } = render(
            <StitchInput label={label} placeholder="test" />
          );
          const labelEl = container.querySelector('label') as HTMLElement;

          // StitchInput label uses text-[11px]
          expect(labelEl.className).toContain('text-[11px]');
          expect(labelEl.className).toContain('uppercase');
          expect(labelEl.className).toContain('tracking-widest');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('StitchTable header cells have editorial metadata typography', () => {
    const headerTextArb = fc.constantFrom(
      '견적번호', '상태', '고객사', '금액', '날짜', '담당자'
    );

    fc.assert(
      fc.property(
        headerTextArb,
        (headerText) => {
          const { container } = render(
            <StitchTable>
              <StitchTableHeader>
                <StitchTableRow>
                  <StitchTableHead>{headerText}</StitchTableHead>
                </StitchTableRow>
              </StitchTableHeader>
              <StitchTableBody>
                <StitchTableRow>
                  <StitchTableCell>data</StitchTableCell>
                </StitchTableRow>
              </StitchTableBody>
            </StitchTable>
          );
          const th = container.querySelector('th') as HTMLElement;

          // Table header uses text-[11px]
          const hasSmallText =
            th.className.includes('text-[10px]') ||
            th.className.includes('text-[11px]');
          expect(hasSmallText).toBe(true);

          expect(th.className).toContain('uppercase');
          expect(th.className).toContain('tracking-widest');
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ─── Property 6: 순수 검정 텍스트 금지 ───

describe('Property 6: 순수 검정 텍스트 금지', () => {
  /**
   * **Validates: Requirement 4.4**
   *
   * For converted components, verify text-black and #000000 are NOT used.
   * Components should use on-surface (#1E1B15) or slate-based colors instead.
   */

  const FORBIDDEN_BLACK = ['text-black', '#000000'];

  function collectAllClassNames(el: Element): string {
    let classes = el.className || '';
    for (let i = 0; i < el.children.length; i++) {
      classes += ' ' + collectAllClassNames(el.children[i]);
    }
    return classes;
  }

  it('StitchCard never uses pure black text for any variant', () => {
    fc.assert(
      fc.property(
        surfaceVariantArb,
        paddingArb,
        (variant, padding) => {
          const { container } = render(
            <StitchCard variant={variant} padding={padding}>
              <span>Content</span>
            </StitchCard>
          );
          const allClasses = collectAllClassNames(container);

          FORBIDDEN_BLACK.forEach((cls) => {
            expect(allClasses).not.toContain(cls);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('StitchBadge never uses pure black text for any status', () => {
    fc.assert(
      fc.property(
        statusKeyArb,
        (status) => {
          const { container } = render(
            <StitchBadge status={status}>{status}</StitchBadge>
          );
          const allClasses = collectAllClassNames(container);

          FORBIDDEN_BLACK.forEach((cls) => {
            expect(allClasses).not.toContain(cls);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('StitchInput never uses pure black text', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('Label A', 'Label B', undefined),
        fc.boolean(),
        (label, hasError) => {
          const { container } = render(
            <StitchInput label={label} hasError={hasError} placeholder="test" />
          );
          const allClasses = collectAllClassNames(container);

          FORBIDDEN_BLACK.forEach((cls) => {
            expect(allClasses).not.toContain(cls);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('StitchPageHeader never uses pure black text', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('QUOTATIONS', 'CUSTOMERS', 'LEADS'),
        fc.constantFrom('견적 관리', '고객사 목록', '리드 관리'),
        fc.boolean(),
        (label, title, large) => {
          const { container } = render(
            <StitchPageHeader label={label} title={title} large={large} />
          );
          const allClasses = collectAllClassNames(container);

          FORBIDDEN_BLACK.forEach((cls) => {
            expect(allClasses).not.toContain(cls);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('StitchTable never uses pure black text', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('Header A', 'Header B'),
        fc.constantFrom('Cell 1', 'Cell 2'),
        (header, cell) => {
          const { container } = render(
            <StitchTable>
              <StitchTableHeader>
                <StitchTableRow>
                  <StitchTableHead>{header}</StitchTableHead>
                </StitchTableRow>
              </StitchTableHeader>
              <StitchTableBody>
                <StitchTableRow>
                  <StitchTableCell>{cell}</StitchTableCell>
                </StitchTableRow>
              </StitchTableBody>
            </StitchTable>
          );
          const allClasses = collectAllClassNames(container);

          FORBIDDEN_BLACK.forEach((cls) => {
            expect(allClasses).not.toContain(cls);
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});
