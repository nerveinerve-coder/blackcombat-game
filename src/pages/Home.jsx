import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const WEIGHT_CLASSES = ['플라이급', '밴텀급', '페더급', '라이트급', '웰터급', '미들급', '헤비급']

const FIGHTERS = {
  플라이급: [
    {
      id: 'tank', nickname: '탱크', name: '코마키네 타카히로', record: '19-5-0',
      weight: '플라이급', rank: 'CHAMP', type: '그래플러',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/71657127/71657127_rankingChamp.webp',
      stats: { gPower: 92, gDefense: 85, gSpeed: 80, sPower: 72, sDefense: 75, sSpeed: 78 },
      specials: ['암바', '리어 네이키드 초크', '더블렉 테이크다운'],
    },
    {
      id: 'indianking', nickname: '인디언킹', name: 'Gabriel Rodrigues', record: '7-1-0',
      weight: '플라이급', rank: '1위', type: '웰라운더',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/86478580/86478580_ranking.webp',
      stats: { gPower: 78, gDefense: 80, gSpeed: 76, sPower: 80, sDefense: 78, sSpeed: 82 },
      specials: ['콤보 러시', '길로틴 초크', '바디 킥'],
    },
    {
      id: 'umawang', nickname: '우마왕', name: '우성훈', record: '12-4-0',
      weight: '플라이급', rank: '2위', type: '스트라이커',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/73873103/73873103_ranking.webp',
      stats: { gPower: 65, gDefense: 70, gSpeed: 68, sPower: 90, sDefense: 78, sSpeed: 82 },
      specials: ['투 훅 펀치', '하이킥', '투 스트레이트 펀치'],
    },
    {
      id: 'yunbanggwan', nickname: '윤방관', name: '윤호영', record: '7-5-1',
      weight: '플라이급', rank: '3위', type: '스트라이커',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/70398446/70398446_ranking.webp',
      stats: { gPower: 60, gDefense: 65, gSpeed: 62, sPower: 82, sDefense: 80, sSpeed: 85 },
      specials: ['잽-크로스 콤보', '프론트 킥', '훅 어퍼컷'],
    },
    {
      id: 'crocodile', nickname: '크로커다일', name: 'Elias da Cruz', record: '18-4-1',
      weight: '플라이급', rank: '4위', type: '그래플러',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/88941727/88941727_ranking.webp',
      stats: { gPower: 88, gDefense: 82, gSpeed: 78, sPower: 68, sDefense: 72, sSpeed: 70 },
      specials: ['트라이앵글 초크', '싱글렉 테이크다운', '마운트 파운드'],
    },
    {
      id: 'kimgwanjang', nickname: '김관장', name: '김성재', record: '9-10-1',
      weight: '플라이급', rank: '5위', type: '스트라이커',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/77552285/77552285_ranking.webp',
      stats: { gPower: 58, gDefense: 62, gSpeed: 60, sPower: 78, sDefense: 75, sSpeed: 80 },
      specials: ['스피닝 백킥', '오버핸드 라이트', '무에타이 니킥'],
    },
  ],
  밴텀급: [
    {
      id: 'tusin', nickname: '투신', name: '김재웅', record: '16-8-0',
      weight: '밴텀급', rank: 'CHAMP', type: '웰라운더',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/98660587/98660587_rankingChamp.webp',
      stats: { gPower: 88, gDefense: 90, gSpeed: 82, sPower: 87, sDefense: 85, sSpeed: 83 },
      specials: ['더블렉 테이크다운', '크로스 카운터', '기무라 락'],
    },
    {
      id: 'fenrir', nickname: '펜리르', name: 'Daniiar Toichubek', record: '12-0-0',
      weight: '밴텀급', rank: '1위', type: '스트라이커',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/39588679/39588679_ranking.webp',
      stats: { gPower: 70, gDefense: 82, gSpeed: 85, sPower: 84, sDefense: 80, sSpeed: 92 },
      specials: ['스피드 잽 콤보', '카운터 크로스', '스핀킥'],
    },
    {
      id: 'musa', nickname: '무사', name: '타케나카 다이치', record: '17-4-1',
      weight: '밴텀급', rank: '2위', type: '그래플러',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/64797565/64797565_ranking.webp',
      stats: { gPower: 86, gDefense: 84, gSpeed: 80, sPower: 70, sDefense: 74, sSpeed: 72 },
      specials: ['아나콘다 초크', '레슬링 테이크다운', '사이드 컨트롤 파운드'],
    },
    {
      id: 'bbagse', nickname: '빡세', name: '이진세', record: '7-5-0',
      weight: '밴텀급', rank: '3위', type: '스트라이커',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/37864698/37864698_ranking.webp',
      stats: { gPower: 62, gDefense: 68, gSpeed: 65, sPower: 82, sDefense: 78, sSpeed: 84 },
      specials: ['투 바디 훅', '하이킥 KO', '어퍼컷 러시'],
    },
    {
      id: 'baeksaja', nickname: '백사자', name: 'Aydemir Kazbekov', record: '14-2-0',
      weight: '밴텀급', rank: '4위', type: '그래플러',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/21131458/21131458_ranking.webp',
      stats: { gPower: 85, gDefense: 83, gSpeed: 79, sPower: 68, sDefense: 72, sSpeed: 70 },
      specials: ['암바 피니시', '더블렉 슬램', '리어 네이키드 초크'],
    },
    {
      id: 'underdog', nickname: '언더독', name: '박성준', record: '7-6-1',
      weight: '밴텀급', rank: '5위', type: '스트라이커',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/41530580/41530580_ranking.webp',
      stats: { gPower: 60, gDefense: 65, gSpeed: 63, sPower: 80, sDefense: 76, sSpeed: 82 },
      specials: ['오버핸드 펀치', '로우킥 연타', '카운터 훅'],
    },
  ],
  페더급: [
    {
      id: 'sirasoni', nickname: '시라소니', name: '방성혁', record: '8-0-0',
      weight: '페더급', rank: 'CHAMP', type: '스트라이커',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/79683172/79683172_rankingChamp.webp',
      stats: { gPower: 68, gDefense: 84, gSpeed: 82, sPower: 86, sDefense: 82, sSpeed: 94 },
      specials: ['번개 잽 연타', '하이킥 카운터', '스피드 콤보'],
    },
    {
      id: 'psycho', nickname: '싸이코', name: 'Victor Hugo', record: '26-7-0',
      weight: '페더급', rank: '1위', type: '웰라운더',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/77842475/77842475_ranking.webp',
      stats: { gPower: 88, gDefense: 86, gSpeed: 80, sPower: 82, sDefense: 80, sSpeed: 78 },
      specials: ['버터플라이 가드 스윕', '트라이앵글 암바', '싸이코 러시'],
    },
    {
      id: 'wolfking', nickname: '울프킹', name: 'Adilet Nurmatov', record: '14-3-0',
      weight: '페더급', rank: '2위', type: '그래플러',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/37050120/37050120_ranking.webp',
      stats: { gPower: 87, gDefense: 85, gSpeed: 82, sPower: 68, sDefense: 72, sSpeed: 70 },
      specials: ['레그락', '기무라 어깨관절기', '백 테이크 초크'],
    },
    {
      id: 'ares', nickname: '아레스', name: '김태균', record: '11-3-0',
      weight: '페더급', rank: '3위', type: '웰라운더',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/82685239/82685239_ranking.webp',
      stats: { gPower: 80, gDefense: 78, gSpeed: 76, sPower: 80, sDefense: 78, sSpeed: 80 },
      specials: ['더블렉-펀치 콤보', '클린치 니킥', '암바 전환'],
    },
    {
      id: 'lockstone', nickname: '락스톤', name: 'Lucas Bento', record: '9-6-0',
      weight: '페더급', rank: '4위', type: '웰라운더',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/34145632/34145632_ranking.webp',
      stats: { gPower: 76, gDefense: 74, gSpeed: 74, sPower: 78, sDefense: 76, sSpeed: 78 },
      specials: ['테이크다운 후 파운드', '바디킥 콤보', '길로틴 초크'],
    },
    {
      id: 'koreanmoai', nickname: '코리안 모아이', name: '김민우', record: '12-2-0',
      weight: '페더급', rank: '5위', type: '스트라이커',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/50893031/50893031_ranking.webp',
      stats: { gPower: 62, gDefense: 68, gSpeed: 65, sPower: 85, sDefense: 80, sSpeed: 82 },
      specials: ['파워 크로스', '로우킥 KO', '바디 어퍼컷'],
    },
  ],
  라이트급: [
    {
      id: 'captainkorea', nickname: '캡틴 코리아', name: '정한국', record: '14-11-2',
      weight: '라이트급', rank: 'CHAMP', type: '웰라운더',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/22363165/22363165_rankingChamp.webp',
      stats: { gPower: 83, gDefense: 83, gSpeed: 82, sPower: 83, sDefense: 83, sSpeed: 82 },
      specials: ['코리안 정신력 러시', '테이크다운 디펜스', '클린치 무에타이'],
    },
    {
      id: 'subutai', nickname: '수부타이', name: 'Nandin-Erdene', record: '19-11-0',
      weight: '라이트급', rank: '1위', type: '스트라이커',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/95863943/95863943_ranking.webp',
      stats: { gPower: 65, gDefense: 70, gSpeed: 68, sPower: 93, sDefense: 87, sSpeed: 82 },
      specials: ['파워 오버핸드', '로우킥 연타', '원펀치 KO'],
    },
    {
      id: 'mercury', nickname: '머큐리', name: 'Flavio Santos', record: '14-10-0',
      weight: '라이트급', rank: '2위', type: '스트라이커',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/53339805/53339805_ranking.webp',
      stats: { gPower: 63, gDefense: 68, gSpeed: 66, sPower: 85, sDefense: 80, sSpeed: 88 },
      specials: ['스피드 콤보', '하이킥', '카운터 크로스'],
    },
    {
      id: 'jigsaw', nickname: '직쏘', name: '문기범', record: '14-8-0',
      weight: '라이트급', rank: '3위', type: '웰라운더',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/32056354/32056354_ranking.webp',
      stats: { gPower: 80, gDefense: 78, gSpeed: 76, sPower: 80, sDefense: 78, sSpeed: 80 },
      specials: ['테이크다운 콤보', '백 마운트 초크', '무에타이 엘보'],
    },
    {
      id: 'youngboss', nickname: '영보스', name: '박어진', record: '9-2-1',
      weight: '라이트급', rank: '4위', type: '웰라운더',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/76220784/76220784_ranking.webp',
      stats: { gPower: 78, gDefense: 76, gSpeed: 74, sPower: 78, sDefense: 76, sSpeed: 78 },
      specials: ['클린치 니킥', '싱글렉 테이크다운', '잽-크로스-훅'],
    },
    {
      id: 'sakura', nickname: '사쿠라', name: '황도윤', record: '3-6-0',
      weight: '라이트급', rank: '5위', type: '스트라이커',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/65081168/65081168_ranking.png',
      stats: { gPower: 58, gDefense: 63, gSpeed: 60, sPower: 78, sDefense: 74, sSpeed: 82 },
      specials: ['스피닝 백킥', '하이킥', '바디킥 콤보'],
    },
  ],
  웰터급: [
    {
      id: 'huntsman', nickname: '헌츠맨', name: 'Sultan Omarov', record: '9-0-0',
      weight: '웰터급', rank: 'CHAMP', type: '그래플러',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/51253531/51253531_ranking.webp',
      stats: { gPower: 95, gDefense: 93, gSpeed: 91, sPower: 68, sDefense: 74, sSpeed: 70 },
      specials: ['더블렉 슬램', '암바 피니시', '리어 네이키드 초크'],
    },
    {
      id: 'leopard', nickname: '레오파드', name: 'Luan Santiago', record: '23-8-0',
      weight: '웰터급', rank: '1위', type: '스트라이커',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/27796067/27796067_ranking.webp',
      stats: { gPower: 65, gDefense: 70, gSpeed: 68, sPower: 92, sDefense: 88, sSpeed: 90 },
      specials: ['파워 크로스 카운터', '로우킥 KO', '훅 러시'],
    },
    {
      id: 'kingkong_w', nickname: '킹콩', name: '오일학', record: '5-4-0',
      weight: '웰터급', rank: '2위', type: '웰라운더',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/91010996/91010996_ranking.webp',
      stats: { gPower: 80, gDefense: 78, gSpeed: 76, sPower: 85, sDefense: 80, sSpeed: 74 },
      specials: ['파워 러시', '클린치 무릎', '테이크다운 후 파운드'],
    },
    {
      id: 'garuda', nickname: '가루다', name: 'Ali Gadzhiev', record: '4-0-0',
      weight: '웰터급', rank: '3위', type: '웰라운더',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/41326305/41326305_ranking.webp',
      stats: { gPower: 78, gDefense: 76, gSpeed: 75, sPower: 78, sDefense: 76, sSpeed: 78 },
      specials: ['테이크다운 콤보', '바디킥 러시', '길로틴 초크'],
    },
    {
      id: 'dongbaek', nickname: '동백', name: '진태호', record: '12-9-0',
      weight: '웰터급', rank: '4위', type: '스트라이커',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/11943234/11943234_ranking.webp',
      stats: { gPower: 60, gDefense: 65, gSpeed: 62, sPower: 82, sDefense: 78, sSpeed: 84 },
      specials: ['무에타이 킥 콤보', '바디 어퍼컷', '오버핸드 라이트'],
    },
    {
      id: 'koreangangster', nickname: '코리안 갱스터', name: '박원식', record: '16-9-1',
      weight: '웰터급', rank: '5위', type: '스트라이커',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/58100688/58100688_ranking.webp',
      stats: { gPower: 58, gDefense: 63, gSpeed: 60, sPower: 80, sDefense: 76, sSpeed: 82 },
      specials: ['훅 콤보', '로우킥', '클린치 엘보'],
    },
  ],
  미들급: [
    {
      id: 'kingkong_m', nickname: '킹콩', name: '오일학', record: '5-4-0',
      weight: '미들급', rank: 'CHAMP', type: '웰라운더',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/91010996/91010996_rankingChamp.webp',
      stats: { gPower: 80, gDefense: 78, gSpeed: 70, sPower: 90, sDefense: 82, sSpeed: 70 },
      specials: ['파워 러시', '클린치 무릎 KO', '오버핸드 파워펀치'],
    },
    {
      id: 'thanos', nickname: '타노스', name: 'Eduardo Garvon', record: '17-6-1',
      weight: '미들급', rank: '1위', type: '그래플러',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/46333839/46333839_ranking.webp',
      stats: { gPower: 90, gDefense: 86, gSpeed: 80, sPower: 72, sDefense: 74, sSpeed: 70 },
      specials: ['더블렉 테이크다운', '암바', '리어 네이키드 초크'],
    },
    {
      id: 'samurai', nickname: '사무라이', name: 'Patrick Kelvin', record: '9-2-0',
      weight: '미들급', rank: '2위', type: '스트라이커',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/34473780/34473780_ranking.webp',
      stats: { gPower: 63, gDefense: 68, gSpeed: 65, sPower: 85, sDefense: 80, sSpeed: 86 },
      specials: ['가라데 카운터킥', '스피닝 백킥', '잽-크로스 콤보'],
    },
    {
      id: 'momo', nickname: 'Momo', name: 'Sato Ryutaro', record: '10-2-0',
      weight: '미들급', rank: '3위', type: '그래플러',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/53287506/53287506_ranking.webp',
      stats: { gPower: 86, gDefense: 84, gSpeed: 80, sPower: 66, sDefense: 70, sSpeed: 68 },
      specials: ['유도 업어치기', '기무라 락', '트라이앵글 초크'],
    },
    {
      id: 'flamingo', nickname: '플라밍고', name: '박정민', record: '8-2-0',
      weight: '미들급', rank: '4위', type: '스트라이커',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/28865824/28865824_ranking.webp',
      stats: { gPower: 62, gDefense: 67, gSpeed: 64, sPower: 88, sDefense: 82, sSpeed: 88 },
      specials: ['하이킥 KO', '무에타이 콤보', '스피닝 엘보'],
    },
    {
      id: 'yeti', nickname: '예티', name: 'Lucas Paredes', record: '5-2-1',
      weight: '미들급', rank: '5위', type: '스트라이커',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/39306363/39306363_ranking.webp',
      stats: { gPower: 60, gDefense: 64, gSpeed: 62, sPower: 82, sDefense: 76, sSpeed: 80 },
      specials: ['파워 훅', '바디킥', '오버핸드 라이트'],
    },
  ],
  헤비급: [
    {
      id: 'bigguy', nickname: 'The Big Guy', name: '양해준', record: '16-6-0',
      weight: '헤비급', rank: '1위', type: '그래플러',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/51611046/fighter_yang_hae_jun_full.webp',
      stats: { gPower: 93, gDefense: 90, gSpeed: 82, sPower: 78, sDefense: 78, sSpeed: 65 },
      specials: ['더블렉 슬램', '암바 피니시', '마운트 파운드'],
    },
    {
      id: 'jjangdol', nickname: '짱돌', name: '차정환', record: '14-5-3',
      weight: '헤비급', rank: '2위', type: '스트라이커',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/23743038/23743038_ranking.webp',
      stats: { gPower: 65, gDefense: 70, gSpeed: 62, sPower: 88, sDefense: 82, sSpeed: 72 },
      specials: ['파워 훅', '오버핸드 KO', '바디 크로스'],
    },
    {
      id: 'mammoth', nickname: '맘모스', name: '김명환', record: '10-4-0',
      weight: '헤비급', rank: '3위', type: '웰라운더',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/11958177/11958177_ranking.webp',
      stats: { gPower: 80, gDefense: 78, gSpeed: 70, sPower: 82, sDefense: 78, sSpeed: 68 },
      specials: ['클린치 무릎', '테이크다운 슬램', '파워 훅 콤보'],
    },
    {
      id: 'bossbaby', nickname: 'Boss Baby', name: 'Richard Jacobi', record: '10-2-1',
      weight: '헤비급', rank: '4위', type: '스트라이커',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/15303256/15303256_ranking.webp',
      stats: { gPower: 62, gDefense: 68, gSpeed: 60, sPower: 97, sDefense: 80, sSpeed: 72 },
      specials: ['원펀치 KO', '파워 오버핸드', '헤비 바디샷'],
    },
    {
      id: 'jackpot', nickname: 'Jackpot', name: "O'Shay Jordan", record: '5-3-0',
      weight: '헤비급', rank: '5위', type: '스트라이커',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/84407642/84407642_ranking.webp',
      stats: { gPower: 60, gDefense: 65, gSpeed: 58, sPower: 85, sDefense: 76, sSpeed: 70 },
      specials: ['파워 훅 콤보', '오버핸드 라이트', '바디 크로스'],
    },
    {
      id: 'slime', nickname: '슬라임', name: '정민훈', record: '3-3-0',
      weight: '헤비급', rank: '6위', type: '웰라운더',
      img: 'https://www.blackcombat-official.com/theme/blackcombat/img/fighter_new/66669714/66669714_ranking.webp',
      stats: { gPower: 72, gDefense: 70, gSpeed: 65, sPower: 76, sDefense: 72, sSpeed: 65 },
      specials: ['클린치 무릎', '테이크다운', '파워 훅'],
    },
  ],
}

const TYPE_COLOR = {
  '그래플러': 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  '스트라이커': 'text-red-400 bg-red-400/10 border-red-400/30',
  '웰라운더': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
}

const TYPE_ICON = { '그래플러': '🤼', '스트라이커': '🥊', '웰라운더': '⚡' }

export default function Home() {
  const navigate = useNavigate()
  const [selectedWeight, setSelectedWeight] = useState('플라이급')
  const [player, setPlayer] = useState(null)
  const [opponent, setOpponent] = useState(null)
  const [step, setStep] = useState('select_player')

  const fighters = FIGHTERS[selectedWeight] || []

  const handleSelect = (f) => {
    if (step === 'select_player') {
      setPlayer(f)
      setOpponent(null)
      setStep('select_opponent')
    } else {
      if (f.id === player.id) return
      setOpponent(f)
      setStep('ready')
    }
  }

  const handleFight = () => {
    localStorage.setItem('player', JSON.stringify(player))
    localStorage.setItem('opponent', JSON.stringify(opponent))
    navigate('/fight')
  }

  const handleReset = () => {
    setPlayer(null)
    setOpponent(null)
    setStep('select_player')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-32">

      {/* 헤더 */}
      <div className="bg-[#111] border-b border-yellow-500/30 px-4 py-4 text-center sticky top-0 z-20">
        <p className="text-[10px] tracking-widest text-yellow-500 uppercase mb-1">Black Combat</p>
        <h1 className="text-xl font-black tracking-tight">⚔️ BLACK COMBAT GAME</h1>
        <p className="text-[11px] text-gray-500 mt-1">
          {step === 'select_player' && '나의 파이터를 선택해줘'}
          {step === 'select_opponent' && `✅ ${player.nickname} 선택 → 상대 선택`}
          {step === 'ready' && `${player.nickname} 🆚 ${opponent.nickname}`}
        </p>
      </div>

      {/* 체급 탭 */}
      <div className="flex overflow-x-auto gap-2 px-4 py-3 border-b border-gray-800 no-scrollbar">
        {WEIGHT_CLASSES.map(w => (
          <button
            key={w}
            onClick={() => { setSelectedWeight(w); handleReset() }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
              selectedWeight === w
                ? 'bg-yellow-500 text-black border-yellow-500'
                : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'
            }`}
          >
            {w}
          </button>
        ))}
      </div>

      {/* VS 배너 */}
      {step === 'ready' && (
        <div className="flex items-center justify-center gap-4 px-4 py-3 bg-yellow-500/10 border-b border-yellow-500/20">
          <div className="text-center">
            <p className="text-yellow-400 font-black">{player.nickname}</p>
            <p className="text-[10px] text-gray-500">{player.type}</p>
          </div>
          <p className="text-xl font-black text-yellow-500">VS</p>
          <div className="text-center">
            <p className="text-red-400 font-black">{opponent.nickname}</p>
            <p className="text-[10px] text-gray-500">{opponent.type}</p>
          </div>
        </div>
      )}

      {/* 파이터 그리드 */}
      <div className="p-3 grid grid-cols-2 gap-3 max-w-lg mx-auto">
        {fighters.map(f => {
          const isPlayer = player?.id === f.id
          const isOpponent = opponent?.id === f.id
          const isDisabled = step === 'select_opponent' && f.id === player?.id

          return (
            <button
              key={f.id}
              onClick={() => handleSelect(f)}
              disabled={isDisabled}
              className={`relative rounded-xl overflow-hidden text-left border transition-all ${
                isPlayer ? 'border-yellow-400 bg-yellow-500/10' :
                isOpponent ? 'border-red-400 bg-red-500/10' :
                isDisabled ? 'border-gray-800 opacity-30' :
                'border-gray-800 bg-[#111] hover:border-gray-600'
              }`}
            >
              {/* 선수 이미지 */}
              <div className="w-full h-32 bg-[#1a1a1a] overflow-hidden">
                <img
                  src={f.img}
                  alt={f.nickname}
                  className="w-full h-full object-cover object-top"
                  onError={e => { e.target.style.display = 'none' }}
                />
              </div>

              {/* 뱃지 */}
              <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                {f.rank === 'CHAMP' && (
                  <span className="text-[8px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-black">👑 CHAMP</span>
                )}
                {f.rank !== 'CHAMP' && (
                  <span className="text-[8px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded font-bold">{f.rank}</span>
                )}
              </div>
              {isPlayer && <span className="absolute top-2 left-2 text-[8px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-black">나</span>}
              {isOpponent && <span className="absolute top-2 left-2 text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded font-black">상대</span>}

              {/* 정보 */}
              <div className="p-3">
                <p className="text-[13px] font-black mb-0.5">{f.nickname}</p>
                <p className="text-[9px] text-gray-500 mb-2">{f.record}</p>

                {/* 유형 뱃지 */}
                <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${TYPE_COLOR[f.type]}`}>
                  {TYPE_ICON[f.type]} {f.type}
                </span>

                {/* 능력치 */}
                <div className="mt-2 flex flex-col gap-1">
                  {[
                    { label: '타격력', value: f.stats.sPower, color: 'bg-red-500' },
                    { label: '타격속도', value: f.stats.sSpeed, color: 'bg-orange-400' },
                    { label: '그래플', value: f.stats.gPower, color: 'bg-blue-500' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-1.5">
                      <span className="text-[8px] text-gray-600 w-10">{s.label}</span>
                      <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full ${s.color} rounded-full`} style={{width: `${s.value}%`}} />
                      </div>
                      <span className="text-[8px] text-gray-500">{s.value}</span>
                    </div>
                  ))}
                </div>

                {/* 스페셜 기술 */}
                <div className="mt-2">
                  <p className="text-[8px] text-yellow-500/60 mb-1">✦ 필살기</p>
                  {f.specials.slice(0, 2).map((s, i) => (
                    <p key={i} className="text-[8px] text-gray-500">· {s}</p>
                  ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a0a0a] border-t border-gray-800">
        <div className="max-w-lg mx-auto flex gap-3">
          {step !== 'select_player' && (
            <button onClick={handleReset} className="px-4 py-3 border border-gray-700 rounded-xl text-gray-400 text-sm font-bold">
              초기화
            </button>
          )}
          <button
            onClick={step === 'ready' ? handleFight : undefined}
            disabled={step !== 'ready'}
            className="flex-1 py-3 bg-yellow-500 text-black font-black text-base rounded-xl disabled:opacity-30 disabled:bg-gray-700 disabled:text-gray-500 hover:bg-yellow-400 transition-all"
          >
            {step === 'select_player' && '파이터를 선택해줘'}
            {step === 'select_opponent' && '상대를 선택해줘'}
            {step === 'ready' && '🥊 FIGHT!'}
          </button>
        </div>
      </div>
    </div>
  )
}