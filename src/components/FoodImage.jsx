import React, { useState } from 'react';
import { FOOD_DB } from '../data/foods.js';

const HAS_PHOTO = new Set(FOOD_DB.filter(f => f.img).map(f => f.id));

// 음식 사진 (사진이 없거나 못 불러오면 이모지로)
export const FoodImage = ({ id, icon, className = 'w-12 h-12', rounded = 'rounded-xl', bg = 'bg-neutral-100' }) => {
  const [failed, setFailed] = useState(false);
  if (!HAS_PHOTO.has(id) || failed) {
    return <div className={`${className} ${rounded} ${bg} flex items-center justify-center flex-shrink-0 text-2xl`}>{icon}</div>;
  }
  return <img src={`/foods/${id}.jpg`} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} className={`${className} ${rounded} object-cover flex-shrink-0 bg-neutral-100`} />;
};
