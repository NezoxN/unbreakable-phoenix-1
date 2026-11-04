import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getActiveCampaign,
  getCampaignInviteUrl,
  isValidCampaign,
  TELEGRAM_CAMPAIGN_LINKS,
  CAMPAIGN_STORAGE_KEY,
  CAMPAIGN_TTL_MS,
} from './campaigns';

describe('Campaigns & Attribution System', () => {
  let mockStore: Record<string, string> = {};
  let currentPath = '/';
  let currentSearch = '';

  beforeEach(() => {
    mockStore = {};
    currentPath = '/';
    currentSearch = '';

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
      location: {
        get pathname() {
          return currentPath;
        },
        get search() {
          return currentSearch;
        },
      },
    });
  });

  it('has distinct Telegram channel invite links for each campaign and default', () => {
    const links = [
      TELEGRAM_CAMPAIGN_LINKS.a1,
      TELEGRAM_CAMPAIGN_LINKS.b1,
      TELEGRAM_CAMPAIGN_LINKS.a2,
      TELEGRAM_CAMPAIGN_LINKS.b2,
      TELEGRAM_CAMPAIGN_LINKS.default,
    ];

    // Every link must start with https://t.me/
    links.forEach((link) => {
      expect(link).toMatch(/^https:\/\/t\.me\//);
    });

    // Every link must be completely unique
    const uniqueLinks = new Set(links);
    expect(uniqueLinks.size).toBe(5);
  });

  it('correctly maps campaign keys to channel invite URLs', () => {
    expect(getCampaignInviteUrl('a1')).toBe('https://t.me/+N65FReF2GX9lOGM6');
    expect(getCampaignInviteUrl('b1')).toBe('https://t.me/+LXIu4QsAL1JlYjhi');
    expect(getCampaignInviteUrl('a2')).toBe('https://t.me/+jsYsKQDSr7k0YWVi');
    expect(getCampaignInviteUrl('b2')).toBe('https://t.me/+05ZAcrq7yVk5MzYy');
    expect(getCampaignInviteUrl('direct')).toBe('https://t.me/+sjptc0-DcIYyNGVi');
  });

  it('validates campaign identifiers correctly', () => {
    expect(isValidCampaign('a1')).toBe(true);
    expect(isValidCampaign('b1')).toBe(true);
    expect(isValidCampaign('a2')).toBe(true);
    expect(isValidCampaign('b2')).toBe(true);
    expect(isValidCampaign('c1')).toBe(false);
    expect(isValidCampaign('direct')).toBe(false);
    expect(isValidCampaign('')).toBe(false);
  });

  it('returns direct and default link when visited root without storage', () => {
    currentPath = '/';
    const campaign = getActiveCampaign();
    expect(campaign.testKey).toBe('direct');
    expect(campaign.inviteUrl).toBe(TELEGRAM_CAMPAIGN_LINKS.default);
  });

  it('detects /a1 from pathname and stores it in localStorage', () => {
    currentPath = '/a1';
    const campaign = getActiveCampaign();
    expect(campaign.testKey).toBe('a1');
    expect(campaign.inviteUrl).toBe(TELEGRAM_CAMPAIGN_LINKS.a1);

    const stored = JSON.parse(mockStore[CAMPAIGN_STORAGE_KEY] || '{}');
    expect(stored.s).toBe('a1');
  });

  it('detects /b1 from pathname and provides b1 channel link', () => {
    currentPath = '/b1';
    const campaign = getActiveCampaign();
    expect(campaign.testKey).toBe('b1');
    expect(campaign.inviteUrl).toBe(TELEGRAM_CAMPAIGN_LINKS.b1);
  });

  it('switches campaign when visiting /b1 after visiting /a1', () => {
    // 1. Visit /a1
    currentPath = '/a1';
    const firstVisit = getActiveCampaign();
    expect(firstVisit.testKey).toBe('a1');

    // 2. Visit /b1 explicitly
    currentPath = '/b1';
    const secondVisit = getActiveCampaign();
    expect(secondVisit.testKey).toBe('b1');
    expect(secondVisit.inviteUrl).toBe(TELEGRAM_CAMPAIGN_LINKS.b1);

    // 3. Navigate back to root / (should remember b1)
    currentPath = '/';
    const rootVisit = getActiveCampaign();
    expect(rootVisit.testKey).toBe('b1');
    expect(rootVisit.inviteUrl).toBe(TELEGRAM_CAMPAIGN_LINKS.b1);
  });

  it('detects campaign from query parameter ?src=a2', () => {
    currentPath = '/';
    currentSearch = '?src=a2';
    const campaign = getActiveCampaign();
    expect(campaign.testKey).toBe('a2');
    expect(campaign.inviteUrl).toBe(TELEGRAM_CAMPAIGN_LINKS.a2);
  });

  it('ignores expired campaign in localStorage', () => {
    const expiredPayload = { s: 'b2', t: Date.now() - (CAMPAIGN_TTL_MS + 1000) };
    mockStore[CAMPAIGN_STORAGE_KEY] = JSON.stringify(expiredPayload);

    currentPath = '/';
    currentSearch = '';
    const campaign = getActiveCampaign();
    expect(campaign.testKey).toBe('direct');
    expect(campaign.inviteUrl).toBe(TELEGRAM_CAMPAIGN_LINKS.default);
  });
});
