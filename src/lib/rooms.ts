import type { AwardLevel, FrameKind, Grade, HangSize, Room, RoomId } from "./types";

export const ROOMS: Room[] = [
  {
    id: "science",
    numeral: "I",
    name: "格物",
    theme: "科创与探究",
    en: "Inquiry & Invention",
    intro:
      "格物致知。一次追问，一场实验，一台在深夜还在调试的小机器——好奇心，是最早亮起的那盏灯。",
    wall: "#26343d",
  },
  {
    id: "arts",
    numeral: "II",
    name: "游艺",
    theme: "美术与手艺",
    en: "Arts & Crafts",
    intro:
      "志于道，游于艺。笔墨、油彩、剪刀与陶泥，在少年手里慢慢有了温度，也有了自己的脾气。",
    wall: "#4a2527",
  },
  {
    id: "letters",
    numeral: "III",
    name: "青简",
    theme: "文学与思辨",
    en: "Letters & Debate",
    intro:
      "竹简泛青，字句生光。认真写下的每一段文字、据理力争的每一个问题，都是少年第一次郑重地发声。",
    wall: "#243830",
  },
  {
    id: "practice",
    numeral: "IV",
    name: "行远",
    theme: "实践与公益",
    en: "Fieldwork & Service",
    intro:
      "行远自迩。走进街巷、河岸与社区，把课本之外的世界，一笔一笔画进自己的地图。",
    wall: "#45382a",
  },
  {
    id: "sports",
    numeral: "V",
    name: "破风",
    theme: "体育与棋艺",
    en: "Sport & Strategy",
    intro:
      "破风而行，落子无悔。操场上的汗水与棋盘前的静气，同样值得被郑重陈列。",
    wall: "#1f3a3c",
  },
];

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((r) => [r.id, r])) as Record<RoomId, Room>;

export const GRADES: Grade[] = ["初一", "初二", "初三", "高一", "高二", "高三"];

export const AWARD_LEVELS: AwardLevel[] = ["国家级", "省级", "市级", "区级", "校级"];

export const FRAME_OPTIONS: { value: FrameKind; label: string; hint: string }[] = [
  { value: "gilt", label: "金色雕花框", hint: "油画、重彩，最隆重的陈列" },
  { value: "oak", label: "原木画框", hint: "地图、纪实照片、手稿" },
  { value: "black", label: "黑框 · 白卡纸", hint: "摄影、版画、科学影像" },
  { value: "white", label: "白框 · 宽卡纸", hint: "自然笔记、素描、纸本小品" },
  { value: "float", label: "无框悬浮", hint: "当代感的显微、数码影像" },
  { value: "shadowbox", label: "深框画箱", hint: "书籍、剪纸、实物小件" },
  { value: "scroll", label: "立轴装裱", hint: "水墨、书法" },
  { value: "clip", label: "夹挂手稿", hint: "作文、诗稿、设计草图" },
  { value: "plinth", label: "展台玻璃罩", hint: "机器人、陶艺等立体作品" },
];

export const SIZE_OPTIONS: { value: HangSize; label: string }[] = [
  { value: "sm", label: "小幅" },
  { value: "md", label: "中幅" },
  { value: "lg", label: "大幅" },
];
