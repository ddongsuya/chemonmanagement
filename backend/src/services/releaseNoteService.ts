// backend/src/services/releaseNoteService.ts
// 서버 시작 시 release-notes 폴더를 스캔하여 공지사항 자동 등록

import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';

interface ReleaseNote {
  version: string;
  title: string;
  content: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  durationDays: number;
}

const RELEASE_NOTES_DIR = path.join(process.cwd(), 'release-notes');
const ID_PREFIX = 'release-note-';

/**
 * release-notes 폴더의 JSON 파일을 읽어서
 * DB에 아직 없는 버전만 공지사항으로 자동 등록
 */
export async function syncReleaseNotes(): Promise<void> {
  // release-notes 폴더 존재 확인
  if (!fs.existsSync(RELEASE_NOTES_DIR)) {
    console.log('📢 No release-notes directory found, skipping');
    return;
  }

  // JSON 파일 목록
  const files = fs.readdirSync(RELEASE_NOTES_DIR).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.log('📢 No release note files found');
    return;
  }

  // admin 유저 찾기 (공지 작성자)
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN', status: 'ACTIVE' },
    select: { id: true },
  });

  if (!admin) {
    console.warn('⚠️ No active admin user found, skipping release notes sync');
    return;
  }

  let created = 0;
  let skipped = 0;

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(RELEASE_NOTES_DIR, file), 'utf-8');
      const note: ReleaseNote = JSON.parse(raw);

      if (!note.version || !note.title || !note.content) {
        console.warn(`⚠️ Invalid release note file: ${file} (missing required fields)`);
        continue;
      }

      const id = `${ID_PREFIX}${note.version}`;

      // 이미 존재하는지 확인
      const existing = await prisma.announcement.findUnique({ where: { id } });
      if (existing) {
        skipped++;
        continue;
      }

      // 공지 기간 계산
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + (note.durationDays || 30));

      await prisma.announcement.create({
        data: {
          id,
          title: note.title,
          content: note.content,
          priority: note.priority || 'NORMAL',
          startDate: now,
          endDate,
          isActive: true,
          createdBy: admin.id,
        },
      });

      created++;
      console.log(`📢 Created announcement: ${note.title}`);
    } catch (err) {
      console.error(`❌ Failed to process release note ${file}:`, err);
    }
  }

  if (created > 0 || skipped > 0) {
    console.log(`📢 Release notes sync: ${created} created, ${skipped} already existed`);
  }
}
