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
# CHEMON 커뮤니티 모듈 - API 엔드포인트

---

## 2. API 엔드포인트

### 2.1 API 구조 개요

```
/api/community
├── /boards                    # 게시판 관리
├── /posts                     # 게시글
├── /comments                  # 댓글
├── /attachments               # 첨부파일
├── /tags                      # 태그
├── /bookmarks                 # 북마크
├── /notifications             # 알림
├── /reports                   # 신고
├── /search                    # 검색
└── /stats                     # 통계
```

---

### 2.2 게시판 API

```typescript
// ==================== Boards API ====================

// GET /api/community/boards
// 게시판 목록 조회
interface BoardsListResponse {
  boards: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    type: BoardType;
    postCount: number;
    isPublic: boolean;
    useCategory: boolean;
    categories?: BoardCategory[];
  }>;
}

// GET /api/community/boards/:slug
// 게시판 상세 조회
interface BoardDetailResponse {
  board: Board;
  categories: BoardCategory[];
  recentPosts: Post[];
  stats: {
    totalPosts: number;
    todayPosts: number;
  };
}

// ===== 관리자 전용 =====

// POST /api/community/boards
// 게시판 생성 (Admin)
interface CreateBoardRequest {
  name: string;
  slug: string;
  description?: string;
  type: BoardType;
  isPublic?: boolean;
  allowComments?: boolean;
  allowAnonymous?: boolean;
  writeRoles?: string[];
  useCategory?: boolean;
  useTag?: boolean;
  useAttachment?: boolean;
  maxAttachments?: number;
  maxFileSize?: number;
}

// PUT /api/community/boards/:id
// 게시판 수정 (Admin)

// DELETE /api/community/boards/:id
// 게시판 삭제 (Admin)

// POST /api/community/boards/:id/categories
// 카테고리 추가 (Admin)
interface CreateCategoryRequest {
  name: string;
  slug: string;
  color?: string;
  order?: number;
}

// PUT /api/community/boards/:boardId/categories/:categoryId
// DELETE /api/community/boards/:boardId/categories/:categoryId
```

---

### 2.3 게시글 API

```typescript
// ==================== Posts API ====================

// GET /api/community/posts
// 게시글 목록 조회
interface PostsListQuery {
  boardSlug?: string;         // 게시판 필터
  categorySlug?: string;      // 카테고리 필터
  authorId?: string;          // 작성자 필터
  tag?: string;               // 태그 필터
  status?: PostStatus;        // 상태 필터
  isPinned?: boolean;
  search?: string;            // 검색어
  sortBy?: 'createdAt' | 'viewCount' | 'likeCount' | 'commentCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface PostsListResponse {
  posts: Array<{
    id: string;
    title: string;
    excerpt?: string;
    thumbnail?: string;
    author: { id: string; name: string; avatar?: string } | null; // 익명이면 null
    board: { id: string; name: string; slug: string };
    category?: { id: string; name: string; color?: string };
    tags: Array<{ id: string; name: string }>;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    isPinned: boolean;
    isNotice: boolean;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// GET /api/community/posts/:id
// 게시글 상세 조회
interface PostDetailResponse {
  post: {
    id: string;
    title: string;
    content: string;           // HTML
    author: UserSummary | null;
    board: BoardSummary;
    category?: CategorySummary;
    tags: TagSummary[];
    attachments: AttachmentSummary[];
    viewCount: number;
    likeCount: number;
    dislikeCount: number;
    commentCount: number;
    bookmarkCount: number;
    isPinned: boolean;
    isNotice: boolean;
    createdAt: string;
    updatedAt: string;
  };
  userReaction?: 'LIKE' | 'DISLIKE' | null;  // 현재 사용자 반응
  isBookmarked: boolean;
  isAuthor: boolean;
  prevPost?: { id: string; title: string };
  nextPost?: { id: string; title: string };
}

// POST /api/community/posts
// 게시글 작성
interface CreatePostRequest {
  boardId: string;
  categoryId?: string;
  title: string;
  content: string;             // HTML
  tags?: string[];             // 태그 이름 배열
  attachmentIds?: string[];    // 미리 업로드된 첨부파일
  isAnonymous?: boolean;
  status?: 'DRAFT' | 'PUBLISHED';
  publishedAt?: string;        // 예약 게시
}

interface CreatePostResponse {
  post: Post;
  message: string;
}

// PUT /api/community/posts/:id
// 게시글 수정
interface UpdatePostRequest {
  categoryId?: string;
  title?: string;
  content?: string;
  tags?: string[];
  attachmentIds?: string[];
  status?: PostStatus;
}

// DELETE /api/community/posts/:id
// 게시글 삭제

// ===== 게시글 액션 =====

// POST /api/community/posts/:id/view
// 조회수 증가
// (중복 방지 로직 포함)

// POST /api/community/posts/:id/reaction
// 좋아요/싫어요
interface ReactionRequest {
  type: 'LIKE' | 'DISLIKE' | null;  // null이면 취소
}

interface ReactionResponse {
  likeCount: number;
  dislikeCount: number;
  userReaction: 'LIKE' | 'DISLIKE' | null;
}

// POST /api/community/posts/:id/bookmark
// 북마크 토글
interface BookmarkResponse {
  isBookmarked: boolean;
  bookmarkCount: number;
}

// POST /api/community/posts/:id/pin
// 상단 고정 토글 (Admin/작성자)

// POST /api/community/posts/:id/report
// 게시글 신고
interface ReportRequest {
  reason: ReportReason;
  description?: string;
}
```

---

### 2.4 댓글 API

```typescript
// ==================== Comments API ====================

// GET /api/community/posts/:postId/comments
// 댓글 목록 조회
interface CommentsListQuery {
  sortBy?: 'createdAt' | 'likeCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface CommentsListResponse {
  comments: Array<{
    id: string;
    content: string;
    author: UserSummary | null;
    depth: number;
    parentId?: string;
    mentionUser?: UserSummary;
    likeCount: number;
    dislikeCount: number;
    replyCount: number;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    userReaction?: 'LIKE' | 'DISLIKE' | null;
    isAuthor: boolean;
    replies?: Comment[];       // depth=0일 때만 포함
  }>;
  pagination: Pagination;
  totalCount: number;
}

// POST /api/community/posts/:postId/comments
// 댓글 작성
interface CreateCommentRequest {
  content: string;
  parentId?: string;           // 대댓글 시
  mentionUserId?: string;      // 멘션 시
  isAnonymous?: boolean;
}

interface CreateCommentResponse {
  comment: Comment;
  postCommentCount: number;    // 업데이트된 게시글 댓글 수
}

// PUT /api/community/comments/:id
// 댓글 수정
interface UpdateCommentRequest {
  content: string;
}

// DELETE /api/community/comments/:id
// 댓글 삭제 (대댓글 있으면 soft delete)

// POST /api/community/comments/:id/reaction
// 댓글 좋아요/싫어요

// POST /api/community/comments/:id/report
// 댓글 신고
```

---

### 2.5 첨부파일 API

```typescript
// ==================== Attachments API ====================

// POST /api/community/attachments/upload
// 파일 업로드 (단일)
// Content-Type: multipart/form-data
interface UploadResponse {
  attachment: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    type: AttachmentType;
    thumbnailUrl?: string;
    width?: number;
    height?: number;
  };
}

// POST /api/community/attachments/upload-multiple
// 다중 파일 업로드
interface MultiUploadResponse {
  attachments: Attachment[];
  failed: Array<{ fileName: string; error: string }>;
}

// DELETE /api/community/attachments/:id
// 첨부파일 삭제 (업로더 또는 관리자)

// GET /api/community/attachments/:id/download
// 파일 다운로드 (다운로드 수 증가)

// POST /api/community/attachments/editor-upload
// 에디터 이미지 업로드 (즉시 URL 반환)
interface EditorUploadResponse {
  url: string;
  thumbnailUrl?: string;
}
```

---

### 2.6 태그 API

```typescript
// ==================== Tags API ====================

// GET /api/community/tags
// 태그 목록 조회
interface TagsListQuery {
  search?: string;
  sortBy?: 'name' | 'postCount';
  limit?: number;
}

interface TagsListResponse {
  tags: Array<{
    id: string;
    name: string;
    slug: string;
    postCount: number;
  }>;
}

// GET /api/community/tags/popular
// 인기 태그 조회
interface PopularTagsQuery {
  limit?: number;              // 기본 20
  period?: '7d' | '30d' | 'all';
}

// GET /api/community/tags/:slug/posts
// 특정 태그의 게시글 목록
```

---

### 2.7 북마크 API

```typescript
// ==================== Bookmarks API ====================

// GET /api/community/bookmarks
// 내 북마크 목록
interface BookmarksListQuery {
  boardSlug?: string;
  page?: number;
  limit?: number;
}

interface BookmarksListResponse {
  bookmarks: Array<{
    id: string;
    post: PostSummary;
    createdAt: string;
  }>;
  pagination: Pagination;
}

// DELETE /api/community/bookmarks/:postId
// 북마크 삭제
```

---

### 2.8 알림 API

```typescript
// ==================== Notifications API ====================

// GET /api/community/notifications
// 알림 목록 조회
interface NotificationsListQuery {
  type?: string;               // COMMENT, REPLY, MENTION, LIKE
  isRead?: boolean;
  page?: number;
  limit?: number;
}

interface NotificationsListResponse {
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    actor?: UserSummary;
    post?: { id: string; title: string };
    isRead: boolean;
    createdAt: string;
  }>;
  pagination: Pagination;
  unreadCount: number;
}

// GET /api/community/notifications/unread-count
// 읽지 않은 알림 수

// PUT /api/community/notifications/:id/read
// 알림 읽음 처리

// PUT /api/community/notifications/read-all
// 모든 알림 읽음 처리

// DELETE /api/community/notifications/:id
// 알림 삭제
```

---

### 2.9 검색 API

```typescript
// ==================== Search API ====================

// GET /api/community/search
// 통합 검색
interface SearchQuery {
  q: string;                   // 검색어 (필수)
  type?: 'all' | 'post' | 'comment';
  boardSlug?: string;
  authorId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'relevance' | 'createdAt' | 'viewCount';
  page?: number;
  limit?: number;
}

interface SearchResponse {
  results: Array<{
    type: 'post' | 'comment';
    id: string;
    title?: string;            // 게시글만
    content: string;           // 하이라이트된 내용
    author?: UserSummary;
    board: BoardSummary;
    post?: { id: string; title: string };  // 댓글인 경우
    createdAt: string;
    highlights: string[];      // 매칭된 부분
  }>;
  pagination: Pagination;
  totalCount: number;
  searchTime: number;          // ms
}

// GET /api/community/search/suggestions
// 검색어 자동완성
interface SuggestionsQuery {
  q: string;
  limit?: number;
}

interface SuggestionsResponse {
  suggestions: string[];
  recentSearches: string[];    // 본인 최근 검색어
  popularSearches: string[];   // 인기 검색어
}
```

---

### 2.10 신고 API (관리자)

```typescript
// ==================== Reports API (Admin) ====================

// GET /api/community/admin/reports
// 신고 목록 조회
interface ReportsListQuery {
  status?: ReportStatus;
  reason?: ReportReason;
  targetType?: 'post' | 'comment';
  page?: number;
  limit?: number;
}

interface ReportsListResponse {
  reports: Array<{
    id: string;
    targetType: 'post' | 'comment';
    target: PostSummary | CommentSummary;
    reporter: UserSummary;
    reason: ReportReason;
    description?: string;
    status: ReportStatus;
    handledBy?: UserSummary;
    handledAt?: string;
    createdAt: string;
  }>;
  pagination: Pagination;
  statusCounts: Record<ReportStatus, number>;
}

// PUT /api/community/admin/reports/:id
// 신고 처리
interface HandleReportRequest {
  status: ReportStatus;
  handlerNote?: string;
  action?: 'HIDE_CONTENT' | 'DELETE_CONTENT' | 'WARN_USER' | 'BAN_USER' | 'NONE';
}
```

---

### 2.11 통계 API

```typescript
// ==================== Stats API ====================

// GET /api/community/stats/overview
// 커뮤니티 전체 통계 (관리자 또는 전체 공개)
interface OverviewStatsResponse {
  summary: {
    totalBoards: number;
    totalPosts: number;
    totalComments: number;
    totalUsers: number;        // 글 작성한 사용자
  };
  today: {
    posts: number;
    comments: number;
    views: number;
    activeUsers: number;
  };
  trends: {
    postsChange: number;       // 전일 대비 %
    commentsChange: number;
    viewsChange: number;
  };
}

// GET /api/community/stats/boards
// 게시판별 통계
interface BoardStatsResponse {
  boards: Array<{
    id: string;
    name: string;
    slug: string;
    postCount: number;
    commentCount: number;
    viewCount: number;
    todayPosts: number;
  }>;
}

// GET /api/community/stats/chart
// 차트용 데이터
interface ChartStatsQuery {
  metric: 'posts' | 'comments' | 'views' | 'users';
  period: '7d' | '30d' | '90d';
  boardId?: string;
}

interface ChartStatsResponse {
  data: Array<{
    date: string;
    value: number;
  }>;
  total: number;
  average: number;
}

// GET /api/community/stats/popular
// 인기 콘텐츠
interface PopularStatsQuery {
  type: 'posts' | 'authors';
  period: '7d' | '30d' | 'all';
  limit?: number;
}

interface PopularPostsResponse {
  posts: Array<{
    id: string;
    title: string;
    author?: UserSummary;
    board: BoardSummary;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    createdAt: string;
  }>;
}

// GET /api/community/stats/my
// 내 활동 통계
interface MyStatsResponse {
  posts: number;
  comments: number;
  totalViews: number;          // 내 글 총 조회수
  totalLikes: number;          // 내 글 총 좋아요
  bookmarks: number;
  recentActivity: Array<{
    type: 'POST' | 'COMMENT' | 'LIKE';
    target: any;
    createdAt: string;
  }>;
}
```

---

## API 인증 & 권한 정리

| 엔드포인트 | 인증 | 권한 |
|-----------|------|------|
| GET /boards | ❌ | 공개 |
| GET /posts | ❌* | 공개 게시판만 |
| GET /posts/:id | ❌* | 공개 게시판만 |
| POST /posts | ✅ | USER, ADMIN (게시판 설정) |
| PUT /posts/:id | ✅ | 작성자, ADMIN |
| DELETE /posts/:id | ✅ | 작성자, ADMIN |
| POST /comments | ✅ | USER |
| POST /attachments | ✅ | USER |
| GET /bookmarks | ✅ | 본인 |
| GET /notifications | ✅ | 본인 |
| GET /admin/reports | ✅ | ADMIN |
| PUT /admin/reports/:id | ✅ | ADMIN |
| GET /stats/overview | ✅ | ADMIN (또는 공개) |

*비공개 게시판은 인증 필요

---

*다음: 프론트엔드 구조*
# CHEMON 커뮤니티 모듈 - 프론트엔드 구조

---

## 3. 프론트엔드 구조

### 3.1 디렉토리 구조

```
src/
├── app/
│   └── (dashboard)/
│       └── community/
│           ├── page.tsx                    # 커뮤니티 메인 (게시판 목록)
│           ├── layout.tsx                  # 커뮤니티 레이아웃
│           │
│           ├── [boardSlug]/                # 게시판
│           │   ├── page.tsx                # 게시글 목록
│           │   ├── write/page.tsx          # 글쓰기
│           │   └── [postId]/
│           │       ├── page.tsx            # 게시글 상세
│           │       └── edit/page.tsx       # 글 수정
│           │
│           ├── search/page.tsx             # 검색 결과
│           ├── bookmarks/page.tsx          # 내 북마크
│           ├── my-posts/page.tsx           # 내가 쓴 글
│           ├── my-comments/page.tsx        # 내가 쓴 댓글
│           ├── notifications/page.tsx      # 알림
│           │
│           └── admin/                      # 관리자
│               ├── page.tsx                # 관리자 대시보드
│               ├── boards/page.tsx         # 게시판 관리
│               ├── reports/page.tsx        # 신고 관리
│               └── stats/page.tsx          # 통계
│
├── components/
│   └── community/
│       ├── boards/
│       │   ├── BoardList.tsx               # 게시판 목록
│       │   ├── BoardCard.tsx               # 게시판 카드
│       │   └── BoardSidebar.tsx            # 게시판 사이드바
│       │
│       ├── posts/
│       │   ├── PostList.tsx                # 게시글 목록
│       │   ├── PostCard.tsx                # 게시글 카드 (카드형)
│       │   ├── PostRow.tsx                 # 게시글 행 (테이블형)
│       │   ├── PostDetail.tsx              # 게시글 상세
│       │   ├── PostEditor.tsx              # 글 작성/수정 에디터
│       │   ├── PostActions.tsx             # 좋아요/북마크/공유
│       │   ├── PostMeta.tsx                # 작성자/날짜/조회수
│       │   └── PostNavigation.tsx          # 이전글/다음글
│       │
│       ├── comments/
│       │   ├── CommentList.tsx             # 댓글 목록
│       │   ├── CommentItem.tsx             # 댓글 아이템
│       │   ├── CommentForm.tsx             # 댓글 작성 폼
│       │   ├── CommentActions.tsx          # 좋아요/답글/신고
│       │   └── ReplyList.tsx               # 대댓글 목록
│       │
│       ├── attachments/
│       │   ├── FileUploader.tsx            # 파일 업로더
│       │   ├── AttachmentList.tsx          # 첨부파일 목록
│       │   ├── AttachmentItem.tsx          # 첨부파일 아이템
│       │   ├── ImageGallery.tsx            # 이미지 갤러리
│       │   └── FilePreview.tsx             # 파일 미리보기
│       │
│       ├── tags/
│       │   ├── TagInput.tsx                # 태그 입력
│       │   ├── TagList.tsx                 # 태그 목록
│       │   └── PopularTags.tsx             # 인기 태그
│       │
│       ├── search/
│       │   ├── SearchBar.tsx               # 검색바
│       │   ├── SearchResults.tsx           # 검색 결과
│       │   ├── SearchFilters.tsx           # 검색 필터
│       │   └── SearchSuggestions.tsx       # 자동완성
│       │
│       ├── notifications/
│       │   ├── NotificationList.tsx        # 알림 목록
│       │   ├── NotificationItem.tsx        # 알림 아이템
│       │   └── NotificationBell.tsx        # 알림 벨 (헤더용)
│       │
│       ├── admin/
│       │   ├── BoardManager.tsx            # 게시판 관리
│       │   ├── CategoryManager.tsx         # 카테고리 관리
│       │   ├── ReportManager.tsx           # 신고 관리
│       │   └── StatsOverview.tsx           # 통계 개요
│       │
│       ├── shared/
│       │   ├── UserAvatar.tsx              # 사용자 아바타
│       │   ├── AnonymousBadge.tsx          # 익명 배지
│       │   ├── Pagination.tsx              # 페이지네이션
│       │   ├── SortSelect.tsx              # 정렬 선택
│       │   ├── ViewToggle.tsx              # 뷰 전환 (카드/테이블)
│       │   ├── ReportModal.tsx             # 신고 모달
│       │   ├── ShareModal.tsx              # 공유 모달
│       │   └── ConfirmModal.tsx            # 확인 모달
│       │
│       └── editor/
│           ├── RichTextEditor.tsx          # WYSIWYG 에디터
│           ├── MarkdownEditor.tsx          # 마크다운 에디터
│           ├── EditorToolbar.tsx           # 에디터 툴바
│           └── ImageUploadPlugin.tsx       # 이미지 업로드 플러그인
│
├── hooks/
│   └── community/
│       ├── useBoards.ts                    # 게시판 데이터
│       ├── usePosts.ts                     # 게시글 데이터
│       ├── usePost.ts                      # 단일 게시글
│       ├── useComments.ts                  # 댓글 데이터
│       ├── useAttachments.ts               # 첨부파일
│       ├── useSearch.ts                    # 검색
│       ├── useNotifications.ts             # 알림
│       └── useCommunityStats.ts            # 통계
│
├── stores/
│   └── community/
│       └── communityStore.ts               # 커뮤니티 상태
│
├── types/
│   └── community.ts                        # 타입 정의
│
└── lib/
    └── community/
        ├── api.ts                          # API 함수
        ├── utils.ts                        # 유틸리티
        └── constants.ts                    # 상수
```

---

### 3.2 핵심 페이지 UI

#### 3.2.1 커뮤니티 메인 페이지

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📋 커뮤니티                                            🔔 알림  👤 프로필  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🔍 검색어를 입력하세요...                              [검색]      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  📢 공지사항                                              더보기 → │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  📌 [공지] 2025년 신규 서비스 안내             01.20  조회 152  │   │
│  │  │  📌 [공지] 시스템 점검 안내 (1/25)            01.18  조회 89   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │
│  │  💬 자유게시판   │ │  ❓ 질문답변     │ │  📁 자료실      │              │
│  │  ─────────────  │ │  ─────────────  │ │  ─────────────  │              │
│  │  전체 1,234     │ │  전체 567       │ │  전체 89        │              │
│  │  오늘 +12       │ │  오늘 +5        │ │  오늘 +2        │              │
│  │                 │ │                 │ │                 │              │
│  │  • 최근글 제목1 │ │  • 최근글 제목1 │ │  • 최근글 제목1 │              │
│  │  • 최근글 제목2 │ │  • 최근글 제목2 │ │  • 최근글 제목2 │              │
│  │  • 최근글 제목3 │ │  • 최근글 제목3 │ │  • 최근글 제목3 │              │
│  │                 │ │                 │ │                 │              │
│  │  [바로가기 →]   │ │  [바로가기 →]   │ │  [바로가기 →]   │              │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘              │
│                                                                             │
│  ┌─────────────────────────────────────┐ ┌──────────────────────────────┐ │
│  │  🏷️ 인기 태그                        │ │  📊 오늘의 통계               │ │
│  │                                     │ │                              │ │
│  │  #독성시험 #GLP #효력 #견적문의     │ │  새 글: 19  댓글: 45         │ │
│  │  #OECD #계약 #일정 #보고서         │ │  방문자: 127                 │ │
│  └─────────────────────────────────────┘ └──────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.2.2 게시글 목록 페이지

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  💬 자유게시판                                                 [글쓰기 ✏️] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ [전체] [일반] [정보공유] [잡담]           🔍 검색...    [정렬 ▼]      │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  📌 [공지] 자유게시판 이용 규칙 안내                                  │ │
│  │     관리자 · 01.15 · 조회 234                                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  번호 │ [카테고리] 제목                     │ 작성자 │ 날짜  │ 조회 │ 좋아요│ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │  125  │ [정보공유] GLP 시험 관련 질문이 있습니다 💬12   │ 김연구 │ 01.20 │ 89  │ 5   │ │
│  │  124  │ [일반] 신년 인사드립니다 🖼️                    │ 익명   │ 01.19 │ 156 │ 12  │ │
│  │  123  │ [잡담] 오늘 날씨가 정말 춥네요                  │ 박담당 │ 01.19 │ 45  │ 3   │ │
│  │  122  │ [정보공유] 독성시험 가이드라인 공유 📎         │ 이과장 │ 01.18 │ 203 │ 15  │ │
│  │  121  │ [일반] 첫 글 작성합니다                        │ 최신입 │ 01.18 │ 67  │ 2   │ │
│  │  ...  │                                                │        │       │     │     │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    ← 1  2  3  4  5  6  7  8  9  10 →                  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  💬 = 댓글 있음   🖼️ = 이미지 있음   📎 = 첨부파일 있음                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.2.3 게시글 상세 페이지

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  💬 자유게시판                                                    [목록]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │  [정보공유] GLP 시험 관련 질문이 있습니다                             │ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │  👤 김연구 · 연구개발팀 · 01.20 14:30                           │ │ │
│  │  │  조회 89 · 좋아요 5 · 댓글 12                                   │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  ─────────────────────────────────────────────────────────────────── │ │
│  │                                                                       │ │
│  │  안녕하세요, GLP 시험 관련하여 몇 가지 질문이 있어서 글 올립니다.    │ │
│  │                                                                       │ │
│  │  1. 28일 반복투여독성시험에서 회복군 설정 기준이 궁금합니다.         │ │
│  │  2. 위성군 설정은 어떤 경우에 필요한가요?                            │ │
│  │  3. 보고서 작성 시 주의사항이 있을까요?                              │ │
│  │                                                                       │ │
│  │  선배님들의 조언 부탁드립니다. 🙏                                     │ │
│  │                                                                       │ │
│  │  ─────────────────────────────────────────────────────────────────── │ │
│  │                                                                       │ │
│  │  🏷️ #GLP #독성시험 #반복투여 #회복군                                  │ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │  📎 첨부파일 (1)                                                │ │ │
│  │  │  📄 참고자료.pdf (2.3MB)                          [다운로드]    │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │  [👍 좋아요 5]  [👎 싫어요 0]  [⭐ 북마크]  [🔗 공유]  [⚠️ 신고] │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  [수정]  [삭제]                                                       │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  💬 댓글 12개                                          [최신순 ▼]    │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │  👤 이과장 · 01.20 15:10                              [👍 3]    │ │ │
│  │  │                                                                 │ │ │
│  │  │  회복군은 일반적으로 고용량군과 대조군에 설정합니다.            │ │ │
│  │  │  약물의 독성이 가역적인지 확인하기 위한 목적이에요.             │ │ │
│  │  │                                                                 │ │ │
│  │  │  [답글]  [신고]                                                 │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │    ┌───────────────────────────────────────────────────────────────┐ │ │
│  │    │  ↳ 👤 김연구 · 01.20 15:25                          [👍 1]   │ │ │
│  │    │    @이과장 감사합니다! 그럼 회복기간은 보통 얼마나...        │ │ │
│  │    │    [답글]  [신고]                                            │ │ │
│  │    └───────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │  👤 박담당 · 01.20 16:00                              [👍 2]    │ │ │
│  │  │  위성군은 독성동태학 평가가 필요한 경우에 설정해요...          │ │ │
│  │  │  [답글]  [신고]                                                 │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  [더보기...]                                                          │ │
│  │                                                                       │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │  댓글 작성                                                      │ │ │
│  │  │  ┌─────────────────────────────────────────────────────────┐   │ │ │
│  │  │  │                                                         │   │ │ │
│  │  │  │  댓글을 입력하세요...                                   │   │ │ │
│  │  │  │                                                         │   │ │ │
│  │  │  └─────────────────────────────────────────────────────────┘   │ │ │
│  │  │  ☐ 익명으로 작성                                    [등록]    │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  ← 이전글: [일반] 신년 인사드립니다                                   │ │
│  │  → 다음글: [잡담] 오늘 날씨가 정말 춥네요                             │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.2.4 글쓰기 페이지

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ✏️ 글쓰기                                              [임시저장] [등록]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  게시판: [자유게시판 ▼]     카테고리: [정보공유 ▼]                         │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  제목을 입력하세요                                                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  [B] [I] [U] [S] │ [H1] [H2] [H3] │ [•] [1.] │ [🔗] [🖼️] [📎] │ [코드]  │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │                                                                       │ │
│  │                                                                       │ │
│  │                                                                       │ │
│  │                     내용을 입력하세요...                              │ │
│  │                                                                       │ │
│  │                                                                       │ │
│  │                                                                       │ │
│  │                                                                       │ │
│  │                                                                       │ │
│  │                                                                       │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  태그: ┌─────────────────────────────────────────────────────────────────┐ │
│        │ #GLP  #독성시험  ✕  [+ 태그 추가]                              │ │
│        └─────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  첨부파일: ┌─────────────────────────────────────────────────────────────┐ │
│            │                                                             │ │
│            │   📎 파일을 드래그하거나 클릭하여 업로드하세요              │ │
│            │      (최대 5개, 각 10MB 이하)                               │ │
│            │                                                             │ │
│            │   📄 참고자료.pdf (2.3MB)                         [삭제]    │ │
│            │                                                             │ │
│            └─────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ☐ 익명으로 작성      ☐ 공지로 등록 (관리자)                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.2.5 관리자 - 통계 대시보드

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 커뮤니티 관리 > 통계                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  기간: [최근 7일 ▼]  [2025.01.14 ~ 2025.01.20]                             │
│                                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ 새 글    │ │ 댓글     │ │ 조회수   │ │ 활성사용자│ │ 신고대기 │         │
│  │   47    │ │   156   │ │  2,340  │ │    89    │ │    3    │         │
│  │  ▲ 12%  │ │  ▲ 8%  │ │  ▲ 15%  │ │  ▼ 3%   │ │         │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                             │
│  ┌────────────────────────────────────┐ ┌──────────────────────────────┐   │
│  │  📈 일별 활동 추이                  │ │  📊 게시판별 분포            │   │
│  │                                    │ │                              │   │
│  │  20│      ╭──╮                     │ │  자유게시판 ████████ 65%    │   │
│  │    │   ╭──╯  ╰──╮  ╭──╮           │ │  질문답변   ███ 20%         │   │
│  │  10│ ──╯        ╰──╯  ╰──         │ │  자료실     ██ 10%          │   │
│  │    ├──┬──┬──┬──┬──┬──┬──          │ │  공지사항   █ 5%            │   │
│  │      월  화  수  목  금  토  일     │ │                              │   │
│  │                                    │ │                              │   │
│  │  ─ 게시글  ─ 댓글                  │ │                              │   │
│  └────────────────────────────────────┘ └──────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🔥 인기 게시글 (조회수 기준)                                        │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  1. [정보공유] 2025년 GLP 가이드라인 변경사항 정리      조회 523    │   │
│  │  2. [일반] 신년 인사드립니다                            조회 312    │   │
│  │  3. [정보공유] 독성시험 체크리스트 공유합니다           조회 289    │   │
│  │  4. [잡담] 설 연휴 계획 있으신가요?                     조회 201    │   │
│  │  5. [정보공유] GLP 시험 관련 질문이 있습니다            조회 189    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  👥 활발한 사용자                                                    │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  1. 이과장 - 글 8개, 댓글 23개                                       │   │
│  │  2. 김연구 - 글 5개, 댓글 19개                                       │   │
│  │  3. 박담당 - 글 4개, 댓글 15개                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                                              [PDF 다운로드]  [Excel 내보내기] │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.3 핵심 컴포넌트 Props

```typescript
// 게시글 목록
interface PostListProps {
  boardSlug: string;
  category?: string;
  initialPosts?: Post[];
}

// 게시글 에디터
interface PostEditorProps {
  boardId: string;
  post?: Post;                // 수정 시
  onSubmit: (data: PostFormData) => Promise<void>;
  onCancel: () => void;
}

interface PostFormData {
  categoryId?: string;
  title: string;
  content: string;
  tags: string[];
  attachmentIds: string[];
  isAnonymous: boolean;
  status: 'DRAFT' | 'PUBLISHED';
}

// 댓글 목록
interface CommentListProps {
  postId: string;
  initialComments?: Comment[];
  allowAnonymous: boolean;
}

// 파일 업로더
interface FileUploaderProps {
  maxFiles: number;
  maxFileSize: number;        // MB
  acceptedTypes?: string[];   // MIME types
  onUpload: (attachments: Attachment[]) => void;
  onError: (error: string) => void;
}

// 검색바
interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  showSuggestions?: boolean;
}

// 알림 벨
interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
}
```

---

### 3.4 에디터 선택

| 옵션 | 장점 | 단점 | 추천 |
|------|------|------|------|
| **TipTap** | 가볍고 확장성 좋음, React 친화적 | 고급 기능 직접 구현 | ⭐ 추천 |
| **Quill** | 쉬운 사용, 기능 풍부 | 번들 크기 큼, 커스터마이징 어려움 | 🔵 |
| **Toast UI Editor** | 마크다운 + WYSIWYG | 한글 친화적 | 🔵 |
| **CKEditor** | 엔터프라이즈급 | 라이선스, 무거움 | ⚪ |

**추천: TipTap** - 가볍고 Next.js와 잘 맞음

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link
```

---

*다음: 기능별 상세 명세*
# CHEMON 커뮤니티 모듈 - 기능별 상세 명세

---

## 4. 기능별 상세 명세

### 4.1 게시판 기본 구성

| 게시판 | 슬러그 | 타입 | 작성 권한 | 설명 |
|--------|--------|------|----------|------|
| 공지사항 | notice | NOTICE | ADMIN | 전체 공지 |
| 자유게시판 | free | FREE | USER | 일반 게시판 |
| 질문답변 | qna | QNA | USER | Q&A |
| 자료실 | resource | RESOURCE | USER | 파일 중심 |

### 4.2 게시글 작성 규칙

| 항목 | 제한 |
|------|------|
| 제목 | 2~100자 |
| 내용 | 10~50,000자 |
| 태그 | 최대 10개 |
| 첨부파일 | 게시판 설정 따름 |

### 4.3 댓글 구조

```
댓글 (depth: 0)
├── 대댓글 (depth: 1)
├── 대댓글 (depth: 1)
└── 대댓글 (depth: 1)

* 최대 1단계 (대대댓글 X)
* 멘션 지원: @[이름](userId)
```

### 4.4 조회수 중복 방지

- 로그인: userId 기준, 30분 쿨다운
- 비로그인: IP 기준 (선택적)

### 4.5 파일 업로드

**지원 형식**:
- 이미지: jpg, png, gif, webp
- 문서: pdf, doc, docx, xls, xlsx, ppt, pptx
- 기타: zip, txt, csv

**이미지 처리**:
- 썸네일 생성 (300x300)
- 최대 1920px 리사이징

### 4.6 검색

- PostgreSQL LIKE 또는 Full-Text Search
- 제목 + 내용 검색
- 하이라이트 표시

### 4.7 알림 트리거

| 이벤트 | 수신자 |
|--------|--------|
| 내 글에 댓글 | 글 작성자 |
| 내 댓글에 답글 | 댓글 작성자 |
| 멘션 | 멘션된 사용자 |
| 공지사항 | 전체 (선택) |

### 4.8 신고 처리

```
PENDING → REVIEWED → RESOLVED / DISMISSED
```

**처리 액션**: 숨김, 삭제, 경고, 정지

### 4.9 통계

- 일별 집계 (Cron)
- 게시글/댓글/조회수/활성사용자
- 게시판별 통계

---

## 5. 보안

- XSS: DOMPurify로 HTML 정제
- Rate Limit: 게시글 5/분, 댓글 10/분
- 권한: 작성자/관리자만 수정/삭제

---

## 6. 구현 일정

| Phase | 기간 | 내용 |
|-------|------|------|
| 1 | 1-2주 | 게시판/게시글/댓글 CRUD |
| 2 | 1주 | 파일, 좋아요, 태그, 검색 |
| 3 | 1주 | 알림, 신고, 통계, 관리자 |
| 4 | 1주 | 고도화, 최적화 |

---

## 7. 기술 스택

| 기능 | 라이브러리 |
|------|-----------|
| 에디터 | TipTap |
| 파일 업로드 | react-dropzone |
| 이미지 처리 | sharp |
| HTML 정제 | DOMPurify |

---

*문서 끝*
