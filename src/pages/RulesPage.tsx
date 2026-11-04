import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, UserCheck, Clock, Trophy, AlertTriangle, ArrowUp } from 'lucide-react';

interface RulesPageProps {
  onBack: () => void;
  onOpenModal: () => void;
}

const ruleSections = [
  {
    id: 'general',
    number: '01',
    title: 'ЗАГАЛЬНІ ПОЛОЖЕННЯ',
    icon: <FileText className="w-4 h-4" />,
    articles: [
      {
        num: '1.1',
        title: 'Офіційна назва та статус турніру',
        content:
          'UNBREAKABLE PHOENIX є відкритою міжуніверситетською кіберспортивною лігою України в дисципліні Counter-Strike 2 (Valve Corporation). Метою змагань є розвиток студентського кіберспорту, популяризація здорової конкуренції та виявлення найсильніших студентських ростерів країни.',
      },
      {
        num: '1.2',
        title: 'Сезон та календарні рамки',
        content:
          'Перший сезон 2026/27 охоплює період з 20 жовтня 2026 року до фінальних вихідних квітня 2027 року. Турнір складається з трьох фаз: офіційна акредитація та реєстрація, онлайн-етап у групах за кошиками на платформі FACEIT, та фінальна стадія (Grand LAN Final) на арені у Києві.',
      },
      {
        num: '1.3',
        title: 'Організаційний комітет та суддівська колегія',
        content:
          'Усі матчі проходять під наглядом головного судді (Head Referee) та офіційних модераторів турніру. Рішення суддівської колегії щодо технічних спірних ситуацій є остаточними та обов’язковими до виконання всіма учасниками.',
      },
    ],
  },
  {
    id: 'eligibility',
    number: '02',
    title: 'ВИМОГИ ДО УЧАСНИКІВ ТА ВЕРИФІКАЦІЯ ЗВО',
    icon: <UserCheck className="w-4 h-4" />,
    articles: [
      {
        num: '2.1',
        title: 'Склад команди (5 + 1-2)',
        content:
          'До участі допускаються команди у складі 5 основних гравців та від 1 до 2 офіційних запасних. Усі гравці однієї заявки мають бути студентами, аспірантами чи слухачами одного і того ж закладу вищої освіти (ЗВО) України.',
      },
      {
        num: '2.2',
        title: 'Студентська верифікація',
        content:
          'Підтвердження статусу студента здійснюється через офіційну корпоративну пошту навчального закладу (домен @*.edu.ua або домен ЗВО) під час подачі заявки. У разі відсутності корпоративної пошти гравець надає скан-копію дійсного студентського квитка під час періоду верифікації (01.12 – 06.12.2026).',
      },
      {
        num: '2.3',
        title: 'Участь студентів за кордоном',
        content:
          'Студенти українських ЗВО, які тимчасово перебувають за межами України (дистанційна освіта, програми обміну Erasmus+), мають повне право брати участь в онлайн-етапах. Сервери розташовані в Європі. У разі проходу команди на LAN-фінал у Києві, ростер має забезпечити особисту присутність гравців на сцені.',
      },
    ],
  },
  {
    id: 'technical',
    number: '03',
    title: 'ТЕХНІЧНИЙ РЕГЛАМЕНТ CS2 & АНТИЧИТ',
    icon: <ShieldCheck className="w-4 h-4" />,
    articles: [
      {
        num: '3.1',
        title: 'Платформа FACEIT та Anti-Cheat',
        content:
          'Усі матчі онлайн-стадії проводяться виключно на платформі FACEIT. Кожен гравець зобовʼязаний грати з увімкненим та оновленим офіційним клієнтом FACEIT Anti-Cheat. Спроба запуску матчу без античиту або з блокуванням процесів карається негайною дискваліфікацією.',
      },
      {
        num: '3.2',
        title: 'Офіційний маппул (Active Duty)',
        content:
          'Змагання відбуваються на актуальному змагальному маппулі Valve Active Duty: Mirage, Inferno, Nuke, Ancient, Anubis, Dust II, Train. Вибір карт здійснюється за стандартною процедурою veto (бани та піки) у лобі FACEIT перед початком кожного матчу.',
      },
      {
        num: '3.3',
        title: 'Таймінги явки та технічні паузи',
        content:
          'Команда має приєднатися до серверу не пізніше ніж через 15 хвилин після призначення часу матчу. Кожній команді доступно 4 тактичні паузи по 30 секунд та до 10 хвилин сумарної технічної паузи за карту у випадку проблем зі звʼязком чи залізом.',
      },
    ],
  },
  {
    id: 'stages',
    number: '04',
    title: 'СТАДІЇ ТУРНІРУ ТА ЖЕРЕБКУВАННЯ',
    icon: <Clock className="w-4 h-4" />,
    articles: [
      {
        num: '4.1',
        title: 'Жеребкування за трьома кошиками',
        content:
          'Університети ранжуються за кількістю зареєстрованих команд і формують 3 кошики активності. Рандомайзер жеребкування розподіляє по 1 університету з кожного кошика у 8 турнірних груп (по 3 ЗВО в кожній). Це гарантує чесний паритет сил у групах.',
      },
      {
        num: '4.2',
        title: 'Формат матчів',
        content:
          'Груповий етап проходить за коловою системою (Round Robin) у форматі Best-of-1 або Best-of-3. Переможці груп виходять до сітки плей-оф. Півфінали та матчі на виліт проходять у форматі Best-of-3.',
      },
      {
        num: '4.3',
        title: 'LAN-фінал у Києві',
        content:
          'Чотири найсильніші університетські команди виходять на головну столичну сцену. Організаційний комітет забезпечує офіційні ігрові місця стандарту LAN, професійну трансляцію, суддівство на місці та глядацьку залу.',
      },
    ],
  },
  {
    id: 'prizes',
    number: '05',
    title: 'ПРИЗОВИЙ ФОНД 100 000 ₴ ТА ДЕВАЙСИ',
    icon: <Trophy className="w-4 h-4" />,
    articles: [
      {
        num: '5.1',
        title: 'Розподіл грошового фонду',
        content:
          'Загальний грошовий призовий фонд турніру становить 100 000 ₴ і розподіляється між призерами: 1-ше місце — 50 000 ₴; 2-ге місце — 30 000 ₴; 3-тє місце — 20 000 ₴. Виплати здійснюються на банківські реквізити капітана або кожного гравця команди відповідно до заяви.',
      },
      {
        num: '5.2',
        title: 'Призові девайси від партнерів',
        content:
          'Кожен гравець топ-3 складів отримує індивідуальні ігрові девайси від технічних партнерів ліги: чемпіони — комплект ігрової миші та кіберспортивної гарнітури; срібні призери — механічні клавіатури; бронзові призери — професійні килимки XL.',
      },
    ],
  },
  {
    id: 'fairplay',
    number: '06',
    title: 'КОДЕКС ЧЕСНОЇ ГРИ ТА ДИСЦИПЛІНА',
    icon: <AlertTriangle className="w-4 h-4" />,
    articles: [
      {
        num: '6.1',
        title: 'Нульова толерантність до шахрайства',
        content:
          'Використання будь-якого несанкціонованого стороннього програмного забезпечення (aimbot, wallhack, triggerbot, radar hack тощо), скриптів або використання відомих критичних багів гри тягне за собою довічну дискваліфікацію гравця з ліги та анулювання результатів команди.',
      },
      {
        num: '6.2',
        title: 'Підставні гравці (Ringer / Smurf)',
        content:
          'Передача акаунта іншій особі або залучення гравця, який не є студентом заявленого ЗВО, карається технічною поразкою в матчі та зняттям команди зі змагань.',
      },
      {
        num: '6.3',
        title: 'Повага та No-Toxic середовище',
        content:
          'Усі учасники зобовʼязані дотримуватися спортивної поведінки. Образи суперників у внутрішньоігровому чаті, Discord чи офіційних каналах звʼязку караються попередженням або штрафними санкціями аж до дискваліфікації.',
      },
    ],
  },
];

export const RulesPage: React.FC<RulesPageProps> = ({ onOpenModal }) => {
  const [activeSectionId, setActiveSectionId] = useState<string>('general');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;

      for (let i = ruleSections.length - 1; i >= 0; i--) {
        const el = document.getElementById(`section-${ruleSections[i].id}`);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSectionId(ruleSections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    const element = document.getElementById(`section-${id}`);
    if (element) {
      const yOffset = -120;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-32 text-left">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Compact Document Title Header */}
        <div className="py-8 sm:py-10 border-b border-neutral-850">
          <h1 className="font-head text-3xl sm:text-5xl lg:text-6xl font-bold uppercase text-white tracking-tight leading-[0.95]">
            ОФІЦІЙНИЙ РЕГЛАМЕНТ <span className="text-[#FFD700]">ЛІГИ</span>
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base max-w-3xl mt-2 leading-relaxed">
            Повний звід правил, технічних вимог та стандартів проведення Всеукраїнської
            міжуніверситетської ліги UNBREAKABLE PHOENIX з Counter-Strike 2.
          </p>
        </div>

        {/* Document Layout: Sticky Sidebar on the Left + Full Continuous Document on the Right */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left: Sticky Floating Table of Contents ("структура яка за тобою ганяється") */}
          <aside className="lg:col-span-4 sticky top-28 space-y-4 self-start">
            <div className="bg-[#080808] border border-neutral-850 p-5">
              <div className="font-mono text-xs uppercase tracking-widest text-[#FFD700] mb-4 pb-2 border-b border-neutral-850">
                ЗМІСТ ДОКУМЕНТА
              </div>

              <nav className="space-y-1" aria-label="Зміст регламенту">
                {ruleSections.map((sec) => {
                  const isActive = activeSectionId === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => scrollToSection(sec.id)}
                      className={`hover-target w-full px-3 py-2.5 flex items-center gap-3 text-left transition-all ${
                        isActive
                          ? 'bg-[#141414] border-l-2 border-l-[#FFD700] text-[#FFD700] font-bold'
                          : 'text-neutral-400 hover:text-white hover:bg-[#0c0c0c]'
                      }`}
                    >
                      <span className="font-mono text-xs text-neutral-500">{sec.number}.</span>
                      <span className="font-head text-xs sm:text-sm uppercase tracking-wide truncate">
                        {sec.title}
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="pt-4 mt-4 border-t border-neutral-850 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="font-mono text-[11px] uppercase tracking-wider text-neutral-500 hover:text-[#FFD700] inline-flex items-center gap-1.5 transition-colors"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>Вгору</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenModal}
                  className="btn-gold text-[10px] tracking-[1.5px] px-3 py-1.5 uppercase"
                >
                  Реєстрація
                </button>
              </div>
            </div>
          </aside>

          {/* Right: Full Continuous Document (Pure Typography, No Box Background, No Border Lines) */}
          <main className="lg:col-span-8 space-y-14">
            {ruleSections.map((sec) => (
              <section
                key={sec.id}
                id={`section-${sec.id}`}
                className="scroll-mt-32 space-y-6"
              >
                {/* Chapter Heading */}
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest text-[#FFD700]">
                    РОЗДІЛ {sec.number}
                  </div>
                  <h2 className="font-head text-2xl sm:text-3xl lg:text-4xl uppercase text-white mt-1 tracking-tight">
                    {sec.title}
                  </h2>
                </div>

                {/* Articles List (Pure Typography, No Box Lines) */}
                <div className="space-y-6">
                  {sec.articles.map((art) => (
                    <article key={art.num} className="space-y-2">
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-sm text-[#FFD700] font-bold shrink-0">
                          § {art.num}
                        </span>
                        <h3 className="font-head text-lg sm:text-xl uppercase text-white tracking-wide">
                          {art.title}
                        </h3>
                      </div>
                      <p className="text-neutral-300 text-sm sm:text-base leading-relaxed pl-7 sm:pl-8">
                        {art.content}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ))}

            {/* Document Footer Signoff */}
            <div className="pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <div className="font-mono text-xs text-neutral-500 uppercase tracking-wider">
                  ЗАТВЕРДЖЕНО ОРГАНІЗАЦІЙНИМ КОМІТЕТОМ
                </div>
                <div className="font-head text-lg uppercase text-white mt-1">
                  UNBREAKABLE PHOENIX LEAGUE · СЕЗОН 01
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenModal}
                className="btn-gold hover-target text-xs tracking-[2px] px-8 py-3.5 shrink-0 self-start sm:self-auto"
              >
                ЗАРЕЄСТРУВАТИ КОМАНДУ
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

