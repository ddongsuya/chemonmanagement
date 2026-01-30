'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
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

// Priority badge styles
const priorityStyles: Record<AnnouncementPriority, { bg: string; text: string; label: string; icon: typeof Megaphone }> = {
  URGENT: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: '긴급', icon: AlertTriangle },
  HIGH: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', label: '중요', icon: AlertTriangle },
  NORMAL: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: '공지', icon: Megaphone },
  LOW: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', label: '안내', icon: Info },
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
            <span className="font-medium text-sm">{comment.userName}</span>
            <span className="text-xs text-gray-400">{formatShortDate(comment.createdAt)}</span>
            {comment.createdAt !== comment.updatedAt && (
              <span className="text-xs text-gray-400">(수정됨)</span>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleUpdate} disabled={isSubmitting}>
                  <Check className="w-4 h-4 mr-1" />
                  저장
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-1" />
                  취소
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {comment.content}
              </p>
              
              <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {depth === 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
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
                    className="h-7 text-xs"
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
                    className="h-7 text-xs text-red-500 hover:text-red-600"
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
        <Card>
          <CardContent className="py-6">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-8" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">공지사항을 찾을 수 없습니다.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/announcements')}>
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
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          목록으로
        </Button>
      </Link>

      {/* Announcement Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', style.bg)}>
              <Icon className={cn('w-6 h-6', style.text)} />
            </div>
            <div>
              <Badge className={cn(style.bg, style.text, 'border-0 mb-1')}>
                {style.label}
              </Badge>
              <div className="flex items-center gap-3 text-sm text-gray-500">
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
          <CardTitle className="text-2xl">{announcement.title}</CardTitle>
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
            <span>작성자: {announcement.creatorName || '관리자'}</span>
            <span>작성일: {formatDate(announcement.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
            <Calendar className="w-3.5 h-3.5" />
            게시기간: {formatDate(announcement.startDate)} ~ {formatDate(announcement.endDate)}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="py-6">
          <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
            {announcement.content}
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            댓글 {totalComments > 0 && `(${totalComments})`}
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="py-6 space-y-6">
          {/* Comment Input */}
          <div className="space-y-3">
            {replyTo && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CornerDownRight className="w-4 h-4" />
                <span>답글 작성 중</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
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
                  className="min-h-[80px]"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || isSubmitting}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? '등록 중...' : '댓글 등록'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-10 h-10 mx-auto text-gray-300 mb-3" />
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
        </CardContent>
      </Card>
    </div>
  );
}
