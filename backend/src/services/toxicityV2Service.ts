/**
 * Toxicity V2 Service
 * 
 * v2 독성시험 데이터 조회 서비스 레이어
 * ToxicityV2Item, ToxicityV2Relation, ToxicityV2Overlay, ToxicityV2Metadata 모델 사용
 */

import { prisma } from '../lib/prisma';

// 모드별 시험 항목 조회
export async function getItemsByMode(mode: string) {
  const items = await prisma.toxicityV2Item.findMany({
    where: { mode, isActive: true },
    orderBy: [{ itemId: 'asc' }],
  });

  return items.map(item => ({
    id: item.itemId,
    num: item.num,
    name: item.name,
    category: item.category,
    species: item.species,
    duration: item.duration,
    description: item.description,
    priceOral: item.priceOral ? Number(item.priceOral) : null,
    routeOral: item.routeOral,
    weeksOral: item.weeksOral,
    priceIv: item.priceIv ? Number(item.priceIv) : null,
    routeIv: item.routeIv,
    weeksIv: item.weeksIv,
    priceP2: item.priceP2 ? Number(item.priceP2) : null,
    priceP3: item.priceP3 ? Number(item.priceP3) : null,
    priceP4: item.priceP4 ? Number(item.priceP4) : null,
    priceSingle: item.priceSingle ? Number(item.priceSingle) : null,
    formalName: item.formalName,
    guideline: item.guideline,
    note: item.note,
  }));
}

// 모드별 카테고리 목록 조회
export async function getCategoriesByMode(mode: string) {
  const items = await prisma.toxicityV2Item.findMany({
    where: { mode, isActive: true },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });

  return items.map(item => item.category);
}


// 시험 관계 트리 조회
export async function getRelations() {
  const relations = await prisma.toxicityV2Relation.findMany({
    orderBy: { mainTestId: 'asc' },
  });

  return relations.map(rel => ({
    mainTestId: rel.mainTestId,
    recoveryTestId: rel.recoveryTestId,
    tkOptions: rel.tkOptions,
  }));
}

// OECD 오버레이 조회
export async function getOverlays() {
  const overlays = await prisma.toxicityV2Overlay.findMany({
    orderBy: [{ type: 'asc' }, { itemId: 'asc' }],
  });

  // OV와 OE를 분리하여 반환
  const ov: Record<number, { oop?: number; oip?: number }> = {};
  const oe: Record<number, { oop?: number; oip?: number }> = {};

  for (const overlay of overlays) {
    const entry = {
      oop: overlay.priceOop ? Number(overlay.priceOop) : undefined,
      oip: overlay.priceOip ? Number(overlay.priceOip) : undefined,
    };
    if (overlay.type === 'OV') {
      ov[overlay.itemId] = entry;
    } else if (overlay.type === 'OE') {
      oe[overlay.itemId] = entry;
    }
  }

  return { ov, oe };
}

// 메타데이터 조회 (FN, GL, CC, IM, CATS)
export async function getMetadata() {
  const metadata = await prisma.toxicityV2Metadata.findMany();

  const result: Record<string, unknown> = {};
  for (const m of metadata) {
    result[m.key] = m.value;
  }

  return result;
}
