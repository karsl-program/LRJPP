/*
MIT License

Copyright (c) 2026 karsl

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
// ==UserScript==
// @name         洛谷随机跳题（离线）
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  筛选题库、难度、标签后随机跳题，使用离线题库
// @author       karsl
// @match        https://www.luogu.com.cn/
// @icon         https://www.luogu.com.cn/favicon.ico
// @grant        GM_xmlhttpRequest
// @connect      www.luogu.com.cn
// @connect      cdn.luogu.com.cn
// @require      https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js
// @downloadURL  https://raw.githubusercontent.com/karsl-program/LRJPP/main/main.user.js
// @updateURL    https://raw.githubusercontent.com/karsl-program/LRJPP/main/main.user.js
// ==/UserScript==

(function() {
    'use strict';

    const DB_NAME = 'LuoguOfflineDB';
    const DB_VERSION = 4;
    const STORE_NAME = 'problems';
    const METADATA_STORE = 'metadata';
    const USER_STATUS_STORE = 'user_status';
    const DATA_URL = 'https://cdn.luogu.com.cn/problemset-open/latest.ndjson.gz';

    const DIFFICULTY_MAP = {
        0: '暂未评定',
        1: '入门',
        2: '普及-',
        3: '普及',
        4: '普及+/提高-',
        5: '提高',
        6: '提高+/省选-',
        7: '省选/NOI-',
        8: 'NOI/NOI+/CTS'
    };

    const TYPE_MAP = {
        '洛谷': 'luogu',
        '主题库': 'P',
        '入门与面试': 'B'
    };
    const TYPE_KEYS = Object.keys(TYPE_MAP);

    const dimensionMaps = {
        algorithm: {
            '语言入门': '-2',
            '字符串': '2',
            '后缀自动机 SAM': '101',
            '字典树 Trie': '300',
            'AC 自动机': '301',
            'KMP 算法': '302',
            '后缀数组 SA': '303',
            '后缀树': '304',
            '有限状态自动机': '305',
            '回文自动机 PAM': '325',
            'Manacher 算法': '329',
            '顺序结构': '353',
            '分支结构': '354',
            '循环结构': '355',
            '数组': '356',
            '字符串（入门）': '357',
            '结构体': '358',
            '函数与递归': '359',
            'Lyndon 分解': '419',
            'Z 函数': '474',
            '动态规划 DP': '3',
            '搜索': '4',
            '广度优先搜索 BFS': '126',
            '深度优先搜索 DFS': '127',
            '剪枝': '128',
            '记忆化搜索': '129',
            '启发式搜索': '130',
            '迭代加深搜索': '131',
            '启发式迭代加深搜索 IDA*': '132',
            'Dancing Links': '133',
            '爬山算法 Local search': '134',
            '模拟退火': '135',
            '背包 DP': '139',
            '数位 DP': '141',
            '区间 DP': '144',
            '树形 DP': '152',
            '轮廓线 DP': '323',
            '线性 DP': '444',
            '状压 DP': '464',
            '后缀平衡树': '496',
            '数学': '5',
            '图论': '6',
            'Kruskal 重构树': '68',
            '网络流': '79',
            '信息论': '122',
            '随机调整': '136',
            '遗传算法': '137',
            '图论建模': '155',
            '图遍历': '158',
            '拓扑排序': '159',
            '最短路': '160',
            '生成树': '166',
            '平面图': '172',
            '最小环': '173',
            'A*  算法': '263',
            '折半搜索 meet in the middle': '380',
            '梯度下降法': '396',
            '拉格朗日乘数法': '412',
            '拉格朗日插值法': '417',
            '单位根反演': '480',
            '负权环': '174',
            '连通块': '175',
            '2-SAT': '176',
            '平面图欧拉公式': '177',
            '强连通分量': '179',
            'Tarjan': '180',
            '双连通分量': '181',
            '欧拉回路': '182',
            '差分约束': '185',
            '仙人掌': '186',
            '二分图': '187',
            '一般图的最大匹配': '189',
            '上下界网络流': '197',
            '最小割': '198',
            '费用流': '204',
            '圆方树': '350',
            '弦图': '450',
            'Floyd 算法': '476',
            '广义串并联图': '530',
            'Hall 定理': '541',
            '计算几何': '8',
            '树形数据结构': '11',
            '线段树': '42',
            '并查集': '47',
            '平衡树': '50',
            '堆': '51',
            '树状数组': '53',
            'cdq 分治': '100',
            '可并堆': '215',
            '动态树 LCT': '229',
            '三维计算几何': '283',
            '向量': '286',
            '凸包': '291',
            '叉积': '292',
            '线段相交': '293',
            '半平面交': '295',
            '旋转卡壳': '299',
            '极角排序': '449',
            '平面几何': '482',
            '闵可夫斯基和 Minkowski sum': '525',
            '博弈论': '13',
            '线性数据结构': '44',
            '单调队列': '56',
            '颜色段均摊（珂朵莉树 ODT）': '65',
            '树套树': '232',
            '可持久化线段树': '233',
            '可持久化': '234',
            '前缀和': '254',
            '栈': '287',
            '队列': '288',
            '博弈树': '311',
            '整体二分': '316',
            'K-D Tree': '321',
            'Nim 积': '370',
            '李超线段树': '377',
            '吉司机线段树 segment tree beats': '378',
            '线段树合并': '379',
            'SG 函数': '445',
            '二区间合并（猫树分治）': '531',
            'KTT / Kinetic Tournament Tree': '539',
            '原根': '66',
            '多项式': '69',
            '数论': '72',
            '素数判断': '239',
            '最大公约数 gcd': '241',
            '扩展欧几里德算法': '242',
            '不定方程': '243',
            '进制': '244',
            '分块': '289',
            'ST 表': '290',
            '快速傅里叶变换 FFT': '313',
            '快速数论变换 NTT': '324',
            '快速沃尔什变换 FWT': '326',
            '快速莫比乌斯变换 FMT': '327',
            '差分': '330',
            '链表': '360',
            '单调栈': '385',
            'Berlekamp-Massey(BM) 算法': '391',
            '集合幂级数，子集卷积': '416',
            '哈希表': '473',
            '模拟': '1',
            '贪心': '7',
            '基础算法': '110',
            '中国剩余定理 CRT': '250',
            '莫比乌斯反演': '251',
            '逆元': '276',
            'Lucas 定理': '322',
            '类欧几里得算法': '388',
            '调和级数': '411',
            '欧拉降幂': '415',
            'Stern-Brocot 树': '423',
            '整除分块': '448',
            'Dirichlet 卷积': '451',
            '大步小步算法 BSGS': '452',
            '二次剩余': '453',
            'Bézout 定理': '455',
            '杜教筛': '461',
            '欧拉函数': '462',
            '线性筛法': '475',
            '亚线性快速求和算法': '540',
            '递推': '12',
            '倍增': '43',
            '二分': '45',
            '递归': '54',
            '枚举': '111',
            '分治': '112',
            '排序': '113',
            '动态规划优化': '146',
            '优先队列': '148',
            '矩阵加速': '149',
            '斜率优化': '150',
            '状态合并': '151',
            '凸完全单调性（wqs 二分）': '153',
            '四边形不等式': '154',
            'DP 套 DP': '435',
            '动态 DP': '443',
            '决策单调性': '463',
            'STL': '504',
            '整体转移': '507',
            '斜率维护技巧 slope trick': '508',
            '点分治': '49',
            '树上启发式合并': '55',
            '树的遍历': '208',
            '最近公共祖先 LCA': '211',
            '树的直径': '213',
            '树链剖分': '228',
            '树论': '230',
            '群论': '246',
            '置换': '247',
            'Pólya 定理': '248',
            '虚树': '249',
            '组合数学': '252',
            '排列组合': '253',
            '二项式定理': '255',
            '康托展开': '256',
            '基环树': '320',
            '动态树分治': '382',
            'Prüfer 序列': '410',
            '全局平衡二叉树': '472',
            '树的重心': '483',
            'LGV 引理': '63',
            '矩阵树定理': '64',
            '矩阵运算': '71',
            '鸽笼原理': '258',
            '容斥原理': '259',
            'Fibonacci 数列': '260',
            'Catalan 数': '261',
            'Stirling 数': '262',
            '生成函数': '264',
            '概率论': '266',
            '期望': '270',
            '线性代数': '271',
            '矩阵乘法': '272',
            '线性递推': '273',
            '高斯消元': '274',
            'Dilworth 定理': '364',
            '拉格朗日反演': '372',
            '杨表': '387',
            '随机游走 Markov Chain': '457',
            '鞅的停时定理': '458',
            '暴力数据结构': '9',
            '高精度': '10',
            '莫队': '41',
            '三分': '67',
            '离散化': '78',
            '霍夫曼树': '214',
            '哈希 hashing': '235',
            '线性基': '277',
            '微积分': '278',
            '导数': '280',
            '积分': '281',
            '定积分': '282',
            '级数': '284',
            '扫描线': '298',
            '其它技巧': '308',
            '随机化': '309',
            '位运算': '314',
            '构造': '318',
            '行列式': '454',
            '特征值': '466',
            '分数规划': '202',
            '线性规划': '265',
            '双指针 two-pointer': '345',
            'Ad-hoc': '365',
            '笛卡尔树': '368',
            '拟阵': '369',
            '根号分治': '371',
            '模拟费用流': '373',
            '分散层叠': '374',
            '均摊分析': '375',
            '分类讨论': '376',
            '近似算法': '413',
            '线段树分治': '446',
            '离线处理': '447',
            'bitset': '465',
            '组合优化': '467',
            '整数规划': '468',
            '原始对偶': '470',
            '启发式合并': '477',
            '反悔贪心': '524',
            '最大流最小割定理': '471',
            '保序回归': '484'
        },
        source: {
            '各省省选': '48',
            '集训队互测': '52',
            '福建省历届夏令营': '70',
            'NOI': '77',
            'NOIP 普及组': '82',
            'NOIP 提高组': '83',
            'APIO': '85',
            'NOI 导刊': '99',
            'CTT（清华集训/北大集训）': '331',
            '网络流与线性规划 24 题': '332',
            'CSP-S 提高级': '342',
            'CSP-J 入门级': '343',
            'NOI Online': '347',
            'Ynoi': '348',
            'NOI 系列赛事': '426',
            '经典套题': '427',
            '国际知名赛事': '428',
            'WC': '459',
            'CTSC/CTS': '460',
            '模板题': '523',
            'USACO': '46',
            'POI（波兰）': '57',
            'IOI': '102',
            'CCO（加拿大）': '115',
            'CCC（加拿大）': '116',
            'CEOI（中欧）': '117',
            'eJOI（欧洲）': '118',
            'COCI（克罗地亚）': '333',
            'BalticOI（波罗的海）': '334',
            'JOI（日本）': '336',
            'AGM': '346',
            'PA（波兰）': '389',
            'ROI（俄罗斯）': '393',
            'EGOI（欧洲/女生）': '394',
            'NOISG（新加坡）': '436',
            'NordicOI（北欧）': '437',
            'BalkanOI（巴尔干半岛）': '439',
            'KOI（韩国）': '440',
            'RMI（罗马尼亚）': '441',
            'COI（克罗地亚）': '478',
            '洛谷原创': '81',
            'ICPC': '335',
            '洛谷月赛': '337',
            '语言月赛': '386',
            '洛谷比赛': '429',
            '大学竞赛': '430',
            'ROIR（俄罗斯）': '479',
            'INOI（伊朗）': '505',
            'UOI（乌克兰）': '506',
            'JOISC/JOIST（日本）': '512',
            'COTS（克罗地亚）': '513',
            'Google Code Jam': '514',
            'Moscow Olympiad': '515',
            'PO（瑞典）': '518',
            'PAIO': '519',
            'MCC/MCO（马来西亚）': '533',
            'KTSC（韩国）': '535',
            'IATI（保加利亚/东欧）': '537',
            'Google Kick Start': '538',
            '入门赛': '542',
            '蓝桥杯国赛': '361',
            '蓝桥杯省赛': '363',
            '省赛/邀请赛': '381',
            '传智杯': '383',
            'THUPC': '390',
            'GESP': '409',
            '其他竞赛': '431',
            'THUSC': '432',
            '高校校赛': '434',
            'THUWC': '438',
            'CSP-X 小学组': '442',
            'Code+': '485',
            '梦熊比赛': '486',
            '信息与未来': '487',
            '科创活动': '488',
            'BCSP-X': '489',
            '小学活动': '492',
            '初中活动': '493',
            'CSPro': '516',
            'CCPC': '526',
            '科大国创杯': '494',
            '蓝桥杯青少年组': '495'
        },
        time: {
            '1996': '344',
            '1997': '14',
            '1998': '15',
            '1999': '16',
            '2000': '17',
            '2001': '18',
            '2002': '19',
            '2003': '20',
            '2004': '21',
            '2005': '22',
            '2006': '23',
            '2007': '24',
            '2008': '25',
            '2009': '26',
            '2010': '27',
            '2011': '28',
            '2012': '29',
            '2013': '30',
            '2014': '31',
            '2015': '32',
            '2016': '33',
            '2017': '34',
            '2018': '35',
            '2019': '36',
            '2020': '37',
            '2021': '58',
            '2022': '59',
            '2023': '60',
            '2024': '61',
            '2025': '62',
            '2026': '338',
            '2027': '339',
            '2028': '340',
            '2029': '367',
            '2077': '341',
            '2078': '362',
            '2079': '424'
        },
        region: {
            '重庆': '38',
            '四川': '39',
            '河南': '40',
            '浙江': '88',
            '上海': '89',
            '福建': '90',
            '江苏': '91',
            '安徽': '92',
            '湖南': '93',
            '北京': '94',
            '河北': '95',
            '广东': '96',
            '山东': '97',
            '吉林': '98',
            '山西': '114',
            '江西': '161',
            '贵州': '162',
            '广西': '163',
            '陕西': '164',
            '国内省市': '497',
            '辽宁': '167',
            '云南': '168',
            '天津': '328',
            '湖北': '397',
            '黑龙江': '398',
            '海南': '399',
            '甘肃': '400',
            '青海': '401',
            '台湾': '402',
            '内蒙古': '403',
            '西藏': '404',
            '宁夏': '405',
            '新疆': '406',
            '香港': '407',
            '澳门': '408',
            '济南': '420',
            '南京': '421',
            '青岛': '422',
            '国内赛站': '498',
            'EC Final': '509',
            '国际赛区': '499',
            'NERC/NEERC': '500',
            'SEERC': '501',
            'CERC': '502',
            'NWRRC': '503',
            'WF': '510',
            'NAC': '511',
            '杭州': '520',
            '昆明': '521',
            '西安': '522',
            '哈尔滨': '527',
            '首尔': '528',
            '横浜': '529',
            'SWERC': '532',
            '成都': '534',
            '雅加达': '536'
        },
        special: {
            '交互题': '103',
            '提交答案': '104',
            'Special Judge': '107',
            'O2优化': '108',
            '通信题': '351'
        }
    };

    const DIMENSION_NAMES = {
        algorithm: '算法',
        source: '来源',
        time: '时间',
        region: '区域',
        special: '特殊题目'
    };
    const DIMENSION_KEYS = ['algorithm', 'source', 'time', 'region', 'special'];

    const STORAGE_KEY = 'luogu_random_jump_settings';
    let selectedTypes = new Set();
    let selectedDifficulties = new Set();
    let selectedTags = {
        algorithm: new Set(),
        source: new Set(),
        time: new Set(),
        region: new Set(),
        special: new Set()
    };
    let filterAccepted = false;
    let filterSubmitted = false;

    let userUid = null;
    let acceptedSet = new Set();
    let submittedSet = new Set();
    let userStatusReady = false;

    function loadSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const data = JSON.parse(raw);
            if (data.types) {
                const validTypes = Object.values(TYPE_MAP);
                selectedTypes = new Set(
                    Array.from(data.types).filter(v => validTypes.includes(v))
                );
            }
            if (data.difficulties) selectedDifficulties = new Set(data.difficulties);
            if (data.tags) {
                DIMENSION_KEYS.forEach(key => {
                    if (data.tags[key] && Array.isArray(data.tags[key])) {
                        selectedTags[key] = new Set(data.tags[key]);
                    }
                });
            }
            if (typeof data.filterAccepted === 'boolean') filterAccepted = data.filterAccepted;
            if (typeof data.filterSubmitted === 'boolean') filterSubmitted = data.filterSubmitted;
        } catch (e) {
            console.warn('读取存储失败', e);
        }
    }

    function saveSettings() {
        const data = {
            types: Array.from(selectedTypes),
            difficulties: Array.from(selectedDifficulties),
            tags: {},
            filterAccepted: filterAccepted,
            filterSubmitted: filterSubmitted
        };
        DIMENSION_KEYS.forEach(key => {
            data.tags[key] = Array.from(selectedTags[key]);
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    loadSettings();

    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = function(e) {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'pid' });
                    store.createIndex('difficulty', 'difficulty', { unique: false });
                    store.createIndex('type', 'type', { unique: false });
                    store.createIndex('tags', 'tags', { multiEntry: true });
                }
                if (!db.objectStoreNames.contains(METADATA_STORE)) {
                    db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains(USER_STATUS_STORE)) {
                    db.createObjectStore(USER_STATUS_STORE, { keyPath: 'id' });
                    console.log('【洛谷随机跳题】数据库升级：创建做题记录存储');
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    function getProblemCount() {
        return openDB().then(db => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const countReq = store.count();
                countReq.onsuccess = () => resolve(countReq.result);
                countReq.onerror = () => reject(countReq.error);
            });
        });
    }

    function clearProblems() {
        return openDB().then(db => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const req = store.clear();
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
        });
    }

    function bulkInsert(problems) {
        return openDB().then(db => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                for (const p of problems) {
                    store.put(p);
                }
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        });
    }

    function setMetadata(key, value) {
        return openDB().then(db => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction(METADATA_STORE, 'readwrite');
                const store = tx.objectStore(METADATA_STORE);
                store.put({ key, value });
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        });
    }

    async function saveUserStatus(uid, acceptedPids, submittedPids) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(USER_STATUS_STORE, 'readwrite');
            const store = tx.objectStore(USER_STATUS_STORE);
            store.put({
                id: 'user_status',
                uid,
                acceptedPids,
                submittedPids,
                timestamp: Date.now()
            });
            tx.oncomplete = () => {
                console.log('【洛谷随机跳题】做题记录已保存到 IndexedDB');
                resolve();
            };
            tx.onerror = (e) => {
                console.error('保存做题记录失败', e);
                reject(e);
            };
        });
    }

    async function loadUserStatus() {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(USER_STATUS_STORE, 'readonly');
            const store = tx.objectStore(USER_STATUS_STORE);
            const req = store.get('user_status');
            req.onsuccess = () => {
                console.log('【洛谷随机跳题】从 IndexedDB 读取做题记录:', req.result ? '成功' : '无数据');
                resolve(req.result || null);
            };
            req.onerror = (e) => {
                console.error('读取做题记录失败', e);
                reject(e);
            };
        });
    }

    function getUidFromDOM() {
        const avatarLinks = document.querySelectorAll('a[href*="/user/"]');
        for (const link of avatarLinks) {
            if (link.querySelector('img.avatar') || link.querySelector('img[alt]')) {
                const match = link.getAttribute('href').match(/\/user\/(\d+)/);
                if (match) return match[1];
            }
        }
        const avatarImg = document.querySelector('img.avatar, .user-nav img[alt]');
        if (avatarImg) {
            const parentLink = avatarImg.closest('a[href*="/user/"]');
            if (parentLink) {
                const match = parentLink.getAttribute('href').match(/\/user\/(\d+)/);
                if (match) return match[1];
            }
        }
        return null;
    }

    function waitForUid() {
        return new Promise((resolve) => {
            const uid = getUidFromDOM();
            if (uid) {
                resolve(uid);
                return;
            }
            let attempts = 0;
            const maxAttempts = 20;
            const interval = setInterval(() => {
                const uid = getUidFromDOM();
                if (uid) {
                    clearInterval(interval);
                    resolve(uid);
                } else {
                    attempts++;
                    if (attempts >= maxAttempts) {
                        clearInterval(interval);
                        resolve(null);
                    }
                }
            }, 500);
        });
    }

    function fetchPracticeData(uid) {
        return new Promise((resolve, reject) => {
            const url = `https://www.luogu.com.cn/user/${uid}/practice`;
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: function(res) {
                    try {
                        const html = res.responseText;
                        const match = html.match(/<script id="lentille-context"[^>]*>([\s\S]*?)<\/script>/);
                        if (!match) {
                            reject(new Error('无法解析个人练习页面'));
                            return;
                        }
                        const json = JSON.parse(match[1]);
                        const acceptedPids = [];
                        const submittedPids = [];
                        if (json.data && json.data.passed) {
                            json.data.passed.forEach(item => acceptedPids.push(item.pid));
                        }
                        if (json.data && json.data.submitted) {
                            json.data.submitted.forEach(item => submittedPids.push(item.pid));
                        }
                        resolve({ acceptedPids, submittedPids });
                    } catch (e) {
                        reject(e);
                    }
                },
                onerror: function(err) {
                    reject(err);
                }
            });
        });
    }

    function updateUserSets(uid, acceptedPids, submittedPids) {
        userUid = uid;
        acceptedSet = new Set(acceptedPids);
        submittedSet = new Set([...acceptedPids, ...submittedPids]);
        userStatusReady = true;
        console.log(`【洛谷随机跳题】状态已更新：AC ${acceptedSet.size} 题，尝试 ${submittedSet.size} 题`);
    }

    async function refreshUserStatus(showMsg = true) {
        const uid = getUidFromDOM();
        if (!uid) throw new Error('无法获取用户 UID');
        if (showMsg) showStatusMessage('正在刷新做题记录...');
        const { acceptedPids, submittedPids } = await fetchPracticeData(uid);
        updateUserSets(uid, acceptedPids, submittedPids);
        await saveUserStatus(uid, acceptedPids, submittedPids);
        if (showMsg) showStatusMessage('做题记录已刷新！');
        if (panelUpdateFilterUI) panelUpdateFilterUI();
    }

    async function initUserStatus(uid) {
        if (!uid) return false;

        const cached = await loadUserStatus();
        if (cached && cached.uid === uid) {
            updateUserSets(uid, cached.acceptedPids, cached.submittedPids);
            console.log('【洛谷随机跳题】已从缓存加载做题记录');
            return true;
        }

        console.log('【洛谷随机跳题】无有效缓存，尝试自动获取做题记录...');
        try {
            const { acceptedPids, submittedPids } = await fetchPracticeData(uid);
            updateUserSets(uid, acceptedPids, submittedPids);
            await saveUserStatus(uid, acceptedPids, submittedPids);
            return true;
        } catch (e) {
            console.warn('自动获取做题记录失败', e);
            acceptedSet = new Set();
            submittedSet = new Set();
            userStatusReady = false;
            return false;
        }
    }

    async function getRandomProblem(filters) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.getAll();
            req.onsuccess = function() {
                let results = req.result;
                const totalBefore = results.length;

                if (filters.difficulties && filters.difficulties.size > 0) {
                    results = results.filter(p => filters.difficulties.has(p.difficulty));
                }
                if (filters.types && filters.types.size > 0) {
                    results = results.filter(p => filters.types.has(p.type));
                }
                if (filters.tags) {
                    const tagNames = [];
                    DIMENSION_KEYS.forEach(key => {
                        const ids = filters.tags[key] || new Set();
                        const map = dimensionMaps[key] || {};
                        for (const id of ids) {
                            for (const [name, val] of Object.entries(map)) {
                                if (val === id) {
                                    tagNames.push(name);
                                    break;
                                }
                            }
                        }
                    });
                    if (tagNames.length > 0) {
                        results = results.filter(p => {
                            if (!p.tags || p.tags.length === 0) return false;
                            return p.tags.some(t => tagNames.includes(t));
                        });
                    }
                }

                if (filters.filterAccepted && userStatusReady) {
                    results = results.filter(p => !acceptedSet.has(p.pid));
                }
                if (filters.filterSubmitted && userStatusReady) {
                    results = results.filter(p => !submittedSet.has(p.pid));
                }

                console.log(`【洛谷随机跳题】筛选前 ${totalBefore} 题 → 筛选后 ${results.length} 题`,
                    filters.filterAccepted ? `(排除AC ${acceptedSet.size})` : '',
                    filters.filterSubmitted ? `(排除尝试 ${submittedSet.size})` : '');

                if (results.length === 0) {
                    resolve(null);
                } else {
                    const random = results[Math.floor(Math.random() * results.length)];
                    resolve(random);
                }
            };
            req.onerror = () => reject(req.error);
        });
    }

    let panelUpdateFilterUI = null;

    function createFloatingPanel(button) {
        const panel = document.createElement('div');
        panel.style.cssText = `
            position: fixed;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.08);
            padding: 16px 18px;
            width: 300px;
            max-height: 480px;
            overflow-y: auto;
            border: 1px solid #eee;
            z-index: 2147483647;
            display: none;
            font-size: 13px;
            line-height: 1.5;
            color: #333;
        `;

        const typeTitle = document.createElement('div');
        typeTitle.textContent = '题库';
        typeTitle.style.cssText = 'font-weight:600; font-size:14px; margin-bottom:8px; color:#111;';
        panel.appendChild(typeTitle);

        const typeContainer = document.createElement('div');
        typeContainer.style.cssText = 'display:grid; grid-template-columns:1fr 1fr; gap:4px 10px; margin-bottom:16px;';
        TYPE_KEYS.forEach(displayName => {
            const typeValue = TYPE_MAP[displayName];
            const labelEl = document.createElement('label');
            labelEl.style.cssText = 'display:flex; align-items:center; padding:3px 6px; cursor:pointer; border-radius:6px; transition:background 0.15s;';
            labelEl.onmouseenter = () => { labelEl.style.background = '#f5f7fa'; };
            labelEl.onmouseleave = () => { labelEl.style.background = 'transparent'; };

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = typeValue;
            checkbox.style.cssText = 'margin-right:6px; width:15px; height:15px; accent-color:#4f8ef7; cursor:pointer;';
            checkbox.checked = selectedTypes.has(typeValue);
            checkbox.addEventListener('change', function() {
                const val = this.value;
                if (this.checked) selectedTypes.add(val);
                else selectedTypes.delete(val);
                saveSettings();
            });

            const span = document.createElement('span');
            span.textContent = displayName;
            span.style.fontSize = '12px';

            labelEl.appendChild(checkbox);
            labelEl.appendChild(span);
            typeContainer.appendChild(labelEl);
        });
        panel.appendChild(typeContainer);

        const diffTitle = document.createElement('div');
        diffTitle.textContent = '难度';
        diffTitle.style.cssText = 'font-weight:600; font-size:14px; margin-bottom:8px; color:#111;';
        panel.appendChild(diffTitle);

        const diffContainer = document.createElement('div');
        diffContainer.style.cssText = 'display:grid; grid-template-columns:1fr 1fr; gap:4px 10px; margin-bottom:16px;';
        Object.entries(DIFFICULTY_MAP).forEach(([value, label]) => {
            const labelEl = document.createElement('label');
            labelEl.style.cssText = 'display:flex; align-items:center; padding:3px 6px; cursor:pointer; border-radius:6px; transition:background 0.15s;';
            labelEl.onmouseenter = () => { labelEl.style.background = '#f5f7fa'; };
            labelEl.onmouseleave = () => { labelEl.style.background = 'transparent'; };

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = value;
            checkbox.style.cssText = 'margin-right:6px; width:15px; height:15px; accent-color:#4f8ef7; cursor:pointer;';
            checkbox.checked = selectedDifficulties.has(parseInt(value));
            checkbox.addEventListener('change', function() {
                const val = parseInt(this.value);
                if (this.checked) selectedDifficulties.add(val);
                else selectedDifficulties.delete(val);
                saveSettings();
            });

            const span = document.createElement('span');
            span.textContent = label;
            span.style.fontSize = '12px';

            labelEl.appendChild(checkbox);
            labelEl.appendChild(span);
            diffContainer.appendChild(labelEl);
        });
        panel.appendChild(diffContainer);

        const filterTitle = document.createElement('div');
        filterTitle.textContent = '筛选';
        filterTitle.style.cssText = 'font-weight:600; font-size:14px; margin-bottom:8px; color:#111;';
        panel.appendChild(filterTitle);

        const filterContainer = document.createElement('div');
        filterContainer.style.cssText = 'display:flex; flex-direction:column; gap:6px; margin-bottom:16px;';

        const tip = document.createElement('div');
        tip.className = 'filter-status-tip';
        tip.style.cssText = 'font-size:11px; color:#999; margin-top:-4px; margin-bottom:4px;';
        filterContainer.appendChild(tip);

        const stats = document.createElement('div');
        stats.className = 'filter-stats';
        stats.style.cssText = 'font-size:11px; color:#666; margin-bottom:4px;';
        filterContainer.appendChild(stats);

        function createFilterCheckbox(text, getter, setter) {
            const label = document.createElement('label');
            label.className = 'filter-checkbox';
            label.style.cssText = 'display:flex; align-items:center; padding:3px 6px; cursor:pointer; border-radius:6px; transition:background 0.15s;';
            label.onmouseenter = () => { label.style.background = '#f5f7fa'; };
            label.onmouseleave = () => { label.style.background = 'transparent'; };

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.style.cssText = 'margin-right:6px; width:15px; height:15px; accent-color:#4f8ef7; cursor:pointer;';
            checkbox.checked = getter();
            checkbox.addEventListener('change', function() {
                setter(this.checked);
                saveSettings();
            });

            const span = document.createElement('span');
            span.textContent = text;
            span.style.fontSize = '12px';

            label.appendChild(checkbox);
            label.appendChild(span);
            return { label, checkbox };
        }

        const cb1 = createFilterCheckbox('仅显示未 AC', () => filterAccepted, val => { filterAccepted = val; });
        const cb2 = createFilterCheckbox('仅显示未尝试', () => filterSubmitted, val => { filterSubmitted = val; });
        filterContainer.appendChild(cb1.label);
        filterContainer.appendChild(cb2.label);

        function updateFilterUI() {
            const enabled = userUid !== null && userStatusReady;
            tip.textContent = enabled ? '（已登录，筛选可用）' : '（请先点击下方“刷新做题记录”按钮登录/刷新）';
            stats.textContent = enabled
                ? `已缓存 AC ${acceptedSet.size} 题，尝试 ${submittedSet.size} 题`
                : '暂无做题记录';

            [cb1, cb2].forEach(cb => {
                cb.checkbox.disabled = !enabled;
                if (!enabled) {
                    cb.checkbox.checked = false;
                    if (cb === cb1) filterAccepted = false;
                    if (cb === cb2) filterSubmitted = false;
                }
                cb.label.style.opacity = enabled ? '1' : '0.5';
                cb.label.style.cursor = enabled ? 'pointer' : 'not-allowed';
            });
        }
        updateFilterUI();
        panelUpdateFilterUI = updateFilterUI;

        panel.appendChild(filterContainer);

        const actionContainer = document.createElement('div');
        actionContainer.style.cssText = 'display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap;';

        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = '刷新做题记录';
        refreshBtn.style.cssText = `
            flex:1; padding:4px 8px; font-size:12px; border:1px solid #ccc; border-radius:4px;
            background:#f8f8f8; cursor:pointer; transition:background 0.15s;
        `;
        refreshBtn.onmouseenter = () => { refreshBtn.style.background = '#e8e8e8'; };
        refreshBtn.onmouseleave = () => { refreshBtn.style.background = '#f8f8f8'; };
        refreshBtn.onclick = async function(e) {
            e.stopPropagation();
            try {
                await refreshUserStatus(true);
            } catch (err) {
                console.error(err);
                showStatusMessage('刷新失败：' + err.message, true);
            }
        };
        actionContainer.appendChild(refreshBtn);

        const updateBtn = document.createElement('button');
        updateBtn.textContent = '更新题库';
        updateBtn.style.cssText = `
            flex:1; padding:4px 8px; font-size:12px; border:1px solid #ccc; border-radius:4px;
            background:#f8f8f8; cursor:pointer; transition:background 0.15s;
        `;
        updateBtn.onmouseenter = () => { updateBtn.style.background = '#e8e8e8'; };
        updateBtn.onmouseleave = () => { updateBtn.style.background = '#f8f8f8'; };
        updateBtn.onclick = function(e) {
            e.stopPropagation();
            if (confirm('确定要重新下载并更新题库吗？这将覆盖本地缓存。')) {
                showStatusMessage('正在更新题库...');
                downloadAndImportData((current, total) => {
                    showStatusMessage(`更新进度: ${current}/${total}`);
                }).then(() => {
                    showStatusMessage('题库更新完成！');
                }).catch(err => {
                    console.error(err);
                    showStatusMessage('更新失败，请检查网络。', true);
                });
            }
        };
        actionContainer.appendChild(updateBtn);

        panel.appendChild(actionContainer);

        DIMENSION_KEYS.forEach(dimKey => {
            const dimName = DIMENSION_NAMES[dimKey] || dimKey;
            const map = dimensionMaps[dimKey] || {};
            const tagSet = selectedTags[dimKey];

            const section = document.createElement('div');
            section.style.cssText = 'margin-bottom:14px;';

            const header = document.createElement('div');
            header.textContent = dimName;
            header.style.cssText = 'font-weight:600; font-size:13px; color:#222; margin-bottom:4px;';
            section.appendChild(header);

            const selectedContainer = document.createElement('div');
            selectedContainer.style.cssText = 'display:flex; flex-wrap:wrap; gap:4px; margin-bottom:4px;';
            section.appendChild(selectedContainer);

            function updateSelectedDisplay() {
                selectedContainer.innerHTML = '';
                if (tagSet.size === 0) {
                    selectedContainer.style.display = 'none';
                    return;
                }
                selectedContainer.style.display = 'flex';
                tagSet.forEach(tagId => {
                    let name = null;
                    for (const [n, id] of Object.entries(map)) {
                        if (id === tagId) { name = n; break; }
                    }
                    const displayName = name || `ID:${tagId}`;
                    const tagEl = document.createElement('span');
                    tagEl.style.cssText = `
                        display:inline-flex; align-items:center;
                        background:#eef3ff; color:#2b5cd9;
                        padding:2px 10px; border-radius:14px;
                        font-size:11px; gap:4px;
                    `;
                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = displayName;
                    const removeBtn = document.createElement('span');
                    removeBtn.textContent = '×';
                    removeBtn.style.cssText = 'cursor:pointer; font-weight:700; color:#7a8bb0; font-size:14px;';
                    removeBtn.onclick = (e) => {
                        e.stopPropagation();
                        tagSet.delete(tagId);
                        updateSelectedDisplay();
                        saveSettings();
                    };
                    tagEl.appendChild(nameSpan);
                    tagEl.appendChild(removeBtn);
                    selectedContainer.appendChild(tagEl);
                });
            }
            updateSelectedDisplay();

            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'position:relative;';

            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = `搜索 ${dimName}`;
            input.style.cssText = `
                width:100%; padding:4px 10px;
                border:1px solid #ddd; border-radius:6px;
                font-size:12px; outline:none;
                transition:border 0.15s;
                box-sizing:border-box;
            `;
            input.onfocus = () => { input.style.borderColor = '#4f8ef7'; };
            input.onblur = () => { input.style.borderColor = '#ddd'; };
            wrapper.appendChild(input);

            const suggestionBox = document.createElement('div');
            suggestionBox.style.cssText = `
                position:absolute; top:100%; left:0; right:0;
                background:#fff; border:1px solid #ddd; border-top:none;
                border-radius:0 0 6px 6px;
                max-height:120px; overflow-y:auto;
                display:none; z-index:10001;
                box-shadow:0 4px 12px rgba(0,0,0,0.05);
            `;
            wrapper.appendChild(suggestionBox);

            input.addEventListener('input', function() {
                const query = this.value.trim().toLowerCase();
                if (!query) { suggestionBox.style.display = 'none'; return; }
                const matches = [];
                for (const [name, id] of Object.entries(map)) {
                    if (name.toLowerCase().includes(query)) {
                        if (!matches.some(m => m.id === id)) {
                            matches.push({ id, name });
                        }
                    }
                }
                if (matches.length === 0) { suggestionBox.style.display = 'none'; return; }
                suggestionBox.innerHTML = '';
                matches.slice(0, 10).forEach(({ id, name }) => {
                    const item = document.createElement('div');
                    item.style.cssText = `
                        padding:3px 10px; cursor:pointer; font-size:12px;
                        border-bottom:1px solid #f5f5f5;
                        display:flex; justify-content:space-between;
                        transition:background 0.1s;
                    `;
                    item.onmouseenter = () => { item.style.background = '#f5f7fa'; };
                    item.onmouseleave = () => { item.style.background = 'transparent'; };
                    item.addEventListener('mousedown', function(e) { e.preventDefault(); });
                    item.onclick = () => {
                        if (!tagSet.has(id)) {
                            tagSet.add(id);
                            updateSelectedDisplay();
                            saveSettings();
                        }
                        input.value = '';
                        suggestionBox.style.display = 'none';
                    };
                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = name;
                    const idSpan = document.createElement('span');
                    idSpan.textContent = `ID:${id}`;
                    idSpan.style.cssText = 'color:#aaa; font-size:10px;';
                    item.appendChild(nameSpan);
                    item.appendChild(idSpan);
                    suggestionBox.appendChild(item);
                });
                suggestionBox.style.display = 'block';
            });

            input.addEventListener('blur', function() {
                setTimeout(() => { suggestionBox.style.display = 'none'; }, 200);
            });

            section.appendChild(wrapper);

            const clearBtn = document.createElement('button');
            clearBtn.textContent = '清空';
            clearBtn.style.cssText = `
                font-size:11px; color:#e55c5c; background:none; border:none;
                cursor:pointer; padding:2px 6px; margin-top:4px;
                border-radius:4px; transition:background 0.15s;
            `;
            clearBtn.onmouseenter = () => { clearBtn.style.background = '#fef0f0'; };
            clearBtn.onmouseleave = () => { clearBtn.style.background = 'transparent'; };
            clearBtn.onclick = () => {
                tagSet.clear();
                updateSelectedDisplay();
                saveSettings();
            };
            section.appendChild(clearBtn);

            panel.appendChild(section);
        });

        let hoverTimeout = null;
        button.addEventListener('mouseenter', function() {
            clearTimeout(hoverTimeout);
            panel.style.display = 'block';
            const rect = button.getBoundingClientRect();
            const panelRect = panel.getBoundingClientRect();
            let left = rect.right - panelRect.width;
            if (left < 10) left = 10;
            const maxLeft = window.innerWidth - panelRect.width - 10;
            if (left > maxLeft) left = maxLeft;
            let top = rect.top - panelRect.height - 10;
            if (top < 10) {
                top = rect.bottom + 10;
            }
            panel.style.left = left + 'px';
            panel.style.top = top + 'px';
            panel.style.bottom = 'auto';
            panel.style.right = 'auto';
        });

        button.addEventListener('mouseleave', function(e) {
            hoverTimeout = setTimeout(() => {
                const related = e.relatedTarget;
                if (related && (panel.contains(related) || button.contains(related))) {
                    return;
                }
                panel.style.display = 'none';
            }, 200);
        });

        panel.addEventListener('mouseenter', function() {
            clearTimeout(hoverTimeout);
            panel.style.display = 'block';
        });

        panel.addEventListener('mouseleave', function(e) {
            const related = e.relatedTarget;
            if (related && (panel.contains(related) || button.contains(related))) {
                return;
            }
            panel.style.display = 'none';
        });

        const parent = button.parentNode;
        parent.style.position = 'relative';
        parent.appendChild(panel);

        return panel;
    }

    async function startRandomJump() {
        if ((filterAccepted || filterSubmitted) && !userStatusReady) {
            if (confirm('您启用了 AC/尝试筛选，但尚未刷新做题记录。是否立即刷新？')) {
                try {
                    await refreshUserStatus(true);
                } catch (err) {
                    console.error(err);
                    showStatusMessage('获取失败，请手动点击“刷新做题记录”按钮。', true);
                    return;
                }
            } else {
                const tempAccepted = filterAccepted;
                const tempSubmitted = filterSubmitted;
                filterAccepted = false;
                filterSubmitted = false;
                await doRandomJump();
                filterAccepted = tempAccepted;
                filterSubmitted = tempSubmitted;
                return;
            }
        }
        await doRandomJump();
    }

    async function doRandomJump() {
        let diffArray;
        if (selectedDifficulties.size === 0) {
            diffArray = Object.keys(DIFFICULTY_MAP).map(Number);
        } else {
            diffArray = Array.from(selectedDifficulties);
        }
        let typeArray;
        if (selectedTypes.size === 0) {
            typeArray = Object.values(TYPE_MAP);
        } else {
            typeArray = Array.from(selectedTypes);
        }

        const filters = {
            difficulties: new Set(diffArray),
            types: new Set(typeArray),
            tags: selectedTags,
            filterAccepted: filterAccepted && userStatusReady,
            filterSubmitted: filterSubmitted && userStatusReady
        };

        try {
            const problem = await getRandomProblem(filters);
            if (!problem) {
                alert('没有找到符合条件的题目，请调整筛选条件。');
                return;
            }
            window.open(`https://www.luogu.com.cn/problem/${problem.pid}`, '_blank');
        } catch (err) {
            console.error(err);
            alert('查询失败，请重试。');
        }
    }

    function showStatusMessage(text, isError = false) {
        const existing = document.getElementById('luogu-offline-status');
        if (existing) existing.remove();
        const div = document.createElement('div');
        div.id = 'luogu-offline-status';
        div.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${isError ? '#f44336' : '#2196F3'};
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            z-index: 99999;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            max-width: 300px;
            word-wrap: break-word;
        `;
        div.textContent = text;
        document.body.appendChild(div);
        if (!isError) {
            setTimeout(() => { if (div.parentNode) div.remove(); }, 5000);
        }
    }

    function downloadAndImportData(progressCallback) {
        return new Promise((resolve, reject) => {
            if (typeof pako === 'undefined') {
                reject(new Error('pako 库未加载，请检查网络或刷新页面重试。'));
                return;
            }
            clearProblems().then(() => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: DATA_URL,
                    responseType: 'arraybuffer',
                    onload: function(res) {
                        try {
                            const compressed = new Uint8Array(res.response);
                            const decompressed = pako.ungzip(compressed, { to: 'string' });
                            const lines = decompressed.split('\n').filter(line => line.trim() !== '');
                            const total = lines.length;
                            const batchSize = 1000;
                            let imported = 0;

                            function importBatch(start) {
                                const end = Math.min(start + batchSize, total);
                                const batch = [];
                                for (let i = start; i < end; i++) {
                                    try {
                                        const obj = JSON.parse(lines[i]);
                                        batch.push({
                                            pid: obj.pid,
                                            title: obj.title,
                                            difficulty: obj.difficulty,
                                            type: obj.type,
                                            tags: obj.tags || []
                                        });
                                    } catch (e) {}
                                }
                                if (batch.length === 0) {
                                    if (end < total) importBatch(end);
                                    else resolve();
                                    return;
                                }
                                bulkInsert(batch).then(() => {
                                    imported += batch.length;
                                    if (progressCallback) progressCallback(imported, total);
                                    if (end < total) {
                                        importBatch(end);
                                    } else {
                                        setMetadata('data_version', new Date().toISOString()).then(() => resolve());
                                    }
                                }).catch(err => reject(err));
                            }

                            importBatch(0);
                        } catch (e) {
                            reject(e);
                        }
                    },
                    onerror: function(err) {
                        reject(err);
                    }
                });
            }).catch(err => reject(err));
        });
    }

    async function init() {
        if (typeof pako === 'undefined') {
            console.warn('pako 库尚未加载，等待...');
            const checkPako = setInterval(() => {
                if (typeof pako !== 'undefined') {
                    clearInterval(checkPako);
                    initCore();
                }
            }, 500);
            return;
        }
        await initCore();
    }

    async function initCore() {
        setupUI();
        console.log('【洛谷随机跳题】UI 已创建，等待用户状态初始化...');

        waitForUid().then(async (uid) => {
            if (uid) {
                const success = await initUserStatus(uid);
                if (success) {
                    console.log('【洛谷随机跳题】做题记录已就绪');
                    if (panelUpdateFilterUI) panelUpdateFilterUI();
                } else {
                    console.log('【洛谷随机跳题】做题记录未就绪，您可手动点击“刷新做题记录”');
                }
            } else {
                console.log('【洛谷随机跳题】未能获取用户 UID，筛选功能暂不可用');
            }
        });
    }

    function setupUI() {
        const btn = document.querySelector('[name="gotorandom"]');
        if (!btn) {
            console.warn('未找到随机跳题按钮');
            return;
        }

        const parent = btn.parentNode;
        const newBtn = document.createElement('button');
        newBtn.className = btn.className;
        newBtn.textContent = btn.textContent;
        newBtn.style.cssText = btn.style.cssText;
        for (const attr of btn.attributes) {
            if (attr.name !== 'name') {
                newBtn.setAttribute(attr.name, attr.value);
            }
        }
        newBtn.setAttribute('name', 'gotorandom-custom');
        parent.replaceChild(newBtn, btn);

        try {
            createFloatingPanel(newBtn);
        } catch (e) {
            console.error('创建面板失败:', e);
            showStatusMessage('UI 初始化失败，请刷新页面重试。', true);
            return;
        }

        newBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            try {
                const count = await getProblemCount();
                if (count === 0) {
                    showStatusMessage('正在下载题库数据，请稍候...');
                    await downloadAndImportData((current, total) => {
                        showStatusMessage(`导入进度: ${current}/${total}`);
                    });
                    showStatusMessage('题库数据导入完成！');
                }
                await startRandomJump();
            } catch (err) {
                console.error(err);
                showStatusMessage('发生错误，请刷新重试。', true);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
