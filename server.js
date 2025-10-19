// --- Render 專用的 server.js ---
// 這是一個完整的 Express 伺服器

const express = require('express');
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
const iconv = require('iconv-lite');
const cors = require('cors'); // 引入 cors 套件

const app = express();
const PORT = process.env.PORT || 10000; // Render 會透過環境變數 $PORT 告訴您要監聽哪個埠

// --- CORS 設定 ---
// 允許來自您 GitHub 網站的請求
app.use(cors({
  origin: 'https://nms3194949.github.io'
}));

// --- API 路由 ---
// Vercel 是 /api/get-warrants-csv，
// 在 Render 我們可以自訂，例如 /api/get-all-warrants
app.get('/api/get-all-warrants', async (req, res) => {
    
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
                    // 【抓取全部資料版】
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
                'Referer': 'https://www.warrantwin.com.tw/eyuanta/Warrant/Search.aspx'
            }
        });

        if (!response.ok) {
            throw new Error(`Yuanta Server Error: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        const csvData = iconv.decode(Buffer.from(buffer), 'big5');
        
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(200).send(csvData);

    } catch (error) {
        console.error(error);
        res.status(500).send(`Error fetching data from Yuanta: ${error.message}`);
    }
});

// --- 啟動伺服器 ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});