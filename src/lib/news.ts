import { parse } from "yaml";
import newsRaw from "../data/news.yml?raw";

export type NewsCategory =
  | "paper"
  | "ranking"
  | "education"
  | "entrepreneurship"
  | "award"
  | "business";

type RawNewsItem = {
  date: string | number;
  dateEn?: string;
  category: NewsCategory;
  text: string;
  textEn?: string;
  strong?: string[];
  strongEn?: string[];
  link?: { label: string; labelEn?: string; href: string };
  links?: Array<{ label: string; labelEn?: string; href: string }>;
};

export type NewsItem = {
  date: string | number;
  category: NewsCategory;
  text: string;
  strong: string[];
  links: Array<{ label: string; href: string }>;
};

const rawNews = (parse(newsRaw) ?? []) as RawNewsItem[];

export function getNews(locale: "zh" | "en" = "zh"): NewsItem[] {
  const isEnglish = locale === "en";

  return rawNews.map((item) => ({
    date: isEnglish ? item.dateEn ?? item.date : item.date,
    category: item.category,
    text: isEnglish ? item.textEn ?? item.text : item.text,
    strong: isEnglish ? item.strongEn ?? item.strong ?? [] : item.strong ?? [],
    links: (item.links ?? (item.link ? [item.link] : [])).map((link) => ({
      label: isEnglish ? link.labelEn ?? link.label : link.label,
      href: isEnglish && link.href.startsWith("/") ? `/en${link.href}` : link.href,
    })),
  }));
}

export function newsYear(item: NewsItem): string {
  const match = String(item.date).match(/\d{4}/);
  return match?.[0] ?? String(item.date);
}
