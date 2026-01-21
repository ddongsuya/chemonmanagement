# CHEMON 커뮤니티 모듈 상세 설계

> 공지사항, 자유게시판, 댓글, 파일첨부, 좋아요, 검색, 카테고리 관리, 알림, 통계

---

## 목차

1. [데이터베이스 스키마](#1-데이터베이스-스키마)
2. [API 엔드포인트](#2-api-엔드포인트)
3. [프론트엔드 구조](#3-프론트엔드-구조)
4. [기능별 상세 명세](#4-기능별-상세-명세)

---

## 1. 데이터베이스 스키마

### 1.1 신규 Enum

```prisma
// 게시판 타입
enum BoardType {
  NOTICE        // 공지사항 (관리자만 작성)
  FREE          // 자유게시판
  QNA           // 질문답변
  RESOURCE      // 자료실
  GALLERY       // 갤러리 (이미지 중심)
}

// 게시글 상태
enum PostStatus {
  DRAFT         // 임시저장
  PUBLISHED     // 게시됨
  HIDDEN        // 숨김 (작성자/관리자)
  DELETED       // 삭제됨 (soft delete)
}

// 첨부파일 타입
enum AttachmentType {
  IMAGE         // 이미지
  DOCUMENT      // 문서 (PDF, DOC 등)
  VIDEO         // 동영상
  OTHER         // 기타
}

// 신고 사유
enum ReportReason {
  SPAM          // 스팸/광고
  INAPPROPRIATE // 부적절한 내용
  HARASSMENT    // 욕설/비방
  COPYRIGHT     // 저작권 침해
  OTHER         // 기타
}

// 신고 상태
enum ReportStatus {
  PENDING       // 대기
  REVIEWED      // 검토완료
  RESOLVED      // 처리완료
  DISMISSED     // 기각
}
```

### 1.2 게시판 (Board)

```prisma
// 게시판 (카테고리)
model Board {
  id             String      @id @default(uuid())
  
  // 기본 정보
  name           String                           // 게시판명 (공지사항, 자유게시판)
  slug           String      @unique              // URL slug (notice, free)
  description    String?                          // 설명
  type           BoardType   @default(FREE)
  
  // 설정
  order          Int         @default(0)          // 표시 순서
  isActive       Boolean     @default(true)       // 활성화 여부
  isPublic       Boolean     @default(true)       // 비로그인 열람 가능
  
  // 권한 설정
  allowComments  Boolean     @default(true)       // 댓글 허용
  allowAnonymous Boolean     @default(false)      // 익명 작성 허용
  writeRoles     String[]    @default(["USER"])   // 작성 권한 (USER, ADMIN)
  
  // 기능 설정
  useCategory    Boolean     @default(false)      // 카테고리 사용
  useTag         Boolean     @default(false)      // 태그 사용
  useAttachment  Boolean     @default(true)       // 첨부파일 허용
  maxAttachments Int         @default(5)          // 최대 첨부파일 수
  maxFileSize    Int         @default(10)         // 최대 파일 크기 (MB)
  
  // 메타
  postCount      Int         @default(0)          // 게시글 수 (캐시)
  
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  
  // 관계
  categories     BoardCategory[]
  posts          Post[]
  
  @@index([slug])
  @@index([type, isActive])
}

// 게시판 내 카테고리 (선택적)
model BoardCategory {
  id          String   @id @default(uuid())
  boardId     String
  board       Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  
  name        String                              // 카테고리명
  slug        String                              // URL용
  color       String?                             // 라벨 색상
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  posts       Post[]
  
  @@unique([boardId, slug])
  @@index([boardId, order])
}
```

### 1.3 게시글 (Post)

```prisma
// 게시글
model Post {
  id             String      @id @default(uuid())
  
  // 소속
  boardId        String
  board          Board       @relation(fields: [boardId], references: [id])
  categoryId     String?
  category       BoardCategory? @relation(fields: [categoryId], references: [id])
  
  // 작성자
  authorId       String
  author         User        @relation(fields: [authorId], references: [id])
  isAnonymous    Boolean     @default(false)      // 익명 작성
  
  // 내용
  title          String
  content        String      @db.Text             // HTML 또는 Markdown
  contentText    String?     @db.Text             // 검색용 plain text
  excerpt        String?                          // 미리보기 (200자)
  
  // 상태
  status         PostStatus  @default(PUBLISHED)
  isPinned       Boolean     @default(false)      // 상단 고정
  isNotice       Boolean     @default(false)      // 공지 표시
  
  // 통계
  viewCount      Int         @default(0)
  likeCount      Int         @default(0)
  dislikeCount   Int         @default(0)
  commentCount   Int         @default(0)
  bookmarkCount  Int         @default(0)
  
  // SEO / 공유
  thumbnail      String?                          // 대표 이미지 URL
  
  // 타임스탬프
  publishedAt    DateTime?                        // 게시일 (예약 게시용)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  deletedAt      DateTime?
  
  // 관계
  comments       Comment[]
  attachments    Attachment[]
  tags           PostTag[]
  likes          PostReaction[]
  bookmarks      PostBookmark[]
  views          PostView[]
  reports        Report[]     @relation("PostReports")
  
  @@index([boardId, status, isPinned, createdAt])
  @@index([authorId])
  @@index([status, publishedAt])
  @@fulltext([title, contentText])               // 전문 검색 (MySQL/PostgreSQL)
}

// 태그
model Tag {
  id          String    @id @default(uuid())
  name        String    @unique                   // 태그명
  slug        String    @unique                   // URL용
  postCount   Int       @default(0)               // 사용 횟수 (캐시)
  
  createdAt   DateTime  @default(now())
  
  posts       PostTag[]
  
  @@index([name])
}

// 게시글-태그 연결
model PostTag {
  id          String   @id @default(uuid())
  postId      String
  post        Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  tagId       String
  tag         Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime @default(now())
  
  @@unique([postId, tagId])
  @@index([tagId])
}
```

### 1.4 댓글 (Comment)

```prisma
// 댓글
model Comment {
  id             String      @id @default(uuid())
  
  // 소속
  postId         String
  post           Post        @relation(fields: [postId], references: [id], onDelete: Cascade)
  
  // 작성자
  authorId       String
  author         User        @relation(fields: [authorId], references: [id])
  isAnonymous    Boolean     @default(false)
  
  // 대댓글 (계층 구조)
  parentId       String?
  parent         Comment?    @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies        Comment[]   @relation("CommentReplies")
  depth          Int         @default(0)          // 0: 댓글, 1: 대댓글 (최대 1단계)
  
  // 멘션 (대댓글에서 다른 사용자 언급)
  mentionUserId  String?
  mentionUser    User?       @relation("MentionedComments", fields: [mentionUserId], references: [id])
  
  // 내용
  content        String      @db.Text
  
  // 상태
  isDeleted      Boolean     @default(false)      // soft delete (댓글 있으면 "삭제된 댓글입니다")
  isHidden       Boolean     @default(false)      // 관리자 숨김
  
  // 통계
  likeCount      Int         @default(0)
  dislikeCount   Int         @default(0)
  replyCount     Int         @default(0)
  
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  
  // 관계
  reactions      CommentReaction[]
  reports        Report[]    @relation("CommentReports")
  
  @@index([postId, createdAt])
  @@index([parentId])
  @@index([authorId])
}
```

### 1.5 첨부파일 (Attachment)

```prisma
// 첨부파일
model Attachment {
  id             String         @id @default(uuid())
  
  // 소속 (다형성 - 게시글 또는 댓글)
  postId         String?
  post           Post?          @relation(fields: [postId], references: [id], onDelete: Cascade)
  
  // 파일 정보
  fileName       String                           // 원본 파일명
  fileKey        String         @unique           // 저장소 키 (UUID 기반)
  fileUrl        String                           // 접근 URL
  fileSize       Int                              // 바이트
  mimeType       String                           // MIME 타입
  type           AttachmentType @default(OTHER)
  
  // 이미지 전용
  width          Int?                             // 이미지 너비
  height         Int?                             // 이미지 높이
  thumbnailUrl   String?                          // 썸네일 URL
  
  // 업로더
  uploaderId     String
  uploader       User           @relation(fields: [uploaderId], references: [id])
  
  // 다운로드 통계
  downloadCount  Int            @default(0)
  
  createdAt      DateTime       @default(now())
  
  @@index([postId])
  @@index([uploaderId])
  @@index([type])
}
```

### 1.6 반응 (좋아요/싫어요)

```prisma
// 게시글 반응
model PostReaction {
  id          String   @id @default(uuid())
  postId      String
  post        Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type        String   @default("LIKE")           // LIKE, DISLIKE
  
  createdAt   DateTime @default(now())
  
  @@unique([postId, userId])
  @@index([postId, type])
}

// 댓글 반응
model CommentReaction {
  id          String   @id @default(uuid())
  commentId   String
  comment     Comment  @relation(fields: [commentId], references: [id], onDelete: Cascade)
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type        String   @default("LIKE")
  
  createdAt   DateTime @default(now())
  
  @@unique([commentId, userId])
  @@index([commentId, type])
}

// 북마크 (스크랩)
model PostBookmark {
  id          String   @id @default(uuid())
  postId      String
  post        Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime @default(now())
  
  @@unique([postId, userId])
  @@index([userId, createdAt])
}
```

### 1.7 조회수 & 알림

```prisma
// 조회 기록 (중복 방지용)
model PostView {
  id          String   @id @default(uuid())
  postId      String
  post        Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  
  // 로그인 사용자 또는 익명
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  ipAddress   String?                            // 비로그인 시
  
  viewedAt    DateTime @default(now())
  
  @@unique([postId, userId])                     // 로그인 사용자 중복 방지
  @@index([postId, viewedAt])
}

// 커뮤니티 알림 (기존 Notification 확장 또는 별도)
model CommunityNotification {
  id             String   @id @default(uuid())
  
  // 수신자
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // 알림 유형
  type           String                          // COMMENT, REPLY, MENTION, LIKE, NOTICE
  
  // 관련 엔티티
  postId         String?
  commentId      String?
  actorId        String?                         // 액션 수행자
  
  // 내용
  title          String
  message        String
  link           String?                         // 이동 링크
  
  // 상태
  isRead         Boolean  @default(false)
  readAt         DateTime?
  
  createdAt      DateTime @default(now())
  
  @@index([userId, isRead, createdAt])
  @@index([type])
}
```

### 1.8 신고 & 통계

```prisma
// 신고
model Report {
  id             String       @id @default(uuid())
  
  // 신고 대상 (다형성)
  postId         String?
  post           Post?        @relation("PostReports", fields: [postId], references: [id], onDelete: Cascade)
  commentId      String?
  comment        Comment?     @relation("CommentReports", fields: [commentId], references: [id], onDelete: Cascade)
  
  // 신고자
  reporterId     String
  reporter       User         @relation("ReportsMade", fields: [reporterId], references: [id])
  
  // 신고 내용
  reason         ReportReason
  description    String?                         // 상세 설명
  
  // 처리
  status         ReportStatus @default(PENDING)
  handledBy      String?                         // 처리 관리자
  handledAt      DateTime?
  handlerNote    String?                         // 처리 메모
  
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  
  @@index([status, createdAt])
  @@index([postId])
  @@index([commentId])
}

// 일별 통계 (집계 테이블)
model CommunityStats {
  id             String   @id @default(uuid())
  
  date           DateTime @db.Date               // 날짜
  boardId        String?                         // 게시판별 (null이면 전체)
  
  // 통계
  postCount      Int      @default(0)            // 새 게시글
  commentCount   Int      @default(0)            // 새 댓글
  viewCount      Int      @default(0)            // 총 조회수
  userCount      Int      @default(0)            // 활성 사용자
  
  createdAt      DateTime @default(now())
  
  @@unique([date, boardId])
  @@index([date])
}
```

### 1.9 User 모델 관계 추가

```prisma
// User 모델에 추가할 관계
model User {
  // ... 기존 필드 ...
  
  // 커뮤니티 관계 추가
  posts              Post[]
  comments           Comment[]
  mentionedComments  Comment[]           @relation("MentionedComments")
  attachments        Attachment[]
  postReactions      PostReaction[]
  commentReactions   CommentReaction[]
  bookmarks          PostBookmark[]
  postViews          PostView[]
  communityNotifications CommunityNotification[]
  reportsMade        Report[]            @relation("ReportsMade")
}
```

---

## 스키마 요약

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     커뮤니티 모듈 ERD 개요                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Board (게시판)                                                        │
│     ├── BoardCategory (카테고리)                                        │
│     └── Post (게시글)                                                   │
│           ├── Comment (댓글)                                            │
│           │     ├── Comment (대댓글)                                    │
│           │     └── CommentReaction (좋아요)                            │
│           ├── Attachment (첨부파일)                                     │
│           ├── PostTag → Tag (태그)                                      │
│           ├── PostReaction (좋아요/싫어요)                              │
│           ├── PostBookmark (북마크)                                     │
│           ├── PostView (조회기록)                                       │
│           └── Report (신고)                                             │
│                                                                         │
│   CommunityNotification (알림)                                          │
│   CommunityStats (통계)                                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

*다음: API 엔드포인트*
