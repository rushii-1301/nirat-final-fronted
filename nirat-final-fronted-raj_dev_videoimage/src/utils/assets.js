import { toast } from 'react-toastify';

// Simple registry to map keys to static asset paths (e.g., PNGs in /public)

const assetRegistry = {
  // Logos
  inailogo_dark: '/inai-logo-dark.png',
  inailogo_light: '/inai-logo-light.png',
  Model: '/Model.png',
  Principle: '/Principle.png',
  student_login: '/student.png',

  // Icons
  chapter_dark: '/Icons/chapter-dark.png',
  chapter_light: '/Icons/chapter-light.png',
  student: '/Icons/student.png',
  lecture: '/Icons/lecture.png',
  Add: '/Icons/Add.png',
  Eyes_dark: '/Icons/Eyes-dark.png',
  Eyes_light: '/Icons/Eyes-light.png',
  home_dark: '/Icons/home-dark.png',
  home_light: '/Icons/home-light.png',
  current_home_light: '/Icons/cuurent-home-light.png',
  filter_dark: '/Icons/filter-dark.png',
  filter_light: '/Icons/filter-light.png',
  current_filter_light: '/Icons/current-filter-light.png',
  edit_dark: '/Icons/edit-dark.png',
  edit_light: '/Icons/edit-light.png',
  delete_dark: '/Icons/delete-dark.png',
  delete_light: '/Icons/delete-light.png',
  add_student_dark: '/Icons/add_student-dark.png',
  add_student_light: '/Icons/add_student-light.png',
  current_add_student_light: '/Icons/current-add_student-light.png',
  user_dark: '/Icons/user-dark.png',
  lock_dark: '/Icons/lock-dark.png',
  lectureicon_dark: '/Icons/lectureicon_dark.png',
  play_dark: '/Icons/play-dark.png',
  share_dark: '/Icons/share_dark.png',
  add_dark: '/Icons/pluse-dark.png',
  filtering_dark: '/Icons/filtering-dark.png',
  book_dark: '/Icons/book-dark.png',
  book_light: '/Icons/book-light.png',
  current_book_light: '/Icons/current_book_light.png',
  addclass_dark: '/Icons/addclass-dark.png',
  share__dark: '/Icons/share-dark.png',
  delete_tranperant_dark: '/Icons/delete_tranperant-dark.png',
  video_dark: '/Icons/video-dark.png',
  video_light: '/Icons/video-light.png',
  current_video_light: '/Icons/current_video_light.png',
  upload_dark: '/Icons/upload-dark.png',
  send_dark: '/Icons/send-dark.png',
  Ai_dark: '/Icons/Ai-dark.png',
  lecturefilter_dark: '/Icons/lecturefilter-dark.png',
  lecturefilter_light: '/Icons/lecturefilter-light.png',
  home_tranperent_dark: '/Icons/home-tranperent-dark.png',
  home_tranperent_light: '/Icons/home_tranperent_light.png',
  current_home_tranperent_light: '/Icons/current_home_tranperent_light.png',
  playedleacher_dark: '/Icons/playedleacher_dark.png',
  playedleacher_light: '/Icons/playedleacher-light.png',
  current_playedleacher_light: '/Icons/current-playedleacher-light.png',
  share_trap_dark: '/Icons/share-trap-dark.png',
  share_trap_light: '/Icons/share_trap_light.png',
  current_share_trap_light: '/Icons/current_share_trap_light.png',
  addlecture_light: '/Icons/addlecture-light.png',
  addlecture_dark: '/Icons/addlecture_dark.png',
  q_dark: '/Icons/q&a-dark.png',
  q_light: '/Icons/q&a-light.png',
  chat_dark: '/Icons/chat-dark.png',
  chat_light: '/Icons/chat-light.png',
  current_chat_light: '/Icons/current_chat_light.png',
  lectureicon_light: '/Icons/lectureicon_light.png',
  profile_dark: '/Icons/profile-dark.png',
  profile_light: '/Icons/profile-light.png',
  current_profile_light: '/Icons/current_profile_light.png',
  books_dark: '/Icons/books-dark.png',
  subject_dark: '/Icons/subject-dark.png',
  book_name_dark: '/Icons/book_name-dark.png',
  uploadbook_dark: '/Icons/uploadbook-dark.png',
  chaptername_dark: '/Icons/chaptername-dark.png',
  topics_dark: '/Icons/topics-dark.png',
  books_light: '/Icons/books-light.png',
  subject_light: '/Icons/subject-light.png',
  book_name_light: '/Icons/book_name_light.png',
  uploadbook_light: '/Icons/uploadbook_light.png',
  chaptername_light: '/Icons/chaptername_light.png',
  topics_light: '/Icons/topics_light.png',
  clock_dark: '/Icons/clock_dark.png',
  clock_light: '/Icons/cloack-light.png',
  puchase_dark: '/Icons/puchase-dark.png',
  puchase_light: '/Icons/puchase_light.png',
  current_puchase_light: '/Icons/current_puchase_light.png',
  settings_light: '/Icons/settings-light.png',
  current_settings_light: '/Icons/current_settings_light.png',
  settings_dark: '/Icons/settings_dark.png',
  saved_dark: '/Icons/saved-dark.png',
  saved_light: '/Icons/saved_light.png',
  current_saved_light: '/Icons/current_saved_light.png',
  Alllectures_dark: '/Icons/Alllectures-dark.png',
  Alllectures_light: '/Icons/Alllectures-light.png',
  current_Alllectures_light: '/Icons/current-Alllectures-light.png',
  Generate_student_dark: '/Icons/generate-student-dark.png',
  Generate_student_light: '/Icons/generate-student-light.png',
  current_Generate_student_light: '/Icons/current_Generate_student_light.png',
  pending_lecture_dark: '/Icons/pending-lecture-dark.png',
  pending_lecture_light: '/Icons/pending-lecture-light.png',
  all_lecture_dark: '/Icons/all-lecture-dark.png',
  all_lecture_light: '/Icons/all-lecture-light.png',
  student_active_dark: '/Icons/student-active-dark.png',
  student_active_light: '/Icons/student-active-light.png',
  student_progress_dark: '/Icons/student-progress-dark.png',
  student_progress_light: '/Icons/student-progress-light.png',
  chatsend_dark: '/Icons/chatsend-dark.png',
  chatsend_light: '/Icons/chatsend-light.png',
  current_home_dark: '/Icons/current_home_dark.png',
  current_book_dark: '/Icons/current_book_dark.png',
  current_chat_dark: '/Icons/current_chat_dark.png',
  current_video_dark: '/Icons/current_video_dark.png',
  current_puchase_dark: '/Icons/current_puchase_dark.png',
  current_saved_dark: '/Icons/current_saved_dark.png',
  current_settings_dark: '/Icons/current_settings_dark.png',
  current_profile_dark: '/Icons/current_profile_dark.png',
  videolist_dark: '/Icons/videolist-darkkkkk.png',
  loop_video: '/Icons/loop_video.png',
  playvideospeed: '/Icons/playvideospeed.png',
  pdf_dark: '/Icons/pdf-dark.png',
  pdf_light: '/Icons/pdf-light.png',
  sharearrow_light: '/Icons/sharearrow-light.png',
  sharearrow_dark: '/Icons/sharearrow-dark.png'
}

export function registerAsset(key, path) {
  if (!key || typeof key !== 'string') return
  assetRegistry[key] = path
}

export function registerAssets(map) {
  if (!map || typeof map !== 'object') return
  for (const [k, v] of Object.entries(map)) {
    registerAsset(k, v)
  }
}

export function getAsset(key) {
  return assetRegistry[key] || null
}

export default {
  getAsset,
  registerAsset,
  registerAssets,
}


export const BACKEND_API_URL = import.meta.env.BACKEND_API_URL || 'https://api.edinai.inaiverse.com';

// export const Roshni_URL = "http://192.168.7.21:1171" || "https://api.edinai.inaiverse.com";

export const handlesuccess = (msg) => {
  toast.success(msg, {
    position: "top-right",
    autoClose: 2000
  })
}

export const handleerror = (msg) => {
  toast.error(msg, {
    position: "top-right",
    autoClose: 2000
  })
}


export const checkType = (type = 'member') => {

  // Decode JWT and store admin id from `sub` field, then check user_type
  // if (type === 'member' || type === 'admin') {
  //   return true;
  // }
  const token = localStorage.getItem('access_token') || '';
  if (!token) return false;

  try {

    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = atob(base64);
    const payload = JSON.parse(payloadJson || '{}');

    // Check expiry: exp is in seconds since epoch
    if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
      localStorage.clear();
      return false;
    }
    if (payload.user_type && payload.user_type !== type) {
      localStorage.clear();
      return false;
    }

    if (payload.sub) {
      type === 'admin'
        ? localStorage.setItem('admin_id', String(payload.sub))
        : localStorage.setItem('member_id', String(payload.sub));
    }

    // If user_type is present, ensure it matches expected type
  } catch (e) {
    console.error('Failed to decode JWT or validate type:', e);
    localStorage.clear();
    return false;
  }

  return true;
}





export const studentPortalAuth = (type) => {

  // Decode JWT and store admin id from `sub` field, then check user_type
  const token = localStorage.getItem('token') || '';
  if (!token) return false;

  try {

    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = atob(base64);
    const payload = JSON.parse(payloadJson || '{}');

    // Check expiry
    if (!payload || (payload.iat && payload.iat * 1000 < Date.now())) {
      localStorage.clear();
      return false;
    }

    if (payload.sub && payload.sub !== type) {
      localStorage.clear();
      return false;
    }

    if (payload.sub) {
      localStorage.setItem('enrolment_number', String(payload.enrollment_number));
    }

    // If user_type is present, ensure it matches expected type
  } catch (e) {
    console.error('Failed to decode JWT or validate type:', e);
    localStorage.clear();
    return false;
  }

  return true;
}


export const checkSuperadminAuth = () => {
  const token = localStorage.getItem('superadmin_token') || '';
  if (!token) return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = atob(base64);
    const payload = JSON.parse(payloadJson || '{}');

    // Check expiry: exp is in seconds since epoch
    if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
      localStorage.removeItem('superadmin_token');
      localStorage.removeItem('superadmin_user');
      return false;
    }

    // Check if sub field equals 'superadmin'
    if (payload.sub !== 'superadmin') {
      localStorage.removeItem('superadmin_token');
      localStorage.removeItem('superadmin_user');
      return false;
    }

    return true;
  } catch (e) {
    console.error('Failed to decode superadmin JWT:', e);
    localStorage.removeItem('superadmin_token');
    localStorage.removeItem('superadmin_user');
    return false;
  }
}

export const getAuthRedirectPath = (token) => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = atob(base64);
    const payload = JSON.parse(payloadJson || '{}');

    // Check expiry
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    const { user_type, work_type, role } = payload;

    // Admin
    if (user_type === 'admin' || role === 'admin') return '/Admin';

    // Member Roles
    if (user_type === 'member') {
      if (work_type === 'chapter') return '/chapter';
      if (work_type === 'student') return '/Student';
      if (work_type === 'lecture') return '/lecture';
    }

    return null;
  } catch (e) {
    return null;
  }
};