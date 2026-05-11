# 部署說明

這份專案是純靜態網站，可直接部署到：

- GitHub Pages
- Netlify
- Vercel

## 建議上傳的資料夾

優先使用 `dist` 資料夾，裡面已經是乾淨的發布包。

## 上線前建議先改的設定

正式提供給所有人使用前，建議先調整 `app-config.js`：

- `tileUrl`
  - 可改成你自己的地圖底圖來源
- `routingUrlTemplate`
  - 建議改成你自己的路徑規劃 API
- `enableLocalAutoReload`
  - 正式站可保持 `true` 或改成 `false`
  - 這個功能只會在 `localhost` 啟用，不會干擾正式站

如果你要讓大量使用者穩定使用，不建議長期直接依賴公開示範路徑服務。

## GitHub Pages

1. 建立一個新的 GitHub repository
2. 把 `dist` 內的檔案上傳到 repository 根目錄
3. 到 GitHub Pages 設定頁，把來源設成目前分支的 `/root`
4. 等待部署完成後，網址就會變成：

```text
https://你的帳號.github.io/你的專案名稱/
```

## Netlify

1. 建立新的 site
2. 拖曳 `dist` 資料夾到 Netlify 上傳區
3. 等待完成後，Netlify 會給你一個 HTTPS 網址

## Vercel

1. 建立新的專案
2. 匯入這份專案或直接上傳 `dist`
3. 保持靜態站預設設定即可

## 定位權限注意

要讓所有人都能正常使用定位，正式網址必須是：

- `https://...`
- 或 `http://localhost`

如果只是雙擊本機檔案的 `file://` 模式，很多瀏覽器會限制定位與地圖底圖。
