/**
 * Unit Tests for Stitch Shared Components
 *
 * **Feature: stitch-design-system**
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8**
 *
 * Tests verify:
 * 1. StitchCard renders correct Surface_Hierarchy backgrounds, hover, padding, No-Line Rule
 * 2. StitchBadge renders Pill_Badge style with STATUS_BADGE_MAP and variant colors
 * 3. StitchPageHeader renders Editorial_Typography label, title, description, actions
 * 4. StitchTable renders tonal layering, editorial headers, hover rows, No-Line Rule
 * 5. StitchInput renders border-none, rounded-xl, focus ring, error state, optional label
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { StitchCard, SURFACE_COLORS } from '@/components/ui/StitchCard';
import { StitchBadge, STATUS_BADGE_MAP, VARIANT_COLORS } from '@/components/ui/StitchBadge';
import { StitchPageHeader } from '@/components/ui/StitchPageHeader';
import {
  StitchTable,
  StitchTableHeader,
  StitchTableBody,
  StitchTableRow,
  StitchTableHead,
  StitchTableCell,
} from '@/components/ui/StitchTable';
import { StitchInput } from '@/components/ui/StitchInput';

// ─── StitchCard ───

describe('StitchCard', () => {
  it('renders children', () => {
    render(<StitchCard>Hello</StitchCard>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it.each(Object.keys(SURFACE_COLORS) as (keyof typeof SURFACE_COLORS)[])(
    'applies correct bg class for variant="%s"',
    (variant) => {
      const { container } = render(<StitchCard variant={variant}>card</StitchCard>);
      const el = container.firstChild as HTMLElement;
      const expectedClass = SURFACE_COLORS[variant].replace('bg-', '');
      expect(el.className).toContain(expectedClass);
    }
  );

  it('defaults to surface-low variant', () => {
    const { container } = render(<StitchCard>card</StitchCard>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('FAF2E9');
  });

  it('applies rounded-2xl and shadow-ambient for elevated variant', () => {
    const { container } = render(<StitchCard variant="elevated">card</StitchCard>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('rounded-2xl');
    expect(el.className).toContain('shadow-ambient');
  });

  it('applies rounded-xl for non-elevated variants', () => {
    const { container } = render(<StitchCard variant="surface">card</StitchCard>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('rounded-xl');
    expect(el.className).not.toContain('rounded-2xl');
  });

  it('applies hover classes when hover=true', () => {
    const { container } = render(<StitchCard hover>card</StitchCard>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('hover:translate-y-[-2px]');
    expect(el.className).toContain('hover:shadow-ambient');
  });

  it('does not apply hover classes when hover=false', () => {
    const { container } = render(<StitchCard>card</StitchCard>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).not.toContain('hover:translate-y-[-2px]');
  });

  it.each([
    ['sm', 'p-4'],
    ['md', 'p-6'],
    ['lg', 'p-8'],
  ] as const)('applies padding=%s → %s', (padding, expected) => {
    const { container } = render(<StitchCard padding={padding}>card</StitchCard>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain(expected);
  });

  it('does NOT contain border classes (No-Line Rule)', () => {
    const { container } = render(<StitchCard>card</StitchCard>);
    const el = container.firstChild as HTMLElement;
    const borderPatterns = ['border-border', 'border-b', 'border-t', 'border-l', 'border-r'];
    borderPatterns.forEach((bp) => {
      expect(el.className).not.toContain(bp);
    });
  });

  it('merges custom className via cn()', () => {
    const { container } = render(<StitchCard className="my-custom">card</StitchCard>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('my-custom');
  });

  it('forwards ref', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<StitchCard ref={ref}>card</StitchCard>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ─── StitchBadge ───

describe('StitchBadge', () => {
  it('renders children', () => {
    render(<StitchBadge>Draft</StitchBadge>);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('applies Pill_Badge base classes', () => {
    const { container } = render(<StitchBadge>test</StitchBadge>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('rounded-full');
    expect(el.className).toContain('uppercase');
    expect(el.className).toContain('tracking-wider');
    expect(el.className).toContain('font-bold');
    expect(el.className).toContain('text-xs');
  });

  it.each(Object.keys(STATUS_BADGE_MAP))(
    'applies correct colors for status="%s"',
    (status) => {
      const { container } = render(<StitchBadge status={status}>{status}</StitchBadge>);
      const el = container.firstChild as HTMLElement;
      const { bg, text } = STATUS_BADGE_MAP[status];
      // Check bg and text classes are present (strip prefix for partial match)
      expect(el.className).toContain(bg.replace('bg-', ''));
      expect(el.className).toContain(text.replace('text-', ''));
    }
  );

  it.each(Object.keys(VARIANT_COLORS) as (keyof typeof VARIANT_COLORS)[])(
    'applies correct colors for variant="%s"',
    (variant) => {
      const { container } = render(<StitchBadge variant={variant}>{variant}</StitchBadge>);
      const el = container.firstChild as HTMLElement;
      const { bg, text } = VARIANT_COLORS[variant];
      expect(el.className).toContain(bg.replace('bg-', ''));
      expect(el.className).toContain(text.replace('text-', ''));
    }
  );

  it('status prop takes priority over variant', () => {
    const { container } = render(
      <StitchBadge status="ACCEPTED" variant="error">Accepted</StitchBadge>
    );
    const el = container.firstChild as HTMLElement;
    // Should use ACCEPTED colors (emerald), not error colors (red)
    expect(el.className).toContain('emerald');
  });

  it('defaults to neutral when no variant or status', () => {
    const { container } = render(<StitchBadge>test</StitchBadge>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('slate');
  });

  it('merges custom className', () => {
    const { container } = render(<StitchBadge className="extra">test</StitchBadge>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('extra');
  });
});

// ─── StitchPageHeader ───

describe('StitchPageHeader', () => {
  it('renders title', () => {
    render(<StitchPageHeader title="견적 목록" />);
    expect(screen.getByText('견적 목록')).toBeInTheDocument();
  });

  it('renders label with Editorial_Typography classes', () => {
    render(<StitchPageHeader title="Title" label="QUOTATIONS" />);
    const label = screen.getByText('QUOTATIONS');
    expect(label.className).toContain('text-[10px]');
    expect(label.className).toContain('font-bold');
    expect(label.className).toContain('uppercase');
    expect(label.className).toContain('tracking-widest');
    expect(label.className).toContain('text-slate-500');
  });

  it('renders title with font-extrabold tracking-tight by default', () => {
    render(<StitchPageHeader title="Title" />);
    const title = screen.getByText('Title');
    expect(title.className).toContain('font-extrabold');
    expect(title.className).toContain('tracking-tight');
  });

  it('renders large title with font-black and text-[2.75rem]', () => {
    render(<StitchPageHeader title="Big Title" large />);
    const title = screen.getByText('Big Title');
    expect(title.className).toContain('font-black');
    expect(title.className).toContain('text-[2.75rem]');
  });

  it('renders description', () => {
    render(<StitchPageHeader title="T" description="Some description" />);
    const desc = screen.getByText('Some description');
    expect(desc.className).toContain('text-sm');
    expect(desc.className).toContain('text-slate-500');
  });

  it('does not render description when not provided', () => {
    const { container } = render(<StitchPageHeader title="T" />);
    const paragraphs = container.querySelectorAll('p.text-sm');
    expect(paragraphs.length).toBe(0);
  });

  it('renders actions slot', () => {
    render(
      <StitchPageHeader
        title="T"
        actions={<button>New</button>}
      />
    );
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('does not render label element when label is not provided', () => {
    const { container } = render(<StitchPageHeader title="T" />);
    const labels = container.querySelectorAll('.tracking-widest');
    expect(labels.length).toBe(0);
  });
});


// ─── StitchTable ───

describe('StitchTable', () => {
  const renderTable = () =>
    render(
      <StitchTable>
        <StitchTableHeader>
          <StitchTableRow>
            <StitchTableHead>번호</StitchTableHead>
            <StitchTableHead>상태</StitchTableHead>
          </StitchTableRow>
        </StitchTableHeader>
        <StitchTableBody>
          <StitchTableRow>
            <StitchTableCell>Q-001</StitchTableCell>
            <StitchTableCell>수주</StitchTableCell>
          </StitchTableRow>
        </StitchTableBody>
      </StitchTable>
    );

  it('renders outer container with bg-[#FAF2E9] and responsive rounded', () => {
    const { container } = renderTable();
    const outer = container.firstChild as HTMLElement;
    expect(outer.className).toContain('FAF2E9');
    expect(outer.className).toContain('rounded-xl');
    expect(outer.className).toContain('md:rounded-[2.5rem]');
  });

  it('renders responsive padding (p-4 md:p-8)', () => {
    const { container } = renderTable();
    const outer = container.firstChild as HTMLElement;
    expect(outer.className).toContain('p-4');
    expect(outer.className).toContain('md:p-8');
  });

  it('renders a <table> inside the container', () => {
    const { container } = renderTable();
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
    expect(table?.className).toContain('w-full');
  });

  it('renders header cells with editorial typography', () => {
    renderTable();
    const th = screen.getByText('번호');
    expect(th.tagName).toBe('TH');
    expect(th.className).toContain('text-[11px]');
    expect(th.className).toContain('font-bold');
    expect(th.className).toContain('uppercase');
    expect(th.className).toContain('tracking-widest');
    expect(th.className).toContain('text-slate-400');
  });

  it('renders tbody with divide-y divide-slate-100 (tonal layering)', () => {
    const { container } = renderTable();
    const tbody = container.querySelector('tbody');
    expect(tbody?.className).toContain('divide-y');
    expect(tbody?.className).toContain('divide-slate-100');
  });

  it('renders rows with hover:bg-[#FFF8F1] transition-colors', () => {
    const { container } = renderTable();
    const rows = container.querySelectorAll('tr');
    // Both header and body rows should have hover
    rows.forEach((row) => {
      expect(row.className).toContain('hover:bg-[#FFF8F1]');
      expect(row.className).toContain('transition-colors');
    });
  });

  it('does NOT contain border classes on outer container (No-Line Rule)', () => {
    const { container } = renderTable();
    const outer = container.firstChild as HTMLElement;
    const forbidden = ['border-border', 'border-b', 'border-t', 'border-l', 'border-r'];
    forbidden.forEach((cls) => {
      expect(outer.className).not.toContain(cls);
    });
  });

  it('renders cell content', () => {
    renderTable();
    expect(screen.getByText('Q-001')).toBeInTheDocument();
    expect(screen.getByText('수주')).toBeInTheDocument();
  });

  it('forwards ref on outer container', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <StitchTable ref={ref}>
        <StitchTableBody>
          <StitchTableRow>
            <StitchTableCell>cell</StitchTableCell>
          </StitchTableRow>
        </StitchTableBody>
      </StitchTable>
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges custom className on outer container', () => {
    const { container } = render(
      <StitchTable className="my-table">
        <StitchTableBody>
          <StitchTableRow>
            <StitchTableCell>cell</StitchTableCell>
          </StitchTableRow>
        </StitchTableBody>
      </StitchTable>
    );
    const outer = container.firstChild as HTMLElement;
    expect(outer.className).toContain('my-table');
  });
});

// ─── StitchInput ───

describe('StitchInput', () => {
  it('renders an input element', () => {
    render(<StitchInput placeholder="입력" />);
    expect(screen.getByPlaceholderText('입력')).toBeInTheDocument();
  });

  it('applies border-none and rounded-xl', () => {
    const { container } = render(<StitchInput />);
    const input = container.querySelector('input') as HTMLElement;
    expect(input.className).toContain('border-none');
    expect(input.className).toContain('rounded-xl');
  });

  it('applies bg-white', () => {
    const { container } = render(<StitchInput />);
    const input = container.querySelector('input') as HTMLElement;
    expect(input.className).toContain('bg-white');
  });

  it('applies focus:ring-2 focus:ring-primary/40', () => {
    const { container } = render(<StitchInput />);
    const input = container.querySelector('input') as HTMLElement;
    expect(input.className).toContain('focus:ring-2');
    expect(input.className).toContain('focus:ring-primary/40');
  });

  it('applies ring-2 ring-red-500 when hasError=true', () => {
    const { container } = render(<StitchInput hasError />);
    const input = container.querySelector('input') as HTMLElement;
    expect(input.className).toContain('ring-2');
    expect(input.className).toContain('ring-red-500');
  });

  it('does NOT apply ring-red-500 when hasError=false', () => {
    const { container } = render(<StitchInput />);
    const input = container.querySelector('input') as HTMLElement;
    expect(input.className).not.toContain('ring-red-500');
  });

  it('renders label with editorial typography when label prop provided', () => {
    render(<StitchInput label="고객사" />);
    const label = screen.getByText('고객사');
    expect(label.tagName).toBe('LABEL');
    expect(label.className).toContain('text-[11px]');
    expect(label.className).toContain('font-bold');
    expect(label.className).toContain('uppercase');
    expect(label.className).toContain('tracking-widest');
    expect(label.className).toContain('text-slate-500');
  });

  it('does NOT render label when label prop is not provided', () => {
    const { container } = render(<StitchInput />);
    const labels = container.querySelectorAll('label');
    expect(labels.length).toBe(0);
  });

  it('associates label with input via htmlFor/id', () => {
    const { container } = render(<StitchInput label="이름" />);
    const label = container.querySelector('label');
    const input = container.querySelector('input');
    expect(label?.getAttribute('for')).toBeTruthy();
    expect(input?.id).toBe(label?.getAttribute('for'));
  });

  it('forwards ref', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<StitchInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('merges custom className', () => {
    const { container } = render(<StitchInput className="my-input" />);
    const input = container.querySelector('input') as HTMLElement;
    expect(input.className).toContain('my-input');
  });

  it('passes through standard input props', () => {
    render(<StitchInput type="email" placeholder="test@example.com" disabled />);
    const input = screen.getByPlaceholderText('test@example.com');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toBeDisabled();
  });
});
