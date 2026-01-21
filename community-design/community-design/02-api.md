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
