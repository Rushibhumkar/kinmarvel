// src/hooks/comments/useReplyMutations.ts
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {myConsole} from '../../utils/myConsole';
import {
  likeUnlikeCommentReplyFunc,
  patchCommentReplyFunc,
  postReplyToCommentFunc,
} from '../../api/postComment/postCommentFunc';

/* ===========================
   HOOK: Create a reply on a comment
   =========================== */
// Title: useCreateReply
export function useCreateReply({postId, limit = 10}: any) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({commentId, content, replyTo = null}: any) =>
      postReplyToCommentFunc({commentId, content, replyTo}),
    onSuccess: (data: any) => {
      myConsole('[useCreateReply] success', data);
      qc.invalidateQueries({queryKey: ['postComments', postId, limit]});
    },
    onError: (err: any) => myConsole('[useCreateReply] error', err),
  });
}

/* ===========================
   HOOK: Edit/Delete a reply
   =========================== */
// Title: usePatchReply
export function usePatchReply({postId, limit = 10}: any) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({commentId, replyId, action, content}: any) =>
      patchCommentReplyFunc({commentId, replyId, action, content}),
    onSuccess: (data: any) => {
      myConsole('[usePatchReply] success', data);
      qc.invalidateQueries({queryKey: ['postComments', postId, limit]});
    },
    onError: (err: any) => myConsole('[usePatchReply] error', err),
  });
}

/* ===========================
   HOOK: Like/Unlike a reply
   =========================== */
// Title: useLikeUnlikeReply
export function useLikeUnlikeReply({postId, limit = 10}: any) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({commentId, replyId, action}: any) =>
      likeUnlikeCommentReplyFunc({commentId, replyId, action}),
    onSuccess: (data: any) => {
      myConsole('[useLikeUnlikeReply] success', data);
      qc.invalidateQueries({queryKey: ['postComments', postId, limit]});
    },
    onError: (err: any) => myConsole('[useLikeUnlikeReply] error', err),
  });
}
