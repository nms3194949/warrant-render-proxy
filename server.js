// --- Render 專用的 server.js ---
// 【MOMO 修正】 Fullstack 最終版
// 它會同時託管「前端 (index.html)」和「後端 (API)」

const express = require('express');
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
const iconv = require('iconv-lite');
const path = require('path'); // 【MOMO 新增】 載入 'path' 模組

// (我們不再需要 'cors'，因為是同一個網域)
// const cors = require('cors'); 

const app = express();
const PORT = process.env.PORT || 10000;

// (不再需要 CORS)
// app.use(cors({ origin: '...' }));

// --- 【MOMO 新增】 託管靜態檔案 ---
// 告訴 Express，我們所有的前端檔案都放在 'public' 資料夾中
app.use(express.static(path.join(__dirname, 'public')));

// --- 【MOMO 修改】 API 路由 (完全不變) ---
app.get('/api/get-all-warrants', async (req, res) => {

    req.setTimeout(3540000); // 延長 Node.js 自己的超時

    try {
        const payloadObject = {
            format: "CSV",
            factor: {
                columns: [
                    "FLD_WAR_ID", "FLD_WAR_NM", "FLD_WAR_TXN_PRICE", "FLD_WAR_UP_DN",
                    "FLD_WAR_UP_DN_RATE", "FLD_WAR_TXN_VOLUME", "FLD_N_STRIKE_PRC",
                    "FLD_N_UND_CONVER", "FLD_PERIOD", "FLD_IN_OUT", "FLD_BUY_SELL_RATE",
                    "FLD_LEVERAGE", "FLD_IV_CLOSE_PRICE", "FLD_OUT_VOL_RATE"
                ],
                condition: [
                    { "field": "FLD_WAR_TYPE", "values": ["1", "2"] }
                ]
            },
            pagination: { "page": "1" }
        };
        const params = new URLSearchParams();
        params.append('data', JSON.stringify(payloadObject));

        const response = await fetch('https://www.warrantwin.com.tw/eyuanta/ws/GetWarData.ashx', {
            method: 'POST',
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'Referer': 'https://www.warrantwin.com.tw/eyuanta/Warrant/Search.aspx',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Yuanta Server Error: ${response.statusText} (Code: ${response.status})`);
        }

        const buffer = await response.arrayBuffer();
        const csvData = iconv.decode(Buffer.from(buffer), 'big5');

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(200).send(csvData);

    } catch (error) {
        console.error(error); // 這會顯示在 Render 日誌中
        res.status(500).send(`Error fetching data from Yuanta: ${error.message}`);
    }
});

// --- 【MOMO 新增】 處理所有其他的路由 ---
// 確保當使用者重新整理頁面時，還是能載入 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});