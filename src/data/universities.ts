import type { UniversityItem } from '../types';

/** Без залежностей від import.meta.env — файл імпортується і сервером (seed, валідація пошти). */
export const universities: UniversityItem[] = [
  { number: '01', short: 'KPI', name: 'КПІ ім. Ігоря Сікорського', city: 'КИЇВ', team: 'KPI Sparks', domain: '@kpi.ua' },
  { number: '02', short: 'KNU', name: 'КНУ ім. Тараса Шевченка', city: 'КИЇВ', team: 'KNU Lions', domain: '@knu.ua' },
  { number: '03', short: 'UKMA', name: 'Національний університет «Києво-Могилянська академія»', city: 'КИЇВ', team: 'Mohyla Owls', domain: '@ukma.edu.ua' },
  { number: '04', short: 'NAU', name: 'Національний авіаційний університет', city: 'КИЇВ', team: 'NAU Jets', domain: '@nau.edu.ua' },
  { number: '05', short: 'KNEU', name: 'КНЕУ ім. Вадима Гетьмана', city: 'КИЇВ', team: 'KNEU Bulls', domain: '@kneu.edu.ua' },
  { number: '06', short: 'KhNU', name: 'ХНУ ім. В. Н. Каразіна', city: 'ХАРКІВ', team: 'Karazin Phoenix', domain: '@karazin.ua' },
  { number: '07', short: 'NURE', name: 'ХНУРЕ', city: 'ХАРКІВ', team: 'NURE Signal', domain: '@nure.ua' },
  { number: '08', short: 'KhPI', name: 'НТУ «ХПІ»', city: 'ХАРКІВ', team: 'KhPI Reactor', domain: '@khpi.edu.ua' },
  { number: '09', short: 'KhAI', name: 'Національний аерокосмічний університет «ХАІ»', city: 'ХАРКІВ', team: 'KhAI Orbit', domain: '@khai.edu.ua' },
  { number: '10', short: 'LNU', name: 'ЛНУ ім. Івана Франка', city: 'ЛЬВІВ', team: 'Franko Ravens', domain: '@lnu.edu.ua' },
  { number: '11', short: 'LP', name: 'Національний університет «Львівська політехніка»', city: 'ЛЬВІВ', team: 'LP Cyborgs', domain: '@lpnu.ua' },
  { number: '12', short: 'UCU', name: 'Український католицький університет', city: 'ЛЬВІВ', team: 'UCU Rangers', domain: '@ucu.edu.ua' },
  { number: '13', short: 'LNMU', name: 'Львівський національний медичний університет', city: 'ЛЬВІВ', team: 'LNMU Healers', domain: '@meduniv.lviv.ua' },
  { number: '14', short: 'ONU', name: 'ОНУ ім. І. І. Мечникова', city: 'ОДЕСА', team: 'ONU Wave', domain: '@onu.edu.ua' },
  { number: '15', short: 'OP', name: 'Національний університет «Одеська політехніка»', city: 'ОДЕСА', team: 'Odesa Poly', domain: '@op.edu.ua' },
  { number: '16', short: 'ONMA', name: 'Національний університет «Одеська морська академія»', city: 'ОДЕСА', team: 'ONMA Mariners', domain: '@onma.edu.ua' },
  { number: '17', short: 'DNU', name: 'ДНУ ім. Олеся Гончара', city: 'ДНІПРО', team: 'DNU Rockets', domain: '@dnu.dp.ua' },
  { number: '18', short: 'DP', name: 'НТУ «Дніпровська політехніка»', city: 'ДНІПРО', team: 'Dnipro Tech', domain: '@nmu.org.ua' },
  { number: '19', short: 'VNTU', name: 'Вінницький національний технічний університет', city: 'ВІННИЦЯ', team: 'VNTU Volt', domain: '@vntu.edu.ua' },
  { number: '20', short: 'ChNU', name: 'ЧНУ ім. Юрія Федьковича', city: 'ЧЕРНІВЦІ', team: 'ChNU Bukovyna', domain: '@chnu.edu.ua' },
  { number: '21', short: 'ZNU', name: 'Запорізький національний університет', city: 'ЗАПОРІЖЖЯ', team: 'ZNU Cossacks', domain: '@znu.edu.ua' },
  { number: '22', short: 'PNPU', name: 'ПНПУ ім. В. Г. Короленка', city: 'ПОЛТАВА', team: 'Poltava Vorskla', domain: '@pnpu.edu.ua' },
  { number: '23', short: 'SumDU', name: 'Сумський державний університет', city: 'СУМИ', team: 'SumDU Vanguard', domain: '@sumdu.edu.ua' },
  { number: '24', short: 'UzhNU', name: 'Ужгородський національний університет', city: 'УЖГОРОД', team: 'UzhNU Carpathians', domain: '@uzhnu.edu.ua' },
];
