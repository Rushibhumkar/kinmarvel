import {useQuery} from '@tanstack/react-query';
import {myConsole} from '../../utils/myConsole';
import {API_AXIOS} from '../axiosInstance';

/* ===========================
   POST: Create a comment
   =========================== */
export async function postCommentFunc({postId, content}: any) {
  const url = `/post/${encodeURIComponent(String(postId))}/comments`;
  const payload = {content};

  try {
    myConsole('[postCommentFunc] -> POST', {url, payload});
    const {data} = await API_AXIOS.post(url, payload);
    myConsole('[postCommentFunc] <- RESPONSE', data);
    return data;
  } catch (error: any) {
    const status = error?.response?.status;
    const errData = error?.response?.data;
    myConsole('[postCommentFunc] !! ERROR', {status, errData});
    throw error;
  }
}

/*
POST {{baseurl}}/post/:postId/comments
{
    "content":"@iirohit_ nice 💖🔥"
}
*/
/*
{
"success": true,
  "message": "Comment added to the post",
  "comment": {
    "by": "67bad2233dc936e19caf2cb6",
    "post": "6899e50dbbbb474f0ca5d937",
    "content": "@iirohit_ nice 💖🔥",
    "hashTags": [],
    "likes": [],
    "likeCount": 0,
    "replyCount": 0,
    "tags": [],
    "isDeleted": false,
    "isEdited": false,
    "mentionedUsers": [],
    "reportCount": 0,
    "_id": "68c069be8641c2189a3e8f09",
    "replies": [],
    "reports": [],
    "createdAt": "2025-09-09T17:54:06.779Z",
    "updatedAt": "2025-09-09T17:54:06.779Z",
    "__v": 0
  }
}
*/

/* ===========================
   GET: Post comments (with pagination)
   =========================== */

export async function getPostCommentsFunc({postId, page = 1, limit = 10}: any) {
  const url = `/post/${encodeURIComponent(String(postId))}/comments`;
  const params: any = {page, limit};

  try {
    const {data} = await API_AXIOS.get(url, {params});
    return data;
  } catch (error: any) {
    const status = error?.response?.status;
    const errData = error?.response?.data;
    myConsole('[getPostCommentsFunc] !! ERROR', {status, errData});
    throw error;
  }
}

export function usePostComments(postId: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: ['postComments', postId, page, limit],
    queryFn: () => getPostCommentsFunc({postId, page, limit}),
    keepPreviousData: true, // This is valid here in recent versions
    staleTime: 1000 * 60 * 5,
  });
}

/*
GET {{baseurl}}/post/:postId/comments?page=1&limit=10
*/

/*
{
    "success": true,
    "message": "success",
    "data": {
        "comments": [
            {
                "_id": "68c069be8641c2189a3e8f09",
                "by": {
                    "_id": "67bad2233dc936e19caf2cb6",
                    "firstName": "Rushi",
                    "lastName": "Bhumkar",
                    "profileImageUrl": "https://fameely-backend.onrender.com/api/file/fetch/1748188074273_YfXi6T4V.jpg",
                    "userName": "ruhsi1233"
                },
                "post": "6899e50dbbbb474f0ca5d937",
                "content": "@iirohit_ nice 💖🔥",
                "hashTags": [],
                "likes": [],
                "likeCount": 0,
                "replyCount": 0,
                "tags": [],
                "isDeleted": false,
                "isEdited": false,
                "mentionedUsers": [],
                "reportCount": 0,
                "replies": [],
                "reports": [],
                "createdAt": "2025-09-09T17:54:06.779Z",
                "updatedAt": "2025-09-09T17:54:06.779Z",
                "__v": 0
            },
            {
                "_id": "68beb6def8be1d48db1f8dcd",
                "by": {
                    "_id": "67c5dfb2c787330a96ff3206",
                    "firstName": "Rohit",
                    "lastName": "Barate",
                    "userName": "rohit123"
                },
                "post": "6899e50dbbbb474f0ca5d937",
                "content": "@iirohit._ nice 💖🔥",
                "hashTags": [],
                "likes": [],
                "likeCount": 0,
                "replyCount": 2,
                "tags": [
                    "iirohit._"
                ],
                "isDeleted": false,
                "isEdited": false,
                "mentionedUsers": [
                    "68b821d2125472dba6fbda88"
                ],
                "reportCount": 0,
                "replies": [
                    {
                        "by": {
                            "_id": "67c5dfb2c787330a96ff3206",
                            "firstName": "Rohit",
                            "lastName": "Barate"
                        },
                        "content": "thanks bro 💖",
                        "likes": [],
                        "likeCount": 0,
                        "isEdited": true,
                        "replyTo": "67c5dfb2c787330a96ff3206",
                        "isDeleted": false,
                        "mentionedUsers": [],
                        "reports": [],
                        "reportCount": 0,
                        "_id": "68beedba6b85bdc7da82edb1",
                        "createdAt": "2025-09-08T14:52:42.818Z",
                        "updatedAt": "2025-09-08T18:56:45.886Z"
                    },
                    {
                        "by": {
                            "_id": "67c5dfb2c787330a96ff3206",
                            "firstName": "Rohit",
                            "lastName": "Barate"
                        },
                        "content": "thanks @ruhsi1233",
                        "likes": [],
                        "likeCount": 0,
                        "isEdited": false,
                        "replyTo": "67c5dfb2c787330a96ff3206",
                        "isDeleted": false,
                        "mentionedUsers": [
                            "67bad2233dc936e19caf2cb6"
                        ],
                        "reports": [],
                        "reportCount": 0,
                        "_id": "68beee1d6b85bdc7da82edb8",
                        "createdAt": "2025-09-08T14:54:21.197Z",
                        "updatedAt": "2025-09-08T19:19:26.081Z"
                    }
                ],
                "reports": [],
                "createdAt": "2025-09-08T10:58:38.507Z",
                "updatedAt": "2025-09-08T19:19:26.082Z",
                "__v": 6
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 10,
            "total": 6,
            "totalPages": 1
        }
    }
}
*/

/* ===========================
   PATCH: Edit / Delete a comment
   =========================== */

export async function patchCommentFunc({commentId, action, content}: any) {
  const url = `/comments/${encodeURIComponent(String(commentId))}`;
  const payload: any = {action};

  // If editing, server expects content
  if (String(action).toLowerCase() === 'edit') {
    if (!content) {
      myConsole('[patchCommentFunc] !! ERROR', {
        reason: 'content is required when action=edit',
      });
      throw new Error('content is required when action=edit');
    }
    payload.content = content;
  }

  try {
    myConsole('[patchCommentFunc] -> PATCH', {url, payload});
    const {data} = await API_AXIOS.patch(url, payload);
    myConsole('[patchCommentFunc] <- RESPONSE', data);
    return data;
  } catch (error: any) {
    const status = error?.response?.status;
    const errData = error?.response?.data;
    myConsole('[patchCommentFunc] !! ERROR', {status, errData});
    throw error;
  }
}

// {
//     "action":"delete", // edit | delete
//     "content":"@iirohit._ nice bro 💖🔥"   // content is required when "action"=edit
// }

// {
//     "success": true,
//     "message": "Comment deleted"
// }

/* ===========================
   PATCH: Like / Unlike a comment
   =========================== */
export async function likeUnlikeCommentFunc({commentId, action}: any) {
  const url = `/comments/${encodeURIComponent(String(commentId))}/like`;
  const normalized = String(action).toLowerCase();

  if (normalized !== 'like' && normalized !== 'unlike') {
    throw new Error("action must be 'like' or 'unlike'");
  }

  const payload: any = {action: normalized};

  try {
    myConsole('[likeUnlikeCommentFunc] -> PATCH', {url, payload});
    const {data} = await API_AXIOS.patch(url, payload);
    myConsole('[likeUnlikeCommentFunc] <- RESPONSE', data);
    return data;
  } catch (error: any) {
    const status = error?.response?.status;
    const errData = error?.response?.data;
    myConsole('[likeUnlikeCommentFunc] !! ERROR', {status, errData});
    throw error;
  }
}

// {
//     "action":"like"// like | unlike
// }

// {
//     "success": true,
//     "message": "Comment liked",
//     "likeCount": 1
// }

/* ===========================
   POST: Reply to a comment
   =========================== */

export async function postReplyToCommentFunc({
  commentId,
  content,
  replyTo = null,
}: any) {
  const url = `/comments/${encodeURIComponent(String(commentId))}/replies`;
  const payload: any = {content};
  if (replyTo !== undefined) payload.replyTo = replyTo;

  try {
    myConsole('[postReplyToCommentFunc] -> POST', {url, payload});
    const {data} = await API_AXIOS.post(url, payload);
    myConsole('[postReplyToCommentFunc] <- RESPONSE', data);
    return data; // { success, message, reply }
  } catch (error: any) {
    const status = error?.response?.status;
    const errData = error?.response?.data;
    myConsole('[postReplyToCommentFunc] !! ERROR', {status, errData});
    throw error;
  }
}

// POST {{baseurl}}/comments/:commentId/replies
// {
//   "content": "thanks @ruhsi1233",
//   "replyTo": "67c5dfb2c787330a96ff3206" // or null
// }

// {
//   "success": true,
//   "message": "Reply added",
//   "reply": {
//     "by": "67c5dfb2c787330a96ff3206",
//     "content": "thanks @ruhsi1233",
//     "replyTo": "67bad2233dc936e19caf2cb6",
//     "mentionedUsers": ["67bad2233dc936e19caf2cb6"],
//     "likes": [],
//     "likeCount": 0,
//     "isEdited": false,
//     "isDeleted": false,
//     "reports": [],
//     "reportCount": 0
//   }
// }

/* ===========================
   PATCH: Edit or Delete Comment Reply API
   =========================== */

export async function patchCommentReplyFunc({
  commentId,
  replyId,
  action,
  content,
}: any) {
  const url = `/comments/${encodeURIComponent(
    String(commentId),
  )}/replies/${encodeURIComponent(String(replyId))}`;
  const normalized = String(action).toLowerCase();

  if (normalized !== 'edit' && normalized !== 'delete') {
    throw new Error("action must be 'edit' or 'delete'");
  }

  const payload: any = {action: normalized};
  if (normalized === 'edit') {
    if (!content) throw new Error('content is required when action=edit');
    payload.content = content;
  }

  try {
    myConsole('[patchCommentReplyFunc] -> PATCH', {url, payload});
    const {data} = await API_AXIOS.patch(url, payload);
    myConsole('[patchCommentReplyFunc] <- RESPONSE', data);
    return data; // { success, message, reply }
  } catch (error: any) {
    const status = error?.response?.status;
    const errData = error?.response?.data;
    myConsole('[patchCommentReplyFunc] !! ERROR', {status, errData});
    throw error;
  }
}

// PATCH {{baseurl}}/comments/:commentId/replies/:replyId
// {
//   "action": "edit", // edit | delete
//   "content": "thanks bro 💖" // required when action=edit
// }

// {
//   "success": true,
//   "message": "Reply editd",
//   "reply": {
//     "by": "67c5dfb2c787330a96ff3206",
//     "content": "thanks bro 💖",
//     "likes": [],
//     "likeCount": 0,
//     "isEdited": true,
//     "replyTo": "67c5dfb2c787330a96ff3206",
//     "isDeleted": false,
//     "mentionedUsers": [],
//     "reports": [],
//     "reportCount": 0,
//     "_id": "68beedba6b85bdc7da82edb1",
//     "createdAt": "2025-09-08T14:52:42.818Z",
//     "updatedAt": "2025-09-08T18:56:45.886Z"
//   }
// }

/* ===========================
   PATCH: Like or Unlike Comment Reply API
   =========================== */

export async function likeUnlikeCommentReplyFunc({
  commentId,
  replyId,
  action,
}: any) {
  const url = `/comments/${encodeURIComponent(
    String(commentId),
  )}/replies/${encodeURIComponent(String(replyId))}/like`;
  const normalized = String(action).toLowerCase();

  if (normalized !== 'like' && normalized !== 'unlike') {
    throw new Error("action must be 'like' or 'unlike'");
  }

  const payload: any = {action: normalized};

  try {
    myConsole('[likeUnlikeCommentReplyFunc] -> PATCH', {url, payload});
    const {data} = await API_AXIOS.patch(url, payload);
    myConsole('[likeUnlikeCommentReplyFunc] <- RESPONSE', data);
    return data; // { success, message, likeCount }
  } catch (error: any) {
    const status = error?.response?.status;
    const errData = error?.response?.data;
    myConsole('[likeUnlikeCommentReplyFunc] !! ERROR', {status, errData});
    throw error;
  }
}

// {
//     "action":"like"// like | unlike
// }

// {
//     "success": true,
//     "message": "Reply liked",
//     "likeCount": 1
// }

/* ===========================
   GET: Comment replies (with pagination)
   =========================== */
export async function getCommentRepliesFunc({
  commentId,
  page = 1,
  limit = 10,
}: any) {
  const url = `/comments/${encodeURIComponent(String(commentId))}/replies`;
  const params: any = {page, limit};
  try {
    const {data} = await API_AXIOS.get(url, {params});
    myConsole('[getCommentRepliesFunc] <- RESPONSE', data);
    return data;
  } catch (error: any) {
    const status = error?.response?.status;
    const errData = error?.response?.data;
    myConsole('[getCommentRepliesFunc] !! ERROR', {status, errData});
    throw error;
  }
}
