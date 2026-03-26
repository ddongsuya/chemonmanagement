'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StitchCard } from '@/components/ui/StitchCard';
import { StitchBadge } from '@/components/ui/StitchBadge';
import Skeleton from '@/components/ui/Skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import {
  Megaphone,
  AlertTriangle,
  Info,
  ArrowLeft,
  Eye,
  Calendar,
  MessageSquare,
  Send,
  CornerDownRight,
  Trash2,
  Edit2,
  X,
  Check,
} from 'lucide-react';
import {
  getAnnouncementById,
  getComments,
  createComment,
  updateComment,
  deleteComment,
  Announcement,
  Comment,
  AnnouncementPriority,
} from '@/lib/announcement-api';
import { cn } from '@/lib/utils';

// Priority badge styles (Stitch-compatible)
const priorityStyles: Record<AnnouncementPriority, { bg: string; text: string; label: string; icon: typeof Megaphone; variant: 'error' | 'warning' | 'info' | 'neutral' }> = {
  URGENT: { bg: 'bg-red-50', text: 'text-red-600', label: '긴급', icon: AlertTriangle, variant: 'error' },
  HIGH: { bg: 'bg-orange-50', text: 'text-orange-600', label: '중요', icon: AlertTriangle, variant: 'warning' },
  NORMAL: { bg: 'bg-blue-50', text: 'text-blue-600', label: '공지', icon: Megaphone, variant: 'info' },
  LOW: { bg: 'bg-slate-100', text: 'text-slate-600', label: '안내', icon: Info, variant: 'neutral' },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Comment Item Component
function CommentItem({
  comment,
  currentUserId,
  isAdmin,
  announcementId,
  onReply,
  onUpdate,
  onDelete,
  depth = 0,
}: {
  comment: Comment;
  currentUserId?: string;
  isAdmin: boolean;
  announcementId: string;
  onReply: (parentId: string) => void;
  onUpdate: () => void;
  onDelete: () => void;
  depth?: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const canEdit = comment.userId === currentUserId;
  const canDelete = comment.userId === currentUserId || isAdmin;

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await updateComment(announcementId, comment.id, editContent);
      if (response.success) {
        setIsEditing(false);
        onUpdate();
        toast({ title: '댓글이 수정되었습니다.' });
      }
    } catch (error) {
      toast({ title: '수정 실패', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    
    try {
      const response = await deleteComment(announcementId, comment.id);
      if (response.success) {
        onDelete();
        toast({ title: '댓글이 삭제되었습니다.' });
      }
    } catch (error) {
      toast({ title: '삭제 실패', variant: 'destructive' });
    }
  };

  return (
    <div className={cn('group', depth > 0 && 'ml-8 mt-3')}>
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarFallback className="bg-orange-100 text-orange-600 text-xs">
            {comment.userName.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-sm">{comment.userName}</span>
            <span className="text-xs text-slate-400">{formatShortDate(comment.createdAt)}</span>
            {comment.createdAt !== comment.updatedAt && (
              <span className="text-xs text-slate-400">(수정됨)</span>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px] bg-white rounded-xl focus:ring-2 focus:ring-primary/40"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleUpdate} disabled={isSubmitting} className="rounded-xl font-bold">
                  <Check className="w-4 h-4 mr-1" />
                  저장
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="rounded-xl font-bold">
                  <X className="w-4 h-4 mr-1" />
                  취소
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {comment.content}
              </p>
              
              <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {depth === 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs rounded-xl"
                    onClick={() => onReply(comment.id)}
                  >
                    <CornerDownRight className="w-3 h-3 mr-1" />
                    답글
                  </Button>
                )}
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs rounded-xl"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    수정
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-red-500 hover:text-red-600 rounded-xl"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    삭제
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3 mt-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              announcementId={announcementId}
              onReply={onReply}
              onUpdate={onUpdate}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AnnouncementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const id = params.id as string;

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [announcementRes, commentsRes] = await Promise.all([
        getAnnouncementById(id),
        getComments(id),
      ]);

      if (announcementRes.success && announcementRes.data) {
        setAnnouncement(announcementRes.data);
      }
      if (commentsRes.success && commentsRes.data) {
        setComments(commentsRes.data);
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '공지사항을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await createComment(id, newComment, replyTo);
      if (response.success) {
        setNewComment('');
        setReplyTo(null);
        fetchData(); // Refresh comments
        toast({ title: '댓글이 등록되었습니다.' });
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '댓글 등록에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <StitchCard variant="elevated" padding="lg">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-8" />
          <Skeleton className="h-32 w-full" />
        </StitchCard>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">공지사항을 찾을 수 없습니다.</p>
        <Button variant="ghost" className="mt-4 rounded-xl font-bold" onClick={() => router.push('/announcements')}>
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  const style = priorityStyles[announcement.priority];
  const Icon = style.icon;
  const totalComments = comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Link href="/announcements">
        <Button variant="ghost" size="sm" className="rounded-xl">
          <ArrowLeft className="w-4 h-4 mr-2" />
          목록으로
        </Button>
      </Link>

      {/* Announcement Content */}
      <StitchCard variant="elevated" padding="lg">
        {/* Header area */}
        <div className="flex items-center gap-3 mb-6">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', style.bg)}>
            <Icon className={cn('w-6 h-6', style.text)} />
          </div>
          <div>
            <StitchBadge variant={style.variant} className="mb-1">
              {style.label}
            </StitchBadge>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {announcement.viewCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {totalComments}
              </span>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight mb-2">{announcement.title}</h1>
        <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
          <span>작성자: {announcement.creatorName || '관리자'}</span>
          <span>작성일: {formatDate(announcement.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400 mt-1 mb-6">
          <Calendar className="w-3.5 h-3.5" />
          게시기간: {formatDate(announcement.startDate)} ~ {formatDate(announcement.endDate)}
        </div>

        {/* Content */}
        <div className="bg-[#FAF2E9] rounded-xl p-6">
          <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-slate-700">
            {announcement.content}
          </div>
        </div>
      </StitchCard>

      {/* Comments Section */}
      <StitchCard variant="surface-low" padding="lg">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
          <MessageSquare className="w-5 h-5 text-primary" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">COMMENTS</span>
          <span className="text-lg font-bold">{totalComments > 0 && `(${totalComments})`}</span>
        </h2>

        <div className="space-y-6">
          {/* Comment Input */}
          <div className="space-y-3">
            {replyTo && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CornerDownRight className="w-4 h-4" />
                <span>답글 작성 중</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 rounded-xl"
                  onClick={() => setReplyTo(null)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className="bg-orange-100 text-orange-600 text-xs">
                  {user?.name?.slice(0, 1) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="댓글을 입력하세요..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] bg-white rounded-xl focus:ring-2 focus:ring-primary/40"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || isSubmitting}
                    className="bg-gradient-to-r from-primary to-orange-400 rounded-xl font-bold"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? '등록 중...' : '댓글 등록'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Divider via tonal layering */}
          <div className="h-px bg-[#F5EDE3]" />

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p>아직 댓글이 없습니다.</p>
              <p className="text-sm">첫 번째 댓글을 남겨보세요!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={user?.id}
                  isAdmin={user?.role === 'ADMIN'}
                  announcementId={id}
                  onReply={(parentId) => setReplyTo(parentId)}
                  onUpdate={fetchData}
                  onDelete={fetchData}
                />
              ))}
            </div>
          )}
        </div>
      </StitchCard>
    </div>
  );
}
