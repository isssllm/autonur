export type CitySlug = 'astana' | 'kokshetau' | 'karaganda';
export type Transmission = 'AUTOMATIC' | 'MANUAL';
export type LessonPlace = 'CITY' | 'AUTODROME';
export type BookingStatus = 'NEW' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export const cityInfo: Record<CitySlug, { name: string; hero: string; autodrome: string; gis: string; phone: string }> = {
  astana: { name: 'Астана', hero: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=2000&q=88', autodrome: 'г. Астана, ул. Жансугурова, 22', gis: 'https://2gis.kz/astana', phone: '+7 777 100 10 10' },
  kokshetau: { name: 'Кокшетау', hero: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=2000&q=88', autodrome: 'г. Кокшетау, ул. Абая, 114', gis: 'https://2gis.kz/kokshetau', phone: '+7 777 200 20 20' },
  karaganda: { name: 'Караганда', hero: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2000&q=88', autodrome: 'г. Караганда, ул. Гоголя, 89', gis: 'https://2gis.kz/karaganda', phone: '+7 777 300 30 30' },
};

export const cities = (Object.keys(cityInfo) as CitySlug[]).map((slug) => ({ slug, ...cityInfo[slug] }));

export const faqs = [
  ['Сколько длится одно занятие?', 'Один слот в Autonur длится 60 минут. Можно объединить несколько подряд идущих свободных слотов в одно занятие.'],
  ['Можно ли выбрать инструктора?', 'Да. На шаге записи система показывает только инструкторов, свободных на весь выбранный период и подходящих по коробке и месту занятия.'],
  ['Можно ли выбрать автомобиль?', 'Да. После выбора времени вы увидите только свободные совместимые автомобили выбранного города и инструктора.'],
  ['Есть ли автомат и механика?', 'Да. Доступные коробки зависят от инструкторов и автомобилей выбранного города.'],
  ['Где проходят занятия?', 'Можно выбрать езду по городу или автодром. Адрес автодрома указан на странице соответствующего города.'],
  ['Что нужно взять с собой?', 'Документ, удостоверяющий личность, и хорошее настроение. Организационные детали менеджер уточнит заранее.'],
  ['Можно ли отменить или перенести запись?', 'Самостоятельно — нет. Свяжитесь с менеджером вашего города, он поможет отменить или перенести запись.'],
] as const;

export const cityBySlug = (slug: string) => (cityInfo[slug as CitySlug] ? { slug: slug as CitySlug, ...cityInfo[slug as CitySlug] } : { slug: 'astana' as CitySlug, ...cityInfo.astana });

export const ruTransmission = (value: Transmission) => value === 'AUTOMATIC' ? 'Автомат' : 'Механика';
export const ruPlace = (value: LessonPlace) => value === 'CITY' ? 'Езда по городу' : 'Автодром';
export const ruStatus = (value: BookingStatus) => ({ NEW: 'Новая', CONFIRMED: 'Подтверждена', COMPLETED: 'Завершена', CANCELLED: 'Отменена' })[value];
