const B = 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new'

const makeStats = (type, rank, isUnderground = false) => {
  let base = rank === 'CHAMP' ? 88 : rank === '1위' ? 84 : rank === '2위' ? 81 : rank === '3위' ? 78 : rank === '4위' ? 75 : rank === '5위' ? 73 : rank === '6위' ? 71 : rank === '7위' ? 69 : rank === '8위' ? 67 : rank === '9위' ? 65 : 62
  if (isUnderground) base = Math.round(base * 0.6)
  if (type === 'G') return {
    gPower: base+4, gDefense: base+2, gSpeed: base-2,
    sPower: base-14, sDefense: base-10, sSpeed: base-12,
    chin: base+2, stamina: base+4,
  }
  if (type === 'S') return {
    gPower: base-14, gDefense: base-10, gSpeed: base-12,
    sPower: base+4, sDefense: base+2, sSpeed: base+2,
    chin: base-2, stamina: base,
  }
  return {
    gPower: base-4, gDefense: base-2, gSpeed: base-4,
    sPower: base-4, sDefense: base-2, sSpeed: base-2,
    chin: base, stamina: base+2,
  }
}

const specials = {
  G: ['takedownSpecial', 'armbar', 'rearNakedChoke'],
  S: ['elbow', 'elbowUpper', 'highKick'],
  W: ['kneeKick', 'clinch', 'lowKick'],
}

export const WEIGHT_CLASS_ORDER = ['여성 아톰급', '플라이급', '밴텀급', '페더급', '라이트급', '웰터급', '미들급', '헤비급']

export const getWeightDiff = (fighter1, fighter2) => {
  const idx1 = WEIGHT_CLASS_ORDER.indexOf(fighter1.weightClass)
  const idx2 = WEIGHT_CLASS_ORDER.indexOf(fighter2.weightClass)
  return idx2 - idx1 // 양수면 fighter2가 더 무거운 체급
}

export const applyWeightBonus = (fighter, opponent) => {
  const myIdx = WEIGHT_CLASS_ORDER.indexOf(fighter.weightClass)
  const oppIdx = WEIGHT_CLASS_ORDER.indexOf(opponent.weightClass)
  const diff = myIdx - oppIdx // 양수면 내가 더 무거운 체급
  const stats = { ...fighter.stats }

  if (diff > 0) {
    // 더 무거운 체급 → 체급 차이에 따라 파워/맷집 대폭 증가
    // 1단계: +8, 2단계: +18, 3단계: +30, 4단계: +44, 5단계: +60, 6단계: +78
    const bonus = diff * (diff + 1) * 4
    stats.sPower = Math.min(120, stats.sPower + bonus)
    stats.gPower = Math.min(120, stats.gPower + bonus)
    stats.chin = Math.min(120, stats.chin + bonus)
    stats.sDefense = Math.min(120, stats.sDefense + bonus * 0.7)
    stats.gDefense = Math.min(120, stats.gDefense + bonus * 0.7)
  } else if (diff < 0) {
    // 더 가벼운 체급 → 스피드만 소폭 증가 (체급 차이 만회 불가)
    const absDiff = Math.abs(diff)
    stats.sSpeed = Math.min(100, stats.sSpeed + absDiff * 3)
    stats.gSpeed = Math.min(100, stats.gSpeed + absDiff * 3)
  }

  return { ...fighter, stats }
}

const f = (id, nickname, name, record, rank, type, seq, ext = 'webp', isChamp = false, weightClass = '', height = 170, isUnderground = false) => ({
  id, nickname, name, record, rank, type, weightClass, height,
  isUnderground,
  img: `${B}/${seq}/${seq}_${isChamp ? 'rankingChamp' : 'ranking'}.${ext}`,
  stats: makeStats(type, rank, isUnderground),
  specials: specials[type],
})

export const FIGHTERS = {
  플라이급: [
    f('tank', '탱크', '코마키네 타카히로', '19-5-0', 'CHAMP', 'G', '71657127', 'webp', true, '플라이급', 164),
    f('indianking', '인디언킹', 'Gabriel Rodrigues', '7-1-0', '1위', 'W', '86478580', 'webp', false, '플라이급', 165),
    f('umawang', '우마왕', '우성훈', '12-4-0', '2위', 'S', '73873103', 'webp', false, '플라이급', 168),
    f('yunbanggwan', '윤방관', '윤호영', '7-5-1', '3위', 'S', '70398446', 'webp', false, '플라이급', 170),
    f('crocodile', '크로커다일', 'Elias da Cruz', '18-4-1', '4위', 'G', '88941727', 'webp', false, '플라이급', 167),
    f('kimgwanjang', '김관장', '김성재', '9-10-1', '5위', 'S', '77552285', 'webp', false, '플라이급', 170),
    f('viper', '바이퍼', '김성웅', '8-8-0', '6위', 'W', '31367195', 'webp', false, '플라이급', 175),
    f('anchovy', '앤쵸비', '박태호', '9-7-0', '7위', 'S', '92865695', 'webp', false, '플라이급', 176),
    f('amazonkid', '아마존 키드', 'Thomas Assis', '12-4-0', '8위', 'W', '31720294', 'png', false, '플라이급', 170),
    f('tugyeon', '투견', '정원희', '9-9-0', '9위', 'S', '27904723', 'webp', false, '플라이급', 168),
    f('boogyman', '부기맨', 'Rangel dos Santos', '12-6-1', '10위', 'S', '71736058', 'webp', false, '플라이급', 170),
    f('sniper', 'Sniper', 'Isiah Torres', '9-4-1', '랭커', 'S', '92748764', 'webp', false, '플라이급', 173),
    f('stanbaki', '스탄 바키', 'Bagylan Zhakansha', '7-2-0', '랭커', 'G', '21461249', 'webp', false, '플라이급', 163),
    f('mrchoke', 'Mr. Choke', '이민주', '5-5-0', '랭커', 'G', '81252890', 'webp', false, '플라이급', 168),
    f('captainhero', '캡틴 히어로', '이영웅', '4-0-0', '랭커', 'S', '51533588', 'webp', false, '플라이급', 167),
    f('borokl', '보로클', 'Gantumur Bayanduuren', '4-2-0', '랭커', 'W', '33169982', 'webp', false, '플라이급', 170),
    f('pitbull_fly', 'Pitbull', 'Tiago Xavier', '17-12-0', '랭커', 'W', '30038332', 'webp', false, '플라이급', 164),
    f('ninja_fly', 'Ninja', 'Yamasaki Sora', '7-2-0', '랭커', 'G', '69534617', 'webp', false, '플라이급', 170),
    f('metallee', 'Metal Lee', '핫토리 슈토', '2-1-0', '랭커', 'S', '43792974', 'png', false, '플라이급', 170),
    f('maddog_fly', '매드독', '김민우', '2-2-0', '랭커', 'W', '43483071', 'webp', false, '플라이급', 170),
    f('joker_fly', '조커', '정도한', '2-8-0', '랭커', 'W', '82156223', 'webp', false, '플라이급', 165),
    f('dokkaebi', '도깨비발', '이선하', '2-3-0', '랭커', 'S', '51837721', 'webp', false, '플라이급', 170),
    f('tigro', '티그로', '신창현', '3-1-0', '랭커', 'S', '54898276', 'webp', false, '플라이급', 174),
    f('baekgu', '백구', 'Rentsensenge Erkhembayar', '1-1-0', '랭커', 'W', '18063338', 'png', false, '플라이급', 165),
  ],
  밴텀급: [
    f('tusin', '투신', '김재웅', '16-8-0', 'CHAMP', 'W', '98660587', 'webp', true, '밴텀급', 173),
    f('fenrir', '펜리르', 'Daniiar Toichubek', '12-0-0', '1위', 'S', '39588679', 'webp', false, '밴텀급', 175),
    f('musa', '무사', '타케나카 다이치', '17-4-1', '2위', 'G', '64797565', 'webp', false, '밴텀급', 168),
    f('bbagse', '빡세', '이진세', '7-5-0', '3위', 'S', '37864698', 'webp', false, '밴텀급', 175),
    f('baeksaja', '백사자', 'Aydemir Kazbekov', '14-2-0', '4위', 'G', '21131458', 'webp', false, '밴텀급', 167),
    f('underdog', '언더독', '박성준', '7-6-1', '5위', 'S', '41530580', 'webp', false, '밴텀급', 172),
    f('bulldozer', '불도저', '정경열', '5-3-0', '6위', 'G', '83543030', 'webp', false, '밴텀급', 174),
    f('goldenboy', '골든보이', 'Matheus Correia', '12-0-0', '7위', 'W', '19848079', 'webp', false, '밴텀급', 167),
    f('kurdeagle', '쿠르드 이글', 'Ruslan Amuyev', '11-0-0', '8위', 'G', '89602277', 'webp', false, '밴텀급', 170),
    f('bigmouth', '빅마우스', '김동규', '10-7-0', '9위', 'W', '59174431', 'webp', false, '밴텀급', 171),
    f('rookie', 'Rookie', 'Mukai Rukiya', '6-2-0', '10위', 'S', '12138256', 'webp', false, '밴텀급', 163),
    f('ironhorse', 'Iron Horse', 'Felipe Gheno', '11-5-0', '랭커', 'S', '94299435', 'webp', false, '밴텀급', 170),
    f('guara', '구아라', 'Marcelo Guarilha', '25-11-1', '랭커', 'W', '75006829', 'webp', false, '밴텀급', 173),
    f('skull', '스컬', 'Ruslan Sariyev', '17-5-0', '랭커', 'S', '98413196', 'webp', false, '밴텀급', 176),
    f('inca', '잉카', 'Miguel Meza', '8-1-0', '랭커', 'W', '99424846', 'webp', false, '밴텀급', 173),
    f('holybeast', '홀리 비스트', '김대환', '15-12-1', '랭커', 'S', '16538110', 'webp', false, '밴텀급', 168),
    f('jjinhong', '찐홍이', '홍종태', '6-6-0', '랭커', 'G', '51495836', 'webp', false, '밴텀급', 171),
    f('lg', 'LG', 'Lake Gee', '9-0-0', '랭커', 'S', '78727207', 'webp', false, '밴텀급', 173),
    f('boorchu', '보오르추', 'Shijirbaatar Bat-Itgelt', '4-1-0', '랭커', 'W', '48634737', 'webp', false, '밴텀급', 175),
    f('monk', '몽크', 'Maicon Bruno', '5-5-0', '랭커', 'S', '66714345', 'webp', false, '밴텀급', 175),
    f('yellowmonkey', '옐로우 몽키', '임정민', '5-5-0', '랭커', 'S', '78377160', 'webp', false, '밴텀급', 171),
    f('haejukwang', '해적왕', '이강남', '3-3-0', '랭커', 'W', '69153225', 'webp', false, '밴텀급', 173),
    f('prison', '프리즌', '최은빈', '3-1-0', '랭커', 'S', '76745089', 'webp', false, '밴텀급', 170),
    f('levai', '리바이', '김유찬', '2-1-0', '랭커', 'W', '27550232', 'webp', false, '밴텀급', 170),
    f('sparrow', '스패로우', 'Paulo Cunha', '3-6-0', '랭커', 'S', '62002201', 'webp', false, '밴텀급', 170),
    f('cowboy', '카우보이', 'Diogenes Neto', '0-2-0', '랭커', 'S', '90316608', 'webp', false, '밴텀급', 170),
    f('checkmate', '체크메이트', '이환현', '1-4-0', '랭커', 'S', '80166879', 'webp', false, '밴텀급', 176),
    f('madcow_ban', '매드카우', '이성원', '1-3-0', '랭커', 'S', '45557928', 'webp', false, '밴텀급', 172),
  ],
  페더급: [
    f('sirasoni', '시라소니', '방성혁', '8-0-0', 'CHAMP', 'S', '79683172', 'webp', true, '페더급', 180),
    f('psycho', '싸이코', 'Victor Hugo', '26-7-0', '1위', 'W', '77842475', 'webp', false, '페더급', 171),
    f('wolfking', '울프킹', 'Adilet Nurmatov', '14-3-0', '2위', 'G', '37050120', 'webp', false, '페더급', 172),
    f('ares', '아레스', '김태균', '11-3-0', '3위', 'W', '82685239', 'webp', false, '페더급', 180),
    f('lockstone', '락스톤', 'Lucas Bento', '9-6-0', '4위', 'W', '34145632', 'webp', false, '페더급', 173),
    f('koreanmoai', '코리안 모아이', '김민우', '12-2-0', '5위', 'S', '50893031', 'webp', false, '페더급', 177),
    f('bulgoem', '불곰', 'Ismail Kelemetov', '11-1-0', '6위', 'W', '62550126', 'webp', false, '페더급', 173),
    f('redbird', '붉은매', '지혁민', '7-1-0', '7위', 'S', '71392066', 'webp', false, '페더급', 176),
    f('sonochan', '손오찬', '손유찬', '3-4-0', '8위', 'W', '69610658', 'webp', false, '페더급', 174),
    f('trg_fed', 'TRG', 'Felipe Pereira', '10-2-0', '9위', 'S', '61891168', 'webp', false, '페더급', 177),
    f('yain', '야인', '이도겸', '11-8-0', '10위', 'S', '63267425', 'webp', false, '페더급', 170),
    f('moca', '모카', 'Leonardo Diniz', '15-4-0', '랭커', 'S', '35516338', 'webp', false, '페더급', 174),
    f('gwangnam', '광남', '신승민', '13-8-0', '랭커', 'S', '74943577', 'webp', false, '페더급', 176),
    f('bulljumok', '불주먹', '방재혁', '16-10-0', '랭커', 'S', '28308426', 'webp', false, '페더급', 177),
    f('lilshoota', 'Lil Shoota', '임재윤', '3-2-0', '랭커', 'G', '92989925', 'webp', false, '페더급', 178),
    f('theman', 'The Man', 'Daniel McElhaney', '9-3-0', '랭커', 'S', '88590651', 'webp', false, '페더급', 170),
    f('jelme', '젤메', 'Purevdorj Sodnomdorj', '8-3-0', '랭커', 'W', '90043072', 'webp', false, '페더급', 170),
    f('bbakssang', '빡상', '박상현', '9-7-1', '랭커', 'S', '84586763', 'webp', false, '페더급', 177),
    f('koreanbuldozer', '코리안 불도저', '남의철', '21-10-1', '랭커', 'W', '63918145', 'webp', false, '페더급', 175),
    f('thor_fed', 'Thor', 'Toma Mitsuhiro', '15-12-2', '랭커', 'W', '73185034', 'webp', false, '페더급', 173),
    f('taurus', '타우르스', '박병혁', '4-3-0', '랭커', 'G', '85172995', 'webp', false, '페더급', 174),
    f('ironhip', '아이언 힙', '미야히라 슈타로', '4-5-0', '랭커', 'G', '64326511', 'webp', false, '페더급', 170),
    f('finisher', '피니셔', '황준호', '5-3-0', '랭커', 'S', '31606646', 'webp', false, '페더급', 183),
    f('hitman', '히트맨', '정용수', '5-3-1', '랭커', 'S', '69457329', 'webp', false, '페더급', 178),
    f('cyborg', '사이보그', '허선행', '5-4-1', '랭커', 'S', '51243766', 'webp', false, '페더급', 180),
    f('revenant', '레버넌트', '이민혁', '9-7-0', '랭커', 'W', '55032720', 'webp', false, '페더급', 174),
    f('madcow_fed', '매드카우', '이성원', '1-3-0', '랭커', 'S', '45557928', 'webp', false, '페더급', 172),
  ],
  라이트급: [
    f('captainkorea', '캡틴 코리아', '정한국', '14-11-2', 'CHAMP', 'W', '22363165', 'webp', true, '라이트급', 169),
    f('subutai', '수부타이', 'Nandin-Erdene', '19-11-0', '1위', 'S', '95863943', 'webp', false, '라이트급', 178),
    f('mercury', '머큐리', 'Flavio Santos', '14-10-0', '2위', 'S', '53339805', 'webp', false, '라이트급', 167),
    f('jigsaw', '직쏘', '문기범', '14-8-0', '3위', 'W', '32056354', 'webp', false, '라이트급', 174),
    f('youngboss', '영보스', '박어진', '9-2-1', '4위', 'W', '76220784', 'webp', false, '라이트급', 182),
    f('sakura', '사쿠라', '황도윤', '3-6-0', '5위', 'S', '65081168', 'png', false, '라이트급', 180),
    f('ironspider', '아이언 스파이더', '오하라 주리', '36-21-2', '6위', 'S', '31975443', 'webp', false, '라이트급', 184),
    f('hunter', '헌터', '박종헌', '7-6-0', '7위', 'G', '14674653', 'webp', false, '라이트급', 184),
    f('bearfist', '곰주먹', '김정균', '4-4-0', '8위', 'S', '89975978', 'webp', false, '라이트급', 175),
    f('trg_lit', 'TRG', 'Felipe Pereira', '10-2-0', '9위', 'S', '61891168', 'webp', false, '라이트급', 177),
    f('youngtiger', '영타이거', '이영훈', '8-5-1', '10위', 'S', '51940035', 'webp', false, '라이트급', 175),
    f('groot', '그루트', '정용완', '5-2-0', '랭커', 'S', '25058160', 'webp', false, '라이트급', 178),
    f('lionking', 'Lion King', 'Chuka Willis', '17-7-0', '랭커', 'G', '29363216', 'webp', false, '라이트급', 180),
    f('gladiator', '글래디에이터', 'Bruno Itamar', '4-0-0', '랭커', 'S', '37418531', 'webp', false, '라이트급', 176),
    f('warrior', '워리어', '정영제', '6-5-0', '랭커', 'S', '32699714', 'webp', false, '라이트급', 180),
    f('grizzly', 'Grizzly', 'Yamamoto Takuya', '11-3-1', '랭커', 'G', '14307481', 'webp', false, '라이트급', 171),
    f('pharaoh', '파라오', 'Youssef Barakat', '9-2-0', '랭커', 'W', '58305359', 'webp', false, '라이트급', 178),
    f('monster_lit', '몬스터', '오수환', '8-2-1', '랭커', 'W', '93859694', 'webp', false, '라이트급', 175),
    f('bigprince', 'Big Prince', 'Deberson Batista', '14-6-2', '랭커', 'S', '50151784', 'webp', false, '라이트급', 178),
    f('chilaun', '칠라운', 'Erkhemtur Gantumur', '4-0-0', '랭커', 'S', '70806645', 'webp', false, '라이트급', 178),
    f('sloth', '슬로스', '장근영', '3-4-0', '랭커', 'S', '38266375', 'webp', false, '라이트급', 181),
    f('mantis', '맨티스', '윤다원', '5-9-1', '랭커', 'G', '93566249', 'webp', false, '라이트급', 178),
    f('themaster', '더 마스터', '전현우', '2-2-0', '랭커', 'S', '34176555', 'webp', false, '라이트급', 180),
    f('makachef', '마카최프', '최지수', '3-3-1', '랭커', 'G', '31777288', 'webp', false, '라이트급', 179),
    f('leopapa', '레오파파', '이성은', '2-0-0', '랭커', 'G', '42447555', 'webp', false, '라이트급', 184),
    f('kingster', '킹스터', '김성윤', '3-2-0', '랭커', 'G', '95796168', 'webp', false, '라이트급', 181),
    f('stonegollem', '스톤골렘', '손민', '4-3-0', '랭커', 'W', '73557323', 'webp', false, '라이트급', 180),
    f('commando', '코만도', 'Azizbek Norov', '7-4-0', '랭커', 'S', '38215319', 'webp', false, '라이트급', 175),
  ],
  웰터급: [
    f('huntsman', '헌츠맨', 'Sultan Omarov', '9-0-0', '1위', 'G', '51253531', 'webp', false, '웰터급', 183),
    f('leopard', '레오파드', 'Luan Santiago', '23-8-0', '2위', 'S', '27796067', 'webp', false, '웰터급', 181),
    f('kingkong_w', '킹콩', '오일학', '5-4-0', '3위', 'W', '91010996', 'webp', false, '웰터급', 177),
    f('garuda', '가루다', 'Ali Gadzhiev', '4-0-0', '4위', 'W', '41326305', 'webp', false, '웰터급', 180),
    f('dongbaek', '동백', '진태호', '12-9-0', '5위', 'S', '11943234', 'webp', false, '웰터급', 185),
    f('koreangangster', '코리안 갱스터', '박원식', '16-9-1', '6위', 'S', '58100688', 'webp', false, '웰터급', 180),
    f('samurai_wel', '사무라이', 'Patrick Kelvin', '9-2-0', '7위', 'S', '34473780', 'webp', false, '웰터급', 178),
    f('viking', 'Viking', 'Lucas Marques', '19-6-0', '8위', 'W', '51523231', 'webp', false, '웰터급', 178),
    f('blackmamba', '블랙맘바', '김율', '9-8-0', '9위', 'S', '11198227', 'webp', false, '웰터급', 185),
    f('nerd', '너드', 'Sander Silva', '4-0-0', '10위', 'G', '40677542', 'webp', false, '웰터급', 186),
    f('kublai', '쿠빌라이', 'Batmunkh Burenzorig', '16-19-0', '랭커', 'S', '60298370', 'webp', false, '웰터급', 180),
    f('blacklist', '블랙리스트', '박찬솔', '5-2-0', '랭커', 'W', '72706256', 'webp', false, '웰터급', 180),
    f('bakjogyo', '박조교', '박지환', '3-1-0', '랭커', 'G', '41137884', 'webp', false, '웰터급', 173),
    f('bangtan', '방탄', '김민석', '6-4-0', '랭커', 'S', '95230129', 'webp', false, '웰터급', 180),
    f('godgyun', '갓균', '김연균', '3-3-0', '랭커', 'G', '57104443', 'webp', false, '웰터급', 179),
    f('nika', '니카', 'Gilberto Macedo', '3-2-0', '랭커', 'S', '79279699', 'webp', false, '웰터급', 185),
    f('oni', 'Oni', 'Tanaka Yu', '6-6-0', '랭커', 'G', '43145922', 'webp', false, '웰터급', 174),
    f('loco', '로꼬', 'Otacilio Oliveira', '7-9-0', '랭커', 'S', '64788066', 'webp', false, '웰터급', 181),
    f('grenade', '그레네이드', '이설호', '4-7-0', '랭커', 'S', '40717069', 'webp', false, '웰터급', 178),
    f('bluedragon', '청드래곤', '이청수', '1-1-0', '랭커', 'S', '17117825', 'webp', false, '웰터급', 181),
  ],
  미들급: [
    f('kingkong_m', '킹콩', '오일학', '5-4-0', 'CHAMP', 'W', '91010996', 'webp', true, '미들급', 177),
    f('thanos', '타노스', 'Eduardo Garvon', '17-6-1', '1위', 'G', '46333839', 'webp', false, '미들급', 190),
    f('samurai_mid', '사무라이', 'Patrick Kelvin', '9-2-0', '2위', 'S', '34473780', 'webp', false, '미들급', 178),
    f('momo', 'Momo', 'Sato Ryutaro', '10-2-0', '3위', 'G', '53287506', 'webp', false, '미들급', 181),
    f('flamingo', '플라밍고', '박정민', '8-2-0', '4위', 'S', '28865824', 'webp', false, '미들급', 184),
    f('yeti', '예티', 'Lucas Paredes', '5-2-1', '5위', 'S', '39306363', 'webp', false, '미들급', 188),
    f('thumbgeneral', '엄지장군', '여동주', '4-1-0', '6위', 'S', '42162303', 'webp', false, '미들급', 188),
    f('vanguard', '선봉장', '최순태', '4-1-0', '7위', 'S', '27274064', 'webp', false, '미들급', 192),
    f('phoenix_mid', 'Phoenix', 'Marcos Vinicius', '6-2-1', '8위', 'S', '71953510', 'webp', false, '미들급', 189),
    f('aladdin', '알라딘', 'Khusan Urakov', '6-2-0', '9위', 'S', '60922090', 'webp', false, '미들급', 185),
    f('captainhanam', '캡틴 하남', '최재현', '5-6-0', '10위', 'S', '42401461', 'webp', false, '미들급', 180),
    f('dementor', 'Dementor', "Dylan O'Sullivan", '6-3-0', '랭커', 'S', '73762798', 'png', false, '미들급', 185),
    f('savage', '세비지', '홍희원', '2-1-0', '랭커', 'S', '15335910', 'webp', false, '미들급', 180),
    f('pacman', '팩맨', '전호철', '3-4-0', '랭커', 'S', '98498348', 'webp', false, '미들급', 185),
    f('tungtung', '퉁순이', '박성운', '0-1-0', '랭커', 'S', '56124513', 'webp', false, '미들급', 189),
    f('jebe', '제베', 'Galsandorj Gantulga', '0-1-0', '랭커', 'W', '91192457', 'webp', false, '미들급', 180),
  ],
  헤비급: [
    f('bigguy', 'The Big Guy', '양해준', '16-6-0', '1위', 'G', '51611046', 'webp', false, '헤비급', 181),
    f('jjangdol', '짱돌', '차정환', '14-5-3', '2위', 'S', '23743038', 'webp', false, '헤비급', 182),
    f('mammoth', '맘모스', '김명환', '10-4-0', '3위', 'W', '11958177', 'webp', false, '헤비급', 183),
    f('bossbaby', 'Boss Baby', 'Richard Jacobi', '10-2-1', '4위', 'S', '15303256', 'webp', false, '헤비급', 189),
    f('jackpot', 'Jackpot', "O'Shay Jordan", '5-3-0', '5위', 'S', '84407642', 'webp', false, '헤비급', 188),
    f('slime_hvy', '슬라임', '정민훈', '3-3-0', '6위', 'W', '66669714', 'webp', false, '헤비급', 182),
    f('albam', '알밤', '이종구', '2-0-0', '7위', 'G', '38008098', 'webp', false, '헤비급', 183),
    f('hiroshima', 'Hiroshima', 'Oban Takaaki', '11-10-1', '8위', 'W', '80347858', 'webp', false, '헤비급', 183),
    f('scorpion_hvy', '스콜피온', '알리조다', '4-2-0', '9위', 'W', '69112783', 'webp', false, '헤비급', 177),
    f('mukali', '무칼리', 'Enkhjin Unenkhuu', '1-0-0', '랭커', 'S', '11539850', 'webp', false, '헤비급', 190),
    f('maui', '마우이', '김석민', '0-5-0', '랭커', 'S', '11711666', 'webp', false, '헤비급', 170),
    f('asura', '아수라', '김동환', '0-1-0', '랭커', 'G', '90258375', 'webp', false, '헤비급', 172),
    f('blackbear', '흑곰', '김도훈', '0-1-0', '랭커', 'S', '19443685', 'webp', false, '헤비급', 188),
  ],
  언더그라운드: [
    f('godfather', 'GodFather', '검정', '3-0-0', 'CHAMP', 'W', '34629044', 'webp', true, '페더급', 175, true),
    f('koko', 'KOKO', '소재호', '1-1-0', '3위', 'S', '38860186', 'webp', false, '페더급', 172, true),
    f('thelion', 'The Lion', '오반', '0-1-0', '4위', 'S', '87240414', 'webp', false, '라이트급', 178, true),
    f('sasin', '사신', '김남신', '0-1-0', '5위', 'S', '42536332', 'webp', false, '헤비급', 180, true),
    f('ddukbaegi', '뚝배기사범', '호철', '0-2-0', '6위', 'S', '45606965', 'webp', false, '웰터급', 175, true),
  ],
  여성부: [
    f('jjangu', '짱구', '전수민', '2-1-0', '1위', 'S', '22943074', 'webp', false, '여성 아톰급', 158),
    f('ghost_w', '고스트', '홍예린', '5-6-0', '2위', 'W', '15664333', 'webp', false, '여성 아톰급', 160),
    f('barbie', 'Barbie', '히라타 아야네', '4-3-0', '3위', 'S', '27588721', 'webp', false, '여성 아톰급', 155),
    f('libby', 'Libby', '조은비', '1-7-0', '4위', 'S', '30158915', 'webp', false, '여성 아톰급', 157),
  ],
}

export const ALL_FIGHTERS = Object.values(FIGHTERS).flat()
export const WEIGHT_CLASSES = Object.keys(FIGHTERS)