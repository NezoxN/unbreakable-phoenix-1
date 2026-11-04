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

  it('submitApplication calls fetch when VITE_GOOGLE_SCRIPT_URL is provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'success' })));
    vi.stubGlobal('fetch', mockFetch);

    vi.stubEnv('VITE_GOOGLE_SCRIPT_URL', 'https://script.google.com/macros/s/test/exec');

    const res = await submitApplication({
      name: 'Тарас Шевченко',
      course: '3 курс',
      email: 'taras@shevchenko.kiev.ua',
      telegram: '@taras_shevchenko',
      campaignId: 'b2',
    });

    expect(res.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://script.google.com/macros/s/test/exec',
      expect.objectContaining({
        method: 'POST',
        mode: 'no-cors',
      })
    );

    vi.unstubAllEnvs();
  });
});
