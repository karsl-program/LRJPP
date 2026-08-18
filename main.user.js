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
// @version      2.8
// @description  筛选题库、难度、标签后随机跳题，使用离线题库
// @author       karsl
// @match        https://www.luogu.com.cn/
// @icon         https://www.luogu.com.cn/favicon.ico
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @connect      www.luogu.com.cn
// @connect      cdn.luogu.com.cn
// @connect      raw.githubusercontent.com
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
    const UPDATE_URL = 'https://raw.githubusercontent.com/karsl-program/LRJPP/main/main.user.js';
    const DOWNLOAD_URL = 'https://raw.githubusercontent.com/karsl-program/LRJPP/main/main.user.js';

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
        algorithm: [
            '语言入门',
            '字符串',
            '后缀自动机 SAM',
            '字典树 Trie',
            'AC 自动机',
            'KMP 算法',
            '后缀数组 SA',
            '后缀树',
            '有限状态自动机',
            '回文自动机 PAM',
            'Manacher 算法',
            '顺序结构',
            '分支结构',
            '循环结构',
            '数组',
            '字符串（入门）',
            '结构体',
            '函数与递归',
            'Lyndon 分解',
            'Z 函数',
            '动态规划 DP',
            '搜索',
            '广度优先搜索 BFS',
            '深度优先搜索 DFS',
            '剪枝',
            '记忆化搜索',
            '启发式搜索',
            '迭代加深搜索',
            '启发式迭代加深搜索 IDA*',
            'Dancing Links',
            '爬山算法 Local search',
            '模拟退火',
            '背包 DP',
            '数位 DP',
            '区间 DP',
            '树形 DP',
            '轮廓线 DP',
            '线性 DP',
            '状压 DP',
            '后缀平衡树',
            '数学',
            '图论',
            'Kruskal 重构树',
            '网络流',
            '信息论',
            '随机调整',
            '遗传算法',
            '图论建模',
            '图遍历',
            '拓扑排序',
            '最短路',
            '生成树',
            '平面图',
            '最小环',
            'A*  算法',
            '折半搜索 meet in the middle',
            '梯度下降法',
            '拉格朗日乘数法',
            '拉格朗日插值法',
            '单位根反演',
            '负权环',
            '连通块',
            '2-SAT',
            '平面图欧拉公式',
            '强连通分量',
            'Tarjan',
            '双连通分量',
            '欧拉回路',
            '差分约束',
            '仙人掌',
            '二分图',
            '一般图的最大匹配',
            '上下界网络流',
            '最小割',
            '费用流',
            '圆方树',
            '弦图',
            'Floyd 算法',
            '广义串并联图',
            'Hall 定理',
            '计算几何',
            '树形数据结构',
            '线段树',
            '并查集',
            '平衡树',
            '堆',
            '树状数组',
            'cdq 分治',
            '可并堆',
            '动态树 LCT',
            '三维计算几何',
            '向量',
            '凸包',
            '叉积',
            '线段相交',
            '半平面交',
            '旋转卡壳',
            '极角排序',
            '平面几何',
            '闵可夫斯基和 Minkowski sum',
            '博弈论',
            '线性数据结构',
            '单调队列',
            '颜色段均摊（珂朵莉树 ODT）',
            '树套树',
            '可持久化线段树',
            '可持久化',
            '前缀和',
            '栈',
            '队列',
            '博弈树',
            '整体二分',
            'K-D Tree',
            'Nim 积',
            '李超线段树',
            '吉司机线段树 segment tree beats',
            '线段树合并',
            'SG 函数',
            '二区间合并（猫树分治）',
            'KTT / Kinetic Tournament Tree',
            '原根',
            '多项式',
            '数论',
            '素数判断',
            '最大公约数 gcd',
            '扩展欧几里德算法',
            '不定方程',
            '进制',
            '分块',
            'ST 表',
            '快速傅里叶变换 FFT',
            '快速数论变换 NTT',
            '快速沃尔什变换 FWT',
            '快速莫比乌斯变换 FMT',
            '差分',
            '链表',
            '单调栈',
            'Berlekamp-Massey(BM) 算法',
            '集合幂级数，子集卷积',
            '哈希表',
            '模拟',
            '贪心',
            '基础算法',
            '中国剩余定理 CRT',
            '莫比乌斯反演',
            '逆元',
            'Lucas 定理',
            '类欧几里得算法',
            '调和级数',
            '欧拉降幂',
            'Stern-Brocot 树',
            '整除分块',
            'Dirichlet 卷积',
            '大步小步算法 BSGS',
            '二次剩余',
            'Bézout 定理',
            '杜教筛',
            '欧拉函数',
            '线性筛法',
            '亚线性快速求和算法',
            '递推',
            '倍增',
            '二分',
            '递归',
            '枚举',
            '分治',
            '排序',
            '动态规划优化',
            '优先队列',
            '矩阵加速',
            '斜率优化',
            '状态合并',
            '凸完全单调性（wqs 二分）',
            '四边形不等式',
            'DP 套 DP',
            '动态 DP',
            '决策单调性',
            'STL',
            '整体转移',
            '斜率维护技巧 slope trick',
            '点分治',
            '树上启发式合并',
            '树的遍历',
            '最近公共祖先 LCA',
            '树的直径',
            '树链剖分',
            '树论',
            '群论',
            '置换',
            'Pólya 定理',
            '虚树',
            '组合数学',
            '排列组合',
            '二项式定理',
            '康托展开',
            '基环树',
            '动态树分治',
            'Prüfer 序列',
            '全局平衡二叉树',
            '树的重心',
            'LGV 引理',
            '矩阵树定理',
            '矩阵运算',
            '鸽笼原理',
            '容斥原理',
            'Fibonacci 数列',
            'Catalan 数',
            'Stirling 数',
            '生成函数',
            '概率论',
            '期望',
            '线性代数',
            '矩阵乘法',
            '线性递推',
            '高斯消元',
            'Dilworth 定理',
            '拉格朗日反演',
            '杨表',
            '随机游走 Markov Chain',
            '鞅的停时定理',
            '暴力数据结构',
            '高精度',
            '莫队',
            '三分',
            '离散化',
            '霍夫曼树',
            '哈希 hashing',
            '线性基',
            '微积分',
            '导数',
            '积分',
            '定积分',
            '级数',
            '扫描线',
            '其它技巧',
            '随机化',
            '位运算',
            '构造',
            '行列式',
            '特征值',
            '分数规划',
            '线性规划',
            '双指针 two-pointer',
            'Ad-hoc',
            '笛卡尔树',
            '拟阵',
            '根号分治',
            '模拟费用流',
            '分散层叠',
            '均摊分析',
            '分类讨论',
            '近似算法',
            '线段树分治',
            '离线处理',
            'bitset',
            '组合优化',
            '整数规划',
            '原始对偶',
            '启发式合并',
            '反悔贪心',
            '最大流最小割定理',
            '保序回归'
        ],
        source: [
            '各省省选',
            '集训队互测',
            '福建省历届夏令营',
            'NOI',
            'NOIP 普及组',
            'NOIP 提高组',
            'APIO',
            'NOI 导刊',
            'CTT（清华集训/北大集训）',
            '网络流与线性规划 24 题',
            'CSP-S 提高级',
            'CSP-J 入门级',
            'NOI Online',
            'Ynoi',
            'NOI 系列赛事',
            '经典套题',
            '国际知名赛事',
            'WC',
            'CTSC/CTS',
            '模板题',
            'USACO',
            'POI（波兰）',
            'IOI',
            'CCO（加拿大）',
            'CCC（加拿大）',
            'CEOI（中欧）',
            'eJOI（欧洲）',
            'COCI（克罗地亚）',
            'BalticOI（波罗的海）',
            'JOI（日本）',
            'AGM',
            'PA（波兰）',
            'ROI（俄罗斯）',
            'EGOI（欧洲/女生）',
            'NOISG（新加坡）',
            'NordicOI（北欧）',
            'BalkanOI（巴尔干半岛）',
            'KOI（韩国）',
            'RMI（罗马尼亚）',
            'COI（克罗地亚）',
            '洛谷原创',
            'ICPC',
            '洛谷月赛',
            '语言月赛',
            '洛谷比赛',
            '大学竞赛',
            'ROIR（俄罗斯）',
            'INOI（伊朗）',
            'UOI（乌克兰）',
            'JOISC/JOIST（日本）',
            'COTS（克罗地亚）',
            'Google Code Jam',
            'Moscow Olympiad',
            'PO（瑞典）',
            'PAIO',
            'MCC/MCO（马来西亚）',
            'KTSC（韩国）',
            'IATI（保加利亚/东欧）',
            'Google Kick Start',
            '入门赛',
            '蓝桥杯国赛',
            '蓝桥杯省赛',
            '省赛/邀请赛',
            '传智杯',
            'THUPC',
            'GESP',
            '其他竞赛',
            'THUSC',
            '高校校赛',
            'THUWC',
            'CSP-X 小学组',
            'Code+',
            '梦熊比赛',
            '信息与未来',
            '科创活动',
            'BCSP-X',
            '小学活动',
            '初中活动',
            'CSPro',
            'CCPC',
            '科大国创杯',
            '蓝桥杯青少年组'
        ],
        time: [
            '1996',
            '1997',
            '1998',
            '1999',
            '2000',
            '2001',
            '2002',
            '2003',
            '2004',
            '2005',
            '2006',
            '2007',
            '2008',
            '2009',
            '2010',
            '2011',
            '2012',
            '2013',
            '2014',
            '2015',
            '2016',
            '2017',
            '2018',
            '2019',
            '2020',
            '2021',
            '2022',
            '2023',
            '2024',
            '2025',
            '2026',
            '2027',
            '2028',
            '2029',
            '2077',
            '2078',
            '2079'
        ],
        region: [
            '重庆',
            '四川',
            '河南',
            '浙江',
            '上海',
            '福建',
            '江苏',
            '安徽',
            '湖南',
            '北京',
            '河北',
            '广东',
            '山东',
            '吉林',
            '山西',
            '江西',
            '贵州',
            '广西',
            '陕西',
            '国内省市',
            '辽宁',
            '云南',
            '天津',
            '湖北',
            '黑龙江',
            '海南',
            '甘肃',
            '青海',
            '台湾',
            '内蒙古',
            '西藏',
            '宁夏',
            '新疆',
            '香港',
            '澳门',
            '济南',
            '南京',
            '青岛',
            '国内赛站',
            'EC Final',
            '国际赛区',
            'NERC/NEERC',
            'SEERC',
            'CERC',
            'NWRRC',
            'WF',
            'NAC',
            '杭州',
            '昆明',
            '西安',
            '哈尔滨',
            '首尔',
            '横浜',
            'SWERC',
            '成都',
            '雅加达'
        ],
        special: [
            '交互题',
            '提交答案',
            'Special Judge',
            'O2优化',
            '通信题'
        ]
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

    function compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        const len = Math.max(parts1.length, parts2.length);
        for (let i = 0; i < len; i++) {
            const a = parts1[i] || 0;
            const b = parts2[i] || 0;
            if (a > b) return 1;
            if (a < b) return -1;
        }
        return 0;
    }

    function checkForUpdate() {
        return new Promise((resolve) => {
            console.log('[更新检查] 开始请求', UPDATE_URL);
            GM_xmlhttpRequest({
                method: 'GET',
                url: UPDATE_URL,
                onload: function(res) {
                    console.log('[更新检查] 响应状态:', res.status);
                    console.log('[更新检查] 响应长度:', res.responseText ? res.responseText.length : 0);
                    try {
                        const text = res.responseText;
                        const versionMatch = text.match(/@version\s+([\d.]+)/);
                        if (!versionMatch) {
                            console.warn('[更新检查] 未解析到版本号');
                            resolve(false);
                            return;
                        }
                        const remoteVersion = versionMatch[1];
                        const currentVersion = GM_info.script.version;
                        console.log('[更新检查] 当前版本:', currentVersion, '远程版本:', remoteVersion);
                        if (compareVersions(remoteVersion, currentVersion) > 0) {
                            console.log('[更新检查] 发现新版本，弹出对话框');
                            showUpdateDialog(currentVersion, remoteVersion);
                            resolve(true);
                        } else {
                            console.log('[更新检查] 已是最新版本');
                            resolve(false);
                        }
                    } catch (e) {
                        console.error('[更新检查] 解析出错', e);
                        resolve(false);
                    }
                },
                onerror: function(err) {
                    console.warn('[更新检查] 请求失败', err);
                    resolve(false);
                }
            });
        });
    }

    function showUpdateDialog(currentVersion, newVersion) {
        const existing = document.getElementById('luogu-update-dialog-overlay');
        if (existing) existing.remove();
    
        const overlay = document.createElement('div');
        overlay.id = 'luogu-update-dialog-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(2px);
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease;
        `;
    
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            padding: 24px 28px;
            width: 360px;
            max-width: 90vw;
            text-align: center;
            animation: slideUp 0.25s ease;
        `;
    
        const icon = document.createElement('div');
        icon.innerHTML = '🚀';
        icon.style.cssText = 'font-size: 42px; margin-bottom: 12px;';
    
        const title = document.createElement('h3');
        title.textContent = '发现新版本';
        title.style.cssText = 'margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #1a1a1a;';
    
        const info = document.createElement('p');
        info.style.cssText = 'margin: 0 0 24px; font-size: 14px; color: #555; line-height: 1.5;';
        info.innerHTML = `当前版本 <b>v${currentVersion}</b><br>最新版本 <b style="color: #4f8ef7;">v${newVersion}</b>`;
    
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'display: flex; gap: 12px; justify-content: center;';
    
        const laterBtn = document.createElement('button');
        laterBtn.textContent = '稍后再说';
        laterBtn.style.cssText = `
            padding: 8px 20px;
            font-size: 14px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: #f5f5f5;
            cursor: pointer;
            transition: background 0.2s;
        `;
        laterBtn.onmouseenter = () => { laterBtn.style.background = '#e8e8e8'; };
        laterBtn.onmouseleave = () => { laterBtn.style.background = '#f5f5f5'; };
        laterBtn.onclick = () => overlay.remove();
    
        const updateBtn = document.createElement('button');
        updateBtn.textContent = '立即更新';
        updateBtn.style.cssText = `
            padding: 8px 20px;
            font-size: 14px;
            border: none;
            border-radius: 8px;
            background: #4f8ef7;
            color: white;
            cursor: pointer;
            transition: background 0.2s;
        `;
        updateBtn.onmouseenter = () => { updateBtn.style.background = '#3a7bd5'; };
        updateBtn.onmouseleave = () => { updateBtn.style.background = '#4f8ef7'; };
        updateBtn.onclick = () => {
            window.open(DOWNLOAD_URL, '_blank');
            overlay.remove();
        };
    
        btnContainer.appendChild(laterBtn);
        btnContainer.appendChild(updateBtn);
    
        dialog.appendChild(icon);
        dialog.appendChild(title);
        dialog.appendChild(info);
        dialog.appendChild(btnContainer);
    
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `;
        document.head.appendChild(style);
    }

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
                        const tags = filters.tags[key] || new Set();
                        tags.forEach(tag => tagNames.push(tag));
                    });
                    if (tagNames.length > 0) {
                        results = results.filter(p => {
                            if (!p.tags || p.tags.length === 0) return false;
                            return tagNames.every(tag => p.tags.includes(tag));
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
            const tagsList = dimensionMaps[dimKey] || [];
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
                tagSet.forEach(tagName => {
                    const tagEl = document.createElement('span');
                    tagEl.style.cssText = `
                        display:inline-flex; align-items:center;
                        background:#eef3ff; color:#2b5cd9;
                        padding:2px 10px; border-radius:14px;
                        font-size:11px; gap:4px;
                    `;
                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = tagName;
                    const removeBtn = document.createElement('span');
                    removeBtn.textContent = '×';
                    removeBtn.style.cssText = 'cursor:pointer; font-weight:700; color:#7a8bb0; font-size:14px;';
                    removeBtn.onclick = (e) => {
                        e.stopPropagation();
                        tagSet.delete(tagName);
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
                for (const tagName of tagsList) {
                    if (tagName.toLowerCase().includes(query)) {
                        if (!matches.includes(tagName)) {
                            matches.push(tagName);
                        }
                    }
                }
                if (matches.length === 0) { suggestionBox.style.display = 'none'; return; }
                suggestionBox.innerHTML = '';
                matches.slice(0, 10).forEach(tagName => {
                    const item = document.createElement('div');
                    item.style.cssText = `
                        padding:3px 10px; cursor:pointer; font-size:12px;
                        border-bottom:1px solid #f5f5f5;
                        transition:background 0.1s;
                    `;
                    item.onmouseenter = () => { item.style.background = '#f5f7fa'; };
                    item.onmouseleave = () => { item.style.background = 'transparent'; };
                    item.addEventListener('mousedown', function(e) { e.preventDefault(); });
                    item.onclick = () => {
                        if (!tagSet.has(tagName)) {
                            tagSet.add(tagName);
                            updateSelectedDisplay();
                            saveSettings();
                        }
                        input.value = '';
                        suggestionBox.style.display = 'none';
                    };
                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = tagName;
                    item.appendChild(nameSpan);
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

        checkForUpdate().catch(err => console.warn('检查更新失败', err));

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
