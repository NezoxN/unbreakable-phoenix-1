import React, { useCallback, useEffect, useState } from 'react';
import { Download, Plus, Trash2, Pencil } from 'lucide-react';
import { api } from '../../lib/api';
import { MatchRow } from '../../components/MatchRow';
import {
  Field,
  FormMessage,
  Notice,
  SectionTitle,
  Spinner,
  ghostButton,
  goldButton,
  mapLabel,
  panelClass,
  smallInputClass,
  useFormState,
} from '../../components/ui';
import type { MatchItem, TeamItem } from '../../types';

const MAPS = ['de_mirage', 'de_inferno', 'de_nuke', 'de_ancient', 'de_anubis', 'de_dust2', 'de_train'];
const STAGES = ['GROUPS', 'PLAYOFF', 'FINAL'];
const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/* ------------------------------ Імпорт з FACEIT ------------------------------ */

interface ImportPreview {
  existingMatchId: string | null;
  faceitStatus: string;
  mapped: {
    faceitMatchId: string;
    sides: Record<'A' | 'B', { name: string; teamId: string | null }>;
    scoreA: number;
    scoreB: number;
    maps: { mapName: string; scoreA: number; scoreB: number; players: { nickname: string; userId: string | null; side: 'A' | 'B'; kills: number; deaths: number; adr: number }[] }[];
    unmatched: string[];
  };
}

const FaceitImport: React.FC<{ teams: TeamItem[]; onDone: () => void }> = ({ teams, onDone }) => {
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [opts, setOpts] = useState({ stage: 'GROUPS', group: '', teamAId: '', teamBId: '' });
  const load = useFormState();
  const save = useFormState();

  const teamName = (id: string | null) => teams.find((t) => t.id === id)?.name ?? '— не визначено —';

  return (
    <div className={`${panelClass} space-y-4`}>
      <SectionTitle icon={<Download className="w-5 h-5 text-[#FFD700]" />}>ІМПОРТ З FACEIT</SectionTitle>
      <form
        className="flex flex-col sm:flex-row gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await load.run(() => api.post<ImportPreview>('/admin/matches/import/preview', { faceitMatch: input }));
          if (res) {
            setPreview(res);
            setOpts((o) => ({ ...o, teamAId: res.mapped.sides.A.teamId ?? '', teamBId: res.mapped.sides.B.teamId ?? '' }));
          }
        }}
      >
        <input
          placeholder="https://www.faceit.com/uk/cs2/room/1-xxxx… або match ID"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={smallInputClass}
        />
        <button type="submit" disabled={load.busy || input.length < 8} className={ghostButton}>
          ЗАВАНТАЖИТИ
        </button>
      </form>
      <FormMessage message={load.message} />

      {preview && (
        <div className="space-y-4 border-t border-neutral-850 pt-4">
          {preview.existingMatchId && <Notice>Цей матч уже імпортовано — дані буде перезаписано.</Notice>}
          <p className="font-head text-2xl text-white uppercase">
            {preview.mapped.sides.A.name} <span className="text-[#FFD700]">{preview.mapped.scoreA} : {preview.mapped.scoreB}</span>{' '}
            {preview.mapped.sides.B.name}
          </p>
          {preview.mapped.maps.map((m, i) => (
            <p key={i} className="font-mono text-xs text-neutral-400">
              {mapLabel(m.mapName)} {m.scoreA}:{m.scoreB} · гравців зіставлено: {m.players.filter((p) => p.userId).length}/{m.players.length}
            </p>
          ))}
          {preview.mapped.unmatched.length > 0 && (
            <Notice>
              Не зареєстровані на сайті (не потраплять у статистику): {preview.mapped.unmatched.join(', ')}
            </Notice>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Field id="impA" label={`Команда A (${preview.mapped.sides.A.name})`}>
              <select value={opts.teamAId} onChange={(e) => setOpts({ ...opts, teamAId: e.target.value })} className={smallInputClass}>
                <option value="">{teamName(null)}</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="impB" label={`Команда B (${preview.mapped.sides.B.name})`}>
              <select value={opts.teamBId} onChange={(e) => setOpts({ ...opts, teamBId: e.target.value })} className={smallInputClass}>
                <option value="">{teamName(null)}</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="impStage" label="Стадія">
              <select value={opts.stage} onChange={(e) => setOpts({ ...opts, stage: e.target.value })} className={smallInputClass}>
                {STAGES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field id="impGroup" label="Група">
              <select value={opts.group} onChange={(e) => setOpts({ ...opts, group: e.target.value })} className={smallInputClass}>
                <option value="">—</option>
                {GROUPS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </Field>
          </div>
          <FormMessage message={save.message} />
          <button
            type="button"
            disabled={save.busy}
            onClick={async () => {
              const res = await save.run(
                () =>
                  api.post<{ unmatched: string[] }>('/admin/matches/import/confirm', {
                    faceitMatch: preview.mapped.faceitMatchId,
                    stage: opts.stage,
                    group: opts.group || null,
                    teamAId: opts.teamAId || undefined,
                    teamBId: opts.teamBId || undefined,
                  }),
                'Матч імпортовано, статистику оновлено.'
              );
              if (res) {
                setPreview(null);
                setInput('');
                onDone();
              }
            }}
            className={goldButton}
          >
            ЗБЕРЕГТИ МАТЧ
          </button>
        </div>
      )}
    </div>
  );
};

/* ------------------------------ Ручне введення ------------------------------ */

interface StatRow {
  played: boolean;
  kills: string;
  deaths: string;
  assists: string;
  adr: string;
  hsPercent: string;
}

interface MapDraft {
  mapName: string;
  scoreA: string;
  scoreB: string;
  stats: Record<string, StatRow>;
}

const emptyRow = (): StatRow => ({ played: true, kills: '', deaths: '', assists: '', adr: '', hsPercent: '' });

const ResultEditor: React.FC<{ match: MatchItem; teams: TeamItem[]; onDone: () => void }> = ({ match, teams, onDone }) => {
  const teamA = teams.find((t) => t.id === match.teamAId);
  const teamB = teams.find((t) => t.id === match.teamBId);
  const roster = [...(teamA?.members ?? []), ...(teamB?.members ?? [])];
  const newMap = (i: number): MapDraft => ({
    mapName: MAPS[i % MAPS.length],
    scoreA: '',
    scoreB: '',
    stats: Object.fromEntries(roster.map((m) => [m.player.id, { ...emptyRow(), played: m.slot === 'MAIN' }])),
  });
  const [maps, setMaps] = useState<MapDraft[]>(() => [newMap(0)]);
  const form = useFormState();

  const setMap = (i: number, patch: Partial<MapDraft>) => setMaps((prev) => prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  const setStat = (i: number, userId: string, patch: Partial<StatRow>) =>
    setMaps((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, stats: { ...m.stats, [userId]: { ...m.stats[userId], ...patch } } } : m))
    );

  const submit = async () => {
    const body = {
      maps: maps.map((m) => ({
        mapName: m.mapName,
        scoreA: Number(m.scoreA),
        scoreB: Number(m.scoreB),
        players: Object.entries(m.stats)
          .filter(([, s]) => s.played && s.kills !== '')
          .map(([userId, s]) => ({
            userId,
            kills: Number(s.kills),
            deaths: Number(s.deaths || 0),
            assists: Number(s.assists || 0),
            adr: Number(s.adr || 0),
            hsPercent: Number(s.hsPercent || 0),
          })),
      })),
    };
    const ok = await form.run(() => api.put(`/admin/matches/${match.id}/result`, body), 'Результат збережено.');
    if (ok) onDone();
  };

  const statInput = 'w-14 bg-[#111] border border-neutral-800 focus:border-[#FFD700] text-white px-1.5 py-1 text-xs outline-none text-center';

  return (
    <div className="border-t border-neutral-850 p-6 space-y-6">
      {maps.map((m, i) => (
        <div key={i} className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <span className="text-[#FFD700] uppercase">Карта {i + 1}</span>
            <select value={m.mapName} onChange={(e) => setMap(i, { mapName: e.target.value })} className={`${smallInputClass} w-auto`}>
              {MAPS.map((name) => (
                <option key={name} value={name}>
                  {mapLabel(name)}
                </option>
              ))}
            </select>
            <span className="text-white">{match.teamA.name}</span>
            <input value={m.scoreA} onChange={(e) => setMap(i, { scoreA: e.target.value })} className={statInput} placeholder="13" />
            <span>:</span>
            <input value={m.scoreB} onChange={(e) => setMap(i, { scoreB: e.target.value })} className={statInput} placeholder="9" />
            <span className="text-white">{match.teamB.name}</span>
            {maps.length > 1 && (
              <button type="button" onClick={() => setMaps(maps.filter((_, idx) => idx !== i))} className="text-red-400 ml-auto">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <table className="w-full font-mono text-xs">
            <thead className="text-neutral-500 text-[10px] uppercase">
              <tr>
                <th className="text-left py-1">Грав</th>
                <th className="text-left">Гравець</th>
                <th>K</th>
                <th>D</th>
                <th>A</th>
                <th>ADR</th>
                <th>HS%</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((r) => {
                const s = m.stats[r.player.id] ?? emptyRow();
                const fields: (keyof StatRow)[] = ['kills', 'deaths', 'assists', 'adr', 'hsPercent'];
                return (
                  <tr key={r.player.id} className={s.played ? '' : 'opacity-40'}>
                    <td className="py-1">
                      <input
                        type="checkbox"
                        checked={s.played}
                        onChange={(e) => setStat(i, r.player.id, { played: e.target.checked })}
                        className="accent-[#FFD700]"
                      />
                    </td>
                    <td className="text-white">
                      {teamA?.members.includes(r) ? `[${match.teamA.tag}]` : `[${match.teamB.tag}]`} {r.player.nickname}
                    </td>
                    {fields.map((f) => (
                      <td key={f} className="text-center">
                        <input
                          value={s[f] as string}
                          disabled={!s.played}
                          onChange={(e) => setStat(i, r.player.id, { [f]: e.target.value })}
                          className={statInput}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
      <FormMessage message={form.message} />
      <div className="flex flex-wrap gap-3">
        {maps.length < 5 && (
          <button type="button" onClick={() => setMaps([...maps, newMap(maps.length)])} className={ghostButton}>
            <Plus className="w-4 h-4" />
            <span>ДОДАТИ КАРТУ</span>
          </button>
        )}
        <button type="button" disabled={form.busy} onClick={submit} className={goldButton}>
          ЗБЕРЕГТИ РЕЗУЛЬТАТ
        </button>
      </div>
    </div>
  );
};

/* ------------------------------ Створення та список ------------------------------ */

const CreateMatch: React.FC<{ teams: TeamItem[]; onDone: () => void }> = ({ teams, onDone }) => {
  const [data, setData] = useState({ teamAId: '', teamBId: '', stage: 'GROUPS', group: '', bestOf: 1, scheduledAt: '' });
  const form = useFormState();

  return (
    <form
      className={`${panelClass} space-y-4`}
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await form.run(
          () =>
            api.post('/admin/matches', {
              ...data,
              group: data.group || null,
              scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : null,
            }),
          'Матч додано в розклад.'
        );
        if (ok) onDone();
      }}
    >
      <SectionTitle icon={<Plus className="w-5 h-5 text-[#FFD700]" />}>НОВИЙ МАТЧ</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {(['teamAId', 'teamBId'] as const).map((k, i) => (
          <Field key={k} id={k} label={`Команда ${i ? 'B' : 'A'}`}>
            <select id={k} value={data[k]} onChange={(e) => setData({ ...data, [k]: e.target.value })} className={smallInputClass}>
              <option value="">Оберіть</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.tag}] {t.name}
                </option>
              ))}
            </select>
          </Field>
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Field id="stage" label="Стадія">
          <select id="stage" value={data.stage} onChange={(e) => setData({ ...data, stage: e.target.value })} className={smallInputClass}>
            {STAGES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field id="group" label="Група">
          <select id="group" value={data.group} onChange={(e) => setData({ ...data, group: e.target.value })} className={smallInputClass}>
            <option value="">—</option>
            {GROUPS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </Field>
        <Field id="bo" label="Формат">
          <select id="bo" value={data.bestOf} onChange={(e) => setData({ ...data, bestOf: Number(e.target.value) })} className={smallInputClass}>
            <option value={1}>BO1</option>
            <option value={3}>BO3</option>
            <option value={5}>BO5</option>
          </select>
        </Field>
        <Field id="when" label="Дата й час">
          <input
            id="when"
            type="datetime-local"
            value={data.scheduledAt}
            onChange={(e) => setData({ ...data, scheduledAt: e.target.value })}
            className={smallInputClass}
          />
        </Field>
      </div>
      <FormMessage message={form.message} />
      <button type="submit" disabled={form.busy || !data.teamAId || !data.teamBId} className={goldButton}>
        ДОДАТИ МАТЧ
      </button>
    </form>
  );
};

export const MatchesPanel: React.FC<{ onChange: () => void }> = ({ onChange }) => {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [matches, setMatches] = useState<MatchItem[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const act = useFormState();

  const load = useCallback(() => {
    api
      .get<{ matches: MatchItem[] }>('/matches?limit=200')
      .then((d) => setMatches(d.matches))
      .catch(() => setMatches([]));
  }, []);

  useEffect(() => {
    load();
    api
      .get<{ teams: TeamItem[] }>('/admin/teams?status=APPROVED')
      .then((d) => setTeams(d.teams))
      .catch(() => undefined);
  }, [load]);

  const done = () => {
    setEditing(null);
    load();
    onChange();
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <CreateMatch teams={teams} onDone={done} />
        <FaceitImport teams={teams} onDone={done} />
      </div>
      <FormMessage message={act.message} />
      {matches === null ? (
        <Spinner />
      ) : matches.length === 0 ? (
        <Notice>Матчів ще немає.</Notice>
      ) : (
        <div className="space-y-2">
          {matches.map((m) => (
            <div key={m.id} className="bg-[#090909]">
              <MatchRow
                bordered
                match={m}
                actions={
                  <>
                    <span className="text-neutral-600">{m.source === 'FACEIT' ? 'FACEIT' : 'MANUAL'}</span>
                    <button type="button" title="Ввести результат" onClick={() => setEditing(editing === m.id ? null : m.id)} className="text-neutral-400 hover:text-[#FFD700]">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Видалити матч"
                      onClick={async () => {
                        if (!window.confirm('Видалити матч разом зі статистикою?')) return;
                        const ok = await act.run(() => api.del(`/admin/matches/${m.id}`), 'Матч видалено.');
                        if (ok) done();
                      }}
                      className="text-neutral-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                }
              />
              {editing === m.id && <ResultEditor match={m} teams={teams} onDone={done} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
