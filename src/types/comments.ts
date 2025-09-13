// src/types/comments.ts

/* ===========================
   Core Entities
   =========================== */

export type ObjectId = string;

export type ActionEditDelete = 'edit' | 'delete';
export type ActionLikeUnlike = 'like' | 'unlike';

export interface UserLite {
  _id: ObjectId;
  firstName?: string;
  lastName?: string;
  fullName?: string; // sometimes provided
  userName?: string;
  profileImageUrl?: string;
}

export interface Reply {
  _id?: ObjectId; // may be absent on immediate "reply added" response, present on subsequent reads/edits
  by: UserLite | ObjectId;
  content: string;
  replyTo?: ObjectId | null; // user id being replied to
  mentionedUsers?: ObjectId[]; // user ids parsed from content
  likes: ObjectId[];
  likeCount: number;
  isEdited: boolean;
  isDeleted: boolean;
  reports?: any[];
  reportCount: number;
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
}

export interface Comment {
  _id: ObjectId;
  by: UserLite | ObjectId;
  post: ObjectId;
  content: string;
  hashTags: string[];
  likes: ObjectId[];
  likeCount: number;
  replyCount: number;
  tags: string[];
  isDeleted: boolean;
  isEdited: boolean;
  mentionedUsers: ObjectId[];
  reportCount: number;
  replies: Reply[];
  reports: any[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
  __v?: number;
  // optional client-only flags
  isLikedByMe?: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ===========================
   Request Payloads
   =========================== */

export interface CreateCommentPayload {
  postId: ObjectId;
  content: string;
}

export interface GetCommentsParams {
  postId: ObjectId;
  page?: number;
  limit?: number;
}

export interface PatchCommentPayload {
  commentId: ObjectId;
  action: ActionEditDelete;
  content?: string; // required when action = 'edit'
}

export interface LikeUnlikeCommentPayload {
  commentId: ObjectId;
  action: ActionLikeUnlike;
}

export interface PostReplyPayload {
  commentId: ObjectId;
  content: string;
  replyTo?: ObjectId | null;
}

export interface PatchReplyPayload {
  commentId: ObjectId;
  replyId: ObjectId;
  action: ActionEditDelete;
  content?: string; // required when action = 'edit'
}

export interface LikeUnlikeReplyPayload {
  commentId: ObjectId;
  replyId: ObjectId;
  action: ActionLikeUnlike;
}

/* ===========================
   API Response Shapes
   =========================== */

export interface ApiSuccessBase {
  success: boolean;
  message: string;
}

export interface CreateCommentResponse extends ApiSuccessBase {
  comment: Comment;
}

export interface GetPostCommentsResponse extends ApiSuccessBase {
  data: {
    comments: Comment[];
    pagination: Pagination;
  };
}

export interface PatchCommentResponse extends ApiSuccessBase {
  comment?: Comment; // delete may return only message
}

export interface LikeCommentResponse extends ApiSuccessBase {
  likeCount: number;
}

export interface PostReplyResponse extends ApiSuccessBase {
  reply: Reply;
}

export interface PatchReplyResponse extends ApiSuccessBase {
  reply?: Reply; // delete may return only message
}

export interface LikeReplyResponse extends ApiSuccessBase {
  likeCount: number;
}
