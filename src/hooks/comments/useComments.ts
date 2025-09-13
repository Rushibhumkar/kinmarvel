// src/hooks/comments/useComments.ts
import {useInfiniteQuery} from '@tanstack/react-query';
import {myConsole} from '../../utils/myConsole';
import {getPostCommentsFunc} from '../../api/postComment/postCommentFunc';

/* ===========================
   HOOK: Fetch & paginate comments for a post
   =========================== */
// Title: useComments
export function useComments({postId, limit = 10}: any) {
  const query = useInfiniteQuery({
    queryKey: ['postComments', postId, limit],
    queryFn: ({pageParam = 1}) =>
      getPostCommentsFunc({postId, page: pageParam, limit}),
    getNextPageParam: (lastPage: any) => {
      try {
        const page = lastPage?.data?.pagination?.page ?? 1;
        const totalPages = lastPage?.data?.pagination?.totalPages ?? 1;
        return page < totalPages ? page + 1 : undefined;
      } catch (e) {
        myConsole('[useComments] getNextPageParam error', e);
        return undefined;
      }
    },
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const flatComments =
    query.data?.pages?.flatMap((p: any) => p?.data?.comments ?? []) ?? [];

  return {
    ...query,
    comments: flatComments,
  };
}
