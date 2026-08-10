// مسیر فایل: lib/stories/storyVideoLimits.ts
// **کپیِ عینیِ** src/lib/stories/storyVideoLimits.ts وب — دقیقاً هم‌الگو با
// lib/vip/vipStatus.ts موبایل (که خودش کپیِ عینیِ src/lib/vip/vipStatus.ts وب است): تک‌نقطه‌ی
// حقیقتِ «سقفِ مدت‌زمانِ ویدئوی استوری بر اساسِ VIP» باید در وب و موبایل هم‌معنا بماند. هیچ
// منطقی اینجا نباید تغییر کند؛ اگر روزی سقف‌ها در وب عوض شوند، این فایل هم باید دستی هم‌گام شود
// (همان وظیفه‌ی نگهداریِ کوچک و مستندی که یادداشتِ خودِ vipStatus.ts موبایل توضیح داده).
export const STORY_VIDEO_MAX_DURATION_SECONDS_FREE = 15;
export const STORY_VIDEO_MAX_DURATION_SECONDS_VIP = 30;

export function getStoryVideoMaxDurationSeconds(isVip: boolean): number {
  return isVip ? STORY_VIDEO_MAX_DURATION_SECONDS_VIP : STORY_VIDEO_MAX_DURATION_SECONDS_FREE;
}