export type DistrictDef = {
  code: string;
  name: string;
  colSpan?: number;
};

export type ProvinceDef = {
  code: string;
  name: string;
  /** CSS grid-area shorthand: "row-start / col-start / row-end / col-end" */
  gridArea: string;
  innerCols: number;
  districts: DistrictDef[];
};

// ---------------------------------------------------------------------------
// 16-column outer grid
// ---------------------------------------------------------------------------
// Row bands:
//   1-6  : 수도권 (인천/서울/경기/강원)
//   7-9  : 충청 (충남/세종/대전/충북)
//  10-11 : 전북/대구/울산
//  12-14 : 광주/전남/경남/경북(남부)/부산
//  15    : 제주
//
// Province gridArea: "rowStart / colStart / rowEnd / colEnd"  (end = exclusive)
// ---------------------------------------------------------------------------

export const KOREA_MAP_LAYOUT: ProvinceDef[] = [
  // ── 인천 ────────────────────────────────────────────────
  {
    code: "50124",
    name: "인천",
    gridArea: "1 / 1 / 6 / 3",
    innerCols: 2,
    districts: [
      { code: "50131", name: "서구" },
      { code: "50130", name: "계양구" },
      { code: "50126", name: "동구" },
      { code: "50129", name: "부평구" },
      { code: "50254", name: "미추홀구" },
      { code: "50128", name: "남동구" },
      { code: "50125", name: "중구" },
      { code: "50127", name: "연수구" },
    ],
  },

  // ── 서울 ────────────────────────────────────────────────
  {
    code: "50008",
    name: "서울",
    gridArea: "1 / 3 / 6 / 8",
    innerCols: 5,
    districts: [
      { code: "50056", name: "은평구" },
      { code: "50051", name: "성북구" },
      { code: "50052", name: "강북구" },
      { code: "50053", name: "도봉구" },
      { code: "50054", name: "노원구" },
      { code: "50057", name: "서대문구" },
      { code: "50044", name: "중구" },
      { code: "50043", name: "종로구" },
      { code: "50049", name: "동대문구" },
      { code: "50050", name: "중랑구" },
      { code: "50058", name: "마포구" },
      { code: "50045", name: "용산구" },
      { code: "50047", name: "성동구" },
      { code: "50048", name: "광진구" },
      { code: "50070", name: "강동구" },
      { code: "50060", name: "양천구" },
      { code: "50061", name: "강서구" },
      { code: "50062", name: "구로구" },
      { code: "50064", name: "영등포구" },
      { code: "50065", name: "동작구" },
      { code: "50063", name: "금천구" },
      { code: "50066", name: "관악구" },
      { code: "50067", name: "서초구" },
      { code: "50068", name: "강남구" },
      { code: "50069", name: "송파구" },
    ],
  },

  // ── 경기 ────────────────────────────────────────────────
  {
    code: "50016",
    name: "경기",
    gridArea: "1 / 8 / 7 / 13",
    innerCols: 5,
    districts: [
      // 경원권 (북부)
      { code: "50120", name: "의정부시" },
      { code: "50122", name: "양주시" },
      { code: "50121", name: "동두천시" },
      { code: "50123", name: "포천시" },
      { code: "50107", name: "남양주시" },
      // 경의권
      { code: "50253", name: "파주시" },
      { code: "50115", name: "덕양구", colSpan: 1 },
      { code: "50116", name: "일산동구" },
      { code: "50117", name: "일산서구" },
      { code: "50106", name: "구리시" },
      // 경의권 김포
      { code: "50118", name: "김포시" },
      { code: "50114", name: "고양시" },
      { code: "50108", name: "하남시" },
      { code: "50109", name: "광주시" },
      { code: "50112", name: "여주시" },
      // 서해안권
      { code: "50093", name: "부천시" },
      { code: "50097", name: "광명시" },
      { code: "50103", name: "시흥시" },
      { code: "50111", name: "이천시" },
      { code: "50081", name: "안성시" },
      // 경부1권
      { code: "50073", name: "만안구" },
      { code: "50074", name: "동안구" },
      { code: "50075", name: "군포시" },
      { code: "50076", name: "의왕시" },
      { code: "50071", name: "과천시" },
      // 경부2권 수원
      { code: "50084", name: "장안구" },
      { code: "50085", name: "권선구" },
      { code: "50086", name: "팔달구" },
      { code: "50087", name: "영통구" },
      { code: "50098", name: "평택시" },
      // 성남
      { code: "50078", name: "수정구" },
      { code: "50079", name: "중원구" },
      { code: "50080", name: "분당구" },
      { code: "50089", name: "처인구" },
      { code: "50102", name: "오산시" },
      // 안산
      { code: "50100", name: "단원구" },
      { code: "50101", name: "상록구" },
      { code: "50090", name: "기흥구" },
      { code: "50091", name: "수지구" },
      { code: "50104", name: "화성시" },
      // 나머지
      { code: "50099", name: "안산시" },
      { code: "50083", name: "수원시" },
      { code: "50088", name: "용인시" },
      { code: "50072", name: "안양시" },
      { code: "50077", name: "성남시" },
    ],
  },

  // ── 강원 ────────────────────────────────────────────────
  {
    code: "50177",
    name: "강원",
    gridArea: "1 / 13 / 6 / 17",
    innerCols: 2,
    districts: [
      { code: "50178", name: "춘천시" },
      { code: "50182", name: "속초시" },
      { code: "50179", name: "원주시" },
      { code: "50180", name: "강릉시" },
      { code: "50181", name: "동해시" },
      { code: "50183", name: "삼척시" },
      { code: "50184", name: "홍천군" },
    ],
  },

  // ── 충남 ────────────────────────────────────────────────
  {
    code: "50194",
    name: "충남",
    gridArea: "7 / 1 / 10 / 4",
    innerCols: 3,
    districts: [
      { code: "50206", name: "서산시" },
      { code: "50203", name: "당진시" },
      { code: "50200", name: "아산시" },
      { code: "50204", name: "홍성군" },
      { code: "50198", name: "공주시" },
      { code: "50196", name: "동남구" },
      { code: "50199", name: "보령시" },
      { code: "50201", name: "논산시" },
      { code: "50197", name: "서북구" },
      { code: "50205", name: "태안군" },
      { code: "50202", name: "계룡시" },
    ],
  },

  // ── 세종 ────────────────────────────────────────────────
  {
    code: "50033",
    name: "세종",
    gridArea: "7 / 4 / 10 / 6",
    innerCols: 1,
    districts: [],
  },

  // ── 대전 ────────────────────────────────────────────────
  {
    code: "50165",
    name: "대전",
    gridArea: "7 / 6 / 10 / 9",
    innerCols: 3,
    districts: [
      { code: "50168", name: "서구" },
      { code: "50167", name: "중구" },
      { code: "50166", name: "동구" },
      { code: "50169", name: "유성구" },
      { code: "50170", name: "대덕구" },
    ],
  },

  // ── 충북 ────────────────────────────────────────────────
  {
    code: "50185",
    name: "충북",
    gridArea: "7 / 9 / 10 / 13",
    innerCols: 4,
    districts: [
      { code: "50187", name: "상당구" },
      { code: "50188", name: "서원구" },
      { code: "50189", name: "흥덕구" },
      { code: "50190", name: "청원구" },
      { code: "50191", name: "충주시" },
      { code: "50192", name: "제천시" },
      { code: "50193", name: "음성군" },
    ],
  },

  // ── 전북 ────────────────────────────────────────────────
  {
    code: "50207",
    name: "전북",
    gridArea: "10 / 1 / 12 / 4",
    innerCols: 3,
    districts: [
      { code: "50209", name: "완산구" },
      { code: "50210", name: "덕진구" },
      { code: "50211", name: "익산시" },
      { code: "50212", name: "군산시" },
      { code: "50213", name: "정읍시" },
      { code: "50214", name: "남원시" },
      { code: "50215", name: "김제시" },
    ],
  },

  // ── 대구 ────────────────────────────────────────────────
  {
    code: "50150",
    name: "대구",
    gridArea: "10 / 5 / 12 / 8",
    innerCols: 3,
    districts: [
      { code: "50153", name: "서구" },
      { code: "50151", name: "중구" },
      { code: "50152", name: "동구" },
      { code: "50155", name: "북구" },
      { code: "50156", name: "수성구" },
      { code: "50157", name: "달서구" },
      { code: "50154", name: "남구" },
      { code: "50158", name: "달성군" },
    ],
  },

  // ── 경북 ────────────────────────────────────────────────
  {
    code: "50223",
    name: "경북",
    gridArea: "6 / 13 / 12 / 17",
    innerCols: 4,
    districts: [
      { code: "50225", name: "남구(포항)" },
      { code: "50226", name: "북구(포항)" },
      { code: "50229", name: "안동시" },
      { code: "50231", name: "영주시" },
      { code: "50227", name: "경주시" },
      { code: "50228", name: "김천시" },
      { code: "50230", name: "구미시" },
      { code: "50233", name: "상주시" },
      { code: "50232", name: "영천시" },
      { code: "50234", name: "경산시" },
      { code: "50235", name: "칠곡군" },
      { code: "50236", name: "울릉군" },
    ],
  },

  // ── 울산 ────────────────────────────────────────────────
  {
    code: "50171",
    name: "울산",
    gridArea: "10 / 9 / 12 / 13",
    innerCols: 3,
    districts: [
      { code: "50172", name: "중구" },
      { code: "50173", name: "남구" },
      { code: "50174", name: "동구" },
      { code: "50175", name: "북구" },
      { code: "50176", name: "울주군" },
    ],
  },

  // ── 광주 ────────────────────────────────────────────────
  {
    code: "50159",
    name: "광주",
    gridArea: "12 / 1 / 15 / 3",
    innerCols: 2,
    districts: [
      { code: "50163", name: "북구" },
      { code: "50164", name: "광산구" },
      { code: "50160", name: "동구" },
      { code: "50161", name: "서구" },
      { code: "50162", name: "남구" },
    ],
  },

  // ── 전남 ────────────────────────────────────────────────
  {
    code: "50216",
    name: "전남",
    gridArea: "12 / 3 / 15 / 6",
    innerCols: 2,
    districts: [
      { code: "50222", name: "무안군" },
      { code: "50217", name: "목포시" },
      { code: "50220", name: "나주시" },
      { code: "50221", name: "광양시" },
      { code: "50218", name: "여수시" },
      { code: "50219", name: "순천시" },
    ],
  },

  // ── 경남 ────────────────────────────────────────────────
  {
    code: "50237",
    name: "경남",
    gridArea: "12 / 6 / 15 / 13",
    innerCols: 5,
    districts: [
      { code: "50239", name: "의창구" },
      { code: "50240", name: "성산구" },
      { code: "50241", name: "마산합포구" },
      { code: "50242", name: "마산회원구" },
      { code: "50243", name: "진해구" },
      { code: "50244", name: "진주시" },
      { code: "50247", name: "김해시" },
      { code: "50245", name: "통영시" },
      { code: "50248", name: "밀양시" },
      { code: "50246", name: "사천시" },
      { code: "50249", name: "거제시" },
      { code: "50255", name: "양산시" },
    ],
  },

  // ── 부산 ────────────────────────────────────────────────
  {
    code: "50025",
    name: "부산",
    gridArea: "12 / 13 / 15 / 17",
    innerCols: 4,
    districts: [
      { code: "50143", name: "금정구" },
      { code: "50142", name: "동래구" },
      { code: "50138", name: "연제구" },
      { code: "50139", name: "수영구" },
      { code: "50141", name: "해운대구" },
      { code: "50136", name: "부산진구" },
      { code: "50148", name: "강서구" },
      { code: "50144", name: "기장군" },
      { code: "50146", name: "북구" },
      { code: "50149", name: "사상구" },
      { code: "50147", name: "사하구" },
      { code: "50134", name: "동구" },
      { code: "50137", name: "남구" },
      { code: "50133", name: "서구" },
      { code: "50135", name: "영도구" },
      { code: "50132", name: "중구" },
    ],
  },

  // ── 제주 ────────────────────────────────────────────────
  {
    code: "50250",
    name: "제주",
    gridArea: "15 / 1 / 16 / 4",
    innerCols: 2,
    districts: [
      { code: "50251", name: "제주시" },
      { code: "50252", name: "서귀포시" },
    ],
  },
];

// 집계 셀 (전국/수도권/지방)
export const AGGREGATE_CELLS = [
  { code: "50001", name: "전국" },
  { code: "50002", name: "수도권" },
  { code: "50003", name: "지방" },
];

// 지도에 필요한 모든 region code (flat)
export const MAP_REGION_CODES: string[] = [
  ...AGGREGATE_CELLS.map((c) => c.code),
  ...KOREA_MAP_LAYOUT.flatMap((p) => [
    p.code,
    ...p.districts.map((d) => d.code),
  ]),
];
