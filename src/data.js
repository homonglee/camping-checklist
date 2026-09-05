export const CAMPING_TYPES = [
  { id: 'backpacking', name: '백패킹', icon: '🎒', description: '가볍게 짊어지고 떠나요' },
  { id: 'auto', name: '오토캠핑', icon: '🚙', description: '차량 옆에 넉넉하게' },
  { id: 'car', name: '차박캠핑', icon: '🚐', description: '차 안을 아늑한 숙소로' },
  { id: 'caravan', name: '카라반', icon: '🏕️', description: '카라반 시설을 활용해요' },
  { id: 'motorhome', name: '모터홈', icon: '🚌', description: '집처럼 편안한 캠핑카' },
];

export const CATEGORIES = [
  { id: 'shelter', name: '주거', icon: '⛺' },
  { id: 'sleep', name: '침구', icon: '🛏️' },
  { id: 'cooking', name: '취사', icon: '🍳' },
  { id: 'food', name: '식재료', icon: '🥕' },
  { id: 'clothing', name: '의류', icon: '👕' },
  { id: 'hygiene', name: '위생', icon: '🧼' },
  { id: 'safety', name: '안전·의약', icon: '🩹' },
  { id: 'power', name: '조명·전원', icon: '🔋' },
  { id: 'tools', name: '도구·정리', icon: '🧰' },
  { id: 'leisure', name: '여가·기타', icon: '🎲' },
];

const R = 'required', M = 'recommended', O = 'optional', X = 'excluded';
const all = (value = M) => Object.fromEntries(CAMPING_TYPES.map(type => [type.id, value]));
const rel = (overrides = {}, base = M) => ({ ...all(base), ...overrides });
const item = (id, name, category, quantityRule = 'fixed', relevance = all()) => ({ id, name, category, quantityRule, relevance });

const shelter = [
  item('tent','텐트','shelter','fixed',rel({backpacking:X,motorhome:X,caravan:X},R)),
  item('light-tent','경량 텐트','shelter','fixed',rel({backpacking:R},X)),
  item('ground-sheet','그라운드시트','shelter','fixed',rel({backpacking:R,auto:R,car:M,caravan:X,motorhome:X})),
  item('tarp','타프','shelter','fixed',rel({backpacking:O,auto:M,car:M,caravan:O,motorhome:O})),
  item('awning','어닝','shelter','fixed',rel({caravan:M,motorhome:M},X)),
  item('tent-poles','텐트 폴','shelter','fixed',rel({backpacking:R,auto:R,car:O,caravan:X,motorhome:X})),
  item('pegs','팩','shelter','fixed',rel({backpacking:R,auto:R,car:M,caravan:O,motorhome:O})),
  item('guyline','스트링·로프','shelter','fixed',rel({backpacking:R,auto:R,car:M,caravan:O,motorhome:O})),
  item('peg-hammer','팩 해머','shelter','fixed',rel({backpacking:O,auto:R,car:M,caravan:O,motorhome:O})),
  item('wind-break','윈드스크린','shelter','fixed',rel({},O)),
  item('car-tail-tent','도킹 텐트','shelter','fixed',rel({car:M},X)),
  item('car-window-screen','차량 창문 가림막','shelter','fixed',rel({car:M,motorhome:O},X)),
  item('mosquito-net','모기장','shelter','fixed',rel({backpacking:M,auto:M,car:M,caravan:O,motorhome:O})),
  item('door-mat','출입구 매트','shelter','fixed',rel({auto:M,car:M,caravan:M,motorhome:M},O)),
  item('leveling-block','레벨링 블록','shelter','fixed',rel({caravan:R,motorhome:R,car:M},X)),
  item('wheel-chock','휠 초크','shelter','fixed',rel({caravan:R,motorhome:R},X)),
  item('external-mat','외부 매트','shelter','fixed',rel({caravan:M,motorhome:M,auto:O,car:O},X)),
  item('repair-patch','텐트 수선 패치','shelter','fixed',rel({backpacking:M,auto:M,car:O},X)),
];
const sleep = [
  ['sleeping-bag','침낭'],['light-sleeping-bag','경량 침낭'],['winter-bag','동계 침낭'],['camp-mat','캠핑 매트'],['light-mat','경량 매트'],['air-mattress','에어매트'],['air-pump','에어펌프'],['camp-pillow','캠핑 베개'],['blanket','담요'],['liner','침낭 라이너'],['cot','야전침대'],['bed-sheet','침대 시트'],['duvet','이불'],['sleepwear','잠옷'],['earplugs','귀마개'],['eye-mask','수면안대'],['hot-water-bag','보온 물주머니'],['electric-blanket','전기요']
].map(([id,name],i)=>item(id,name,'sleep',i===13?'person':'fixed',rel({backpacking:['air-mattress','air-pump','cot','bed-sheet','duvet','electric-blanket'].includes(id)?X:(id.startsWith('light-')?R:M),auto:['sleeping-bag','camp-mat'].includes(id)?R:M,car:['air-mattress','air-pump'].includes(id)?R:M,caravan:['bed-sheet','duvet'].includes(id)?R:M,motorhome:['bed-sheet','duvet'].includes(id)?R:M})));
const cookingNames = [['burner','버너'],['fuel','연료'],['cookset','코펠'],['tableware','식기 세트'],['cutlery','수저'],['mug','컵·머그'],['frying-pan','프라이팬'],['pot','냄비'],['kettle','주전자'],['knife','조리용 칼'],['cutting-board','도마'],['tongs','집게'],['ladle','국자'],['spatula','뒤집개'],['cooler','아이스박스'],['cooler-pack','아이스팩'],['dish-rack','식기 건조망'],['coffee-kit','커피 도구']];
const cooking = cookingNames.map(([id,name])=>item(id,name,'cooking',['tableware','cutlery','mug'].includes(id)?'person':'fixed',rel({backpacking:['frying-pan','pot','kettle','dish-rack'].includes(id)?O:M,auto:['burner','fuel','cookset','tableware'].includes(id)?R:M,caravan:['burner','fuel'].includes(id)?O:M,motorhome:['burner','fuel'].includes(id)?O:M})));
const foodNames = [['water','생수','personDay'],['rice','쌀·즉석밥','personDay'],['main-food','주요 식재료','personDay'],['snacks','간식','personDay'],['breakfast','아침 식재료','personDay'],['ramen','라면','personDay'],['coffee','커피·차','personDay'],['beverage','음료','personDay'],['seasoning','기본 양념','fixed'],['cooking-oil','식용유','fixed'],['salt-pepper','소금·후추','fixed'],['sauce','소스류','fixed'],['kimchi','김치·반찬','personDay'],['fruit','과일','personDay'],['ice','얼음','day'],['emergency-food','비상식량','person'],['pet-food','반려동물 사료','personDay'],['water-filter','휴대용 정수 필터','fixed']];
const food = foodNames.map(([id,name,q])=>item(id,name,'food',q,rel({backpacking:['water-filter','emergency-food'].includes(id)?M:M},M)));
const clothingNames = [['underwear','속옷','personDay'],['socks','양말','personDay'],['tshirt','상의','personDay'],['pants','하의','person'],['jacket','겉옷','person'],['raincoat','우의','person'],['hat','모자','person'],['camp-shoes','캠핑화','person'],['slippers','슬리퍼','person'],['thermal-wear','내복','person'],['fleece','플리스','person'],['down-jacket','패딩','person'],['gloves','장갑','person'],['neck-warmer','넥워머','person'],['swimsuit','수영복','person'],['spare-clothes','여벌옷','person'],['laundry-bag','세탁물 주머니','person'],['sunglasses','선글라스','person']];
const clothing = clothingNames.map(([id,name,q])=>item(id,name,'clothing',q,rel({},['underwear','socks','tshirt','jacket','camp-shoes'].includes(id)?R:M)));
const hygieneNames = [['towel','수건','personDay'],['toothbrush','칫솔','person'],['toothpaste','치약','fixed'],['soap','비누·바디워시','fixed'],['shampoo','샴푸','fixed'],['toilet-paper','화장지','day'],['wet-wipes','물티슈','day'],['tissue','티슈','day'],['hand-sanitizer','손 소독제','fixed'],['sunscreen','선크림','fixed'],['insect-repellent','벌레 기피제','fixed'],['mosquito-coil','모기향','day'],['personal-care','개인 화장품','person'],['comb','빗','fixed'],['razor','면도기','person'],['sanitary-products','여성용품','person'],['portable-shower','휴대용 샤워기','fixed'],['portable-toilet','휴대용 화장실','fixed']];
const hygiene = hygieneNames.map(([id,name,q])=>item(id,name,'hygiene',q,rel({backpacking:['portable-shower','portable-toilet'].includes(id)?X:M,caravan:['portable-shower','portable-toilet'].includes(id)?O:M,motorhome:['portable-shower','portable-toilet'].includes(id)?O:M},M)));
const safetyNames = [['first-aid','구급상자'],['personal-medicine','개인 상비약'],['painkiller','진통제'],['digestive','소화제'],['bandage','밴드·거즈'],['disinfectant','소독약'],['tweezers','핀셋'],['tick-remover','진드기 제거기'],['emergency-blanket','비상 보온포'],['whistle','호루라기'],['fire-extinguisher','소화기'],['fire-blanket','방화포'],['carbon-detector','일산화탄소 경보기'],['head-net','방충 헤드넷'],['ice-pack-medical','냉찜질팩'],['emergency-contact','비상 연락처 카드'],['insurance-card','보험증·신분증'],['flashlight-emergency','비상 손전등']];
const safety = safetyNames.map(([id,name])=>item(id,name,'safety',id==='personal-medicine'?'person':'fixed',rel({backpacking:['fire-extinguisher','fire-blanket','carbon-detector'].includes(id)?X:M,auto:['first-aid','fire-extinguisher'].includes(id)?R:M,caravan:['first-aid','fire-extinguisher','carbon-detector'].includes(id)?R:M,motorhome:['first-aid','fire-extinguisher','carbon-detector'].includes(id)?R:M},M)));
const powerNames = [['headlamp','헤드랜턴'],['lantern','랜턴'],['spare-battery','예비 건전지'],['power-bank','휴대용 배터리'],['charging-cable','충전 케이블'],['multi-charger','멀티 충전기'],['extension-cord','연장선'],['power-strip','멀티탭'],['site-power-cable','전원 케이블'],['power-adapter','전원 어댑터'],['portable-power','파워뱅크'],['solar-panel','휴대용 태양광 패널'],['inverter','인버터'],['car-charger','차량용 충전기'],['string-light','스트링 조명'],['flashlight','손전등'],['usb-fan','USB 선풍기'],['electric-heater','전기 히터']];
const power = powerNames.map(([id,name])=>item(id,name,'power',id==='power-bank'?'person':'fixed',rel({backpacking:['headlamp','power-bank'].includes(id)?R:(['extension-cord','power-strip','site-power-cable','inverter','electric-heater'].includes(id)?X:M),auto:['lantern','power-bank'].includes(id)?R:M,car:['car-charger','power-bank'].includes(id)?R:M,caravan:id==='site-power-cable'?R:M,motorhome:id==='site-power-cable'?R:M})));
const toolsNames = [['trash-bag','쓰레기봉투','day'],['recycling-bag','분리수거 봉투','day'],['storage-box','수납 박스','fixed'],['zip-bag','지퍼백','day'],['foil','알루미늄 포일','fixed'],['paper-towel','키친타월','day'],['dish-soap','주방세제','fixed'],['sponge','수세미','fixed'],['work-gloves','작업 장갑','person'],['multi-tool','멀티툴','fixed'],['duct-tape','덕트 테이프','fixed'],['cable-tie','케이블 타이','fixed'],['shovel','야전삽','fixed'],['water-container','물통','fixed'],['fresh-water-hose','급수호스','fixed'],['waste-water-hose','오수호스','fixed'],['broom','미니 빗자루','fixed'],['drying-line','빨랫줄','fixed']];
const tools = toolsNames.map(([id,name,q])=>item(id,name,'tools',q,rel({backpacking:['storage-box','shovel','fresh-water-hose','waste-water-hose','broom'].includes(id)?X:M,caravan:['fresh-water-hose','waste-water-hose'].includes(id)?R:M,motorhome:['fresh-water-hose','waste-water-hose'].includes(id)?R:M},M)));
const leisureNames = [['camp-chair','캠핑 의자','person'],['camp-table','캠핑 테이블','fixed'],['hammock','해먹','fixed'],['book','책','person'],['board-game','보드게임','fixed'],['playing-cards','카드','fixed'],['speaker','블루투스 스피커','fixed'],['camera','카메라','fixed'],['binoculars','쌍안경','fixed'],['fishing-gear','낚시 도구','fixed'],['trekking-poles','트레킹 폴','person'],['map','지도','fixed'],['compass','나침반','fixed'],['notebook','노트·펜','fixed'],['firewood','장작','day'],['fire-pit','화로대','fixed'],['grill','그릴','fixed'],['pet-gear','반려동물 용품','fixed']];
const leisure = leisureNames.map(([id,name,q])=>item(id,name,'leisure',q,rel({backpacking:['trekking-poles','map','compass'].includes(id)?R:(['camp-table','firewood','fire-pit','grill'].includes(id)?X:O),auto:['camp-chair','camp-table'].includes(id)?R:M,car:['camp-chair','camp-table'].includes(id)?M:M},O)));

export const MASTER_ITEMS = [...shelter,...sleep,...cooking,...food,...clothing,...hygiene,...safety,...power,...tools,...leisure];
export const IMPORTANCE = { required: { label: '필수', icon: '🔴' }, recommended: { label: '추천', icon: '🟡' }, optional: { label: '선택', icon: '⚪' } };
