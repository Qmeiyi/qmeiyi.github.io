import { defineSiteConfig } from "./src/config/site";

export const siteConfig = defineSiteConfig({
  author: "强美伊",
  title: "强美伊 Meiyi Qiang｜研究与实践",
  siteUrl: "https://qmeiyi.github.io",
  language: "zh-CN",
  locale: "zh_CN",
  description: "强美伊的学术与项目主页：数据中心人工智能、大模型训练数据、开源项目和产业实践。",
  keywords: ["强美伊", "Meiyi Qiang", "数据中心人工智能", "大语言模型", "DataFlow", "DataFlex"],
  hero: {
    headline: "让高质量数据成为大模型进步的基础。",
    subheadline: "北京大学电子信息硕士在读，元枢智汇联合创始人。研究数据中心人工智能与大模型训练数据，参与开源系统建设，推动 AI 数据基础设施走向真实应用。",
    profileImage: "/profile.png",
    profileAlt: "强美伊的证件照",
    profileImageWidth: 188,
    profileImageHeight: 252,
    statusBadge: "研究 · 开源 · 创业",
  },
  affiliations: [
    { role: "电子信息硕士在读", institution: "北京大学" },
    { role: "联合创始人", institution: "元枢智汇", url: "https://originhub.tech/" },
  ],
  researchInterests: ["数据中心人工智能", "大模型训练数据", "数据选择", "数学推理与数据质量"],
  socialLinks: [
    { label: "Google Scholar", href: "https://scholar.google.com/citations?user=8g78CmwAAAAJ&hl=zh-CN", icon: "i-academicons:google-scholar" },
    { label: "GitHub", href: "https://github.com/Qmeiyi", icon: "i-mdi:github" },
    { label: "小红书", href: "https://xhslink.cn/o/84v0uHax500", icon: "i-mdi:book-open-variant" },
    { label: "邮件联系", href: "mailto:qiangmeiyi@gmail.com", icon: "i-mdi:email-outline" },
  ],
  navLinks: [
    { href: "/", label: "首页" },
    { href: "/about", label: "关于" },
    { href: "/researches", label: "研究成果" },
    { href: "/projects", label: "项目实践" },
  ],
  footer: { showProfileLinks: true, showAuthor: true, copyright: "保留所有权利。" },
  pageTitles: {
    about: { title: "关于我", description: "教育背景、研究经历、产业实践与荣誉。" },
    researches: { title: "研究成果", description: "精选论文与预印本；论文状态以正式出版页面为准。" },
    projects: { title: "项目实践", description: "从研究方法到可用工具：开源系统与产业实践。" },
  },
  homeBlocks: {
    hero: { enabled: true },
    showcase: { enabled: true, title: "代表项目", description: "研究成果的工程化与开源实践" },
    publications: { enabled: true, title: "精选研究", description: "数据质量、数学推理与大模型训练" },
    posts: { enabled: false },
  },
});

export default siteConfig;
