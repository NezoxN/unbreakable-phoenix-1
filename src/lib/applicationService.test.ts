import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateApplicationId, submitApplication, getLocalApplications } from './applicationService';

describe('applicationService', () => {
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = {};
    const mockLocalStorage = {
      getItem: (key: string) => mockStore[key] || null,
      setItem: (key: string, value: string) => {
        mockStore[key] = value;
      },
      clear: () => {
        mockStore = {};
      },
      removeItem: (key: string) => {
        delete mockStore[key];
      },
      length: 0,
      key: () => null,
    };

    vi.stubGlobal('window', {
      localStorage: mockLocalStorage,
    });
    vi.restoreAllMocks();
  });

  it('generateApplicationId generates ID with UP- prefix and length 9', () => {
    const id = generateApplicationId();
    expect(id).toMatch(/^UP-[2-9A-Z]{6}$/);
  });

  it('submitApplication saves application to localStorage as fallback', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true })));
    vi.stubGlobal('fetch', mockFetch);

    const res = await submitApplication({
      name: 'Іван Франко',
      course: '2 курс',
      email: 'ivan@franko.lviv.ua',
      telegram: '@ivan_franko',
      campaignId: 'a1',
      sourceLocation: 'countdown_banner',
    });

    expect(res.success).toBe(true);
    expect(res.id).toMatch(/^UP-/);

    const saved = getLocalApplications();
    expect(saved.length).toBe(1);
    expect(saved[0].name).toBe('Іван Франко');
    expect(saved[0].course).toBe('2 курс');
    expect(saved[0].email).toBe('ivan@franko.lviv.ua');
    expect(saved[0].telegram).toBe('@ivan_franko');
    expect(saved[0].campaignId).toBe('a1');
    expect(saved[0].sourceLocation).toBe('countdown_banner');
  });

  it('submitApplication sends message to both admin chat IDs via Telegram Bot API', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true })));
    vi.stubGlobal('fetch', mockFetch);

    const res = await submitApplication({
      name: 'Тарас Шевченко',
      course: '3 курс',
      email: 'taras@shevchenko.kiev.ua',
      telegram: '@taras_shevchenko',
      campaignId: 'b2',
    });

    expect(res.success).toBe(true);
    // Sent to 2 admins
    expect(mockFetch).toHaveBeenCalledTimes(2);

    const calls = mockFetch.mock.calls;
    expect(calls[0][0]).toContain('https://api.telegram.org/bot9108140738:AAGjFvh0WeAtKfkMn4xqMIwXlMeymGNp_a0/sendMessage');
    const body1 = JSON.parse(calls[0][1].body);
    const body2 = JSON.parse(calls[1][1].body);

    expect(['621012445', '7673176783']).toContain(body1.chat_id);
    expect(['621012445', '7673176783']).toContain(body2.chat_id);
    expect(body1.text).toContain('Тарас Шевченко');
  });
});
