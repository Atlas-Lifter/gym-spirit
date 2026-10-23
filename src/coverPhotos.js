// 전설 루틴 카드 표지 사진 (사용자가 제공·사용 허락받은 이미지). 원본은 cover-sources/, 줄인 파일은 public/covers/
const LEGEND_IDS = ['leg_ronnie', 'leg_jay', 'leg_arnold', 'leg_cbum', 'k_park', 'k_kim_gw', 'k_jang', 'k_kim_km'];

export const DEFAULT_COVER_PHOTOS = Object.fromEntries(LEGEND_IDS.map(id => [id, `covers/${id}.jpg`]));
