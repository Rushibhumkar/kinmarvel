// src/hooks/comments/useCommentMutations.ts
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {myConsole} from '../../utils/myConsole';
import {
  likeUnlikeCommentFunc,
  patchCommentFunc,
  postCommentFunc,
} from '../../api/postComment/postCommentFunc';

/* ===========================
   HOOK: Create a new comment
   =========================== */
// Title: useCreateComment
export function useCreateComment({postId, limit = 10}: any) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({content}: any) => postCommentFunc({postId, content}),
    onSuccess: (data: any) => {
      qc.invalidateQueries({queryKey: ['postComments', postId, limit]});
    },
    onError: (err: any) => myConsole('[useCreateComment] error', err),
  });
}

/* ===========================
   HOOK: Edit/Delete a comment
   =========================== */
// Title: usePatchComment
export function usePatchComment({postId, limit = 10}: any) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({commentId, action, content}: any) =>
      patchCommentFunc({commentId, action, content}),
    onSuccess: (data: any) => {
      qc.invalidateQueries({queryKey: ['postComments', postId, limit]});
    },
    onError: (err: any) => myConsole('[usePatchComment] error', err),
  });
}

/* ===========================
   HOOK: Like/Unlike a comment
   =========================== */
// Title: useLikeUnlikeComment
export function useLikeUnlikeComment({postId, limit = 10}: any) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({commentId, action}: any) =>
      likeUnlikeCommentFunc({commentId, action}),
    onSuccess: (data: any) => {
      qc.invalidateQueries({queryKey: ['postComments', postId, limit]});
    },
    onError: (err: any) => myConsole('[useLikeUnlikeComment] error', err),
  });
}
