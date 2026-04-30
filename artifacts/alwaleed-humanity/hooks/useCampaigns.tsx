import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { seedCampaigns, seedNews, type Campaign, type NewsItem } from "@/data/seed";

const CAMPAIGNS_KEY = "@alwaleed/campaigns/v1";
const NEWS_KEY = "@alwaleed/news/v1";
const SAVED_KEY = "@alwaleed/saved/v1";

type CampaignsContextValue = {
  campaigns: Campaign[];
  news: NewsItem[];
  savedIds: string[];
  loaded: boolean;
  toggleSave: (id: string) => Promise<void>;
  isSaved: (id: string) => boolean;
};

const CampaignsContext = createContext<CampaignsContextValue | null>(null);

export function CampaignsProvider({ children }: { children: React.ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [campaignsRaw, newsRaw, savedRaw] = await Promise.all([
          AsyncStorage.getItem(CAMPAIGNS_KEY),
          AsyncStorage.getItem(NEWS_KEY),
          AsyncStorage.getItem(SAVED_KEY),
        ]);

        if (cancelled) return;

        const cachedCampaigns = campaignsRaw
          ? (JSON.parse(campaignsRaw) as Campaign[])
          : seedCampaigns;
        const cachedNews = newsRaw
          ? (JSON.parse(newsRaw) as NewsItem[])
          : seedNews;
        const cachedSaved = savedRaw ? (JSON.parse(savedRaw) as string[]) : [];

        setCampaigns(cachedCampaigns);
        setNews(cachedNews);
        setSavedIds(cachedSaved);
        setLoaded(true);

        if (!campaignsRaw) {
          await AsyncStorage.setItem(
            CAMPAIGNS_KEY,
            JSON.stringify(seedCampaigns),
          );
        }
        if (!newsRaw) {
          await AsyncStorage.setItem(NEWS_KEY, JSON.stringify(seedNews));
        }
      } catch {
        if (cancelled) return;
        setCampaigns(seedCampaigns);
        setNews(seedNews);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSave = useCallback(async (id: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const isSaved = useCallback(
    (id: string) => savedIds.includes(id),
    [savedIds],
  );

  return (
    <CampaignsContext.Provider
      value={{ campaigns, news, savedIds, loaded, toggleSave, isSaved }}
    >
      {children}
    </CampaignsContext.Provider>
  );
}

export function useCampaigns() {
  const ctx = useContext(CampaignsContext);
  if (!ctx)
    throw new Error("useCampaigns must be used within CampaignsProvider");
  return ctx;
}
