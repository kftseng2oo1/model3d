# model3d — 3D 模型庫

為「尼山聖境・大學堂 3D 導覽」（[kftseng2oo1/conlns](https://github.com/kftseng2oo1/conlns)）製作的原創程式生成模型，全部匯出成 **glTF 2.0 二進位（.glb）**，可直接放進 three.js、Blender、Unity、Unreal、Godot、model-viewer 等軟體使用。

- **模型總覽**：開啟 `index.html`（啟用 GitHub Pages 後即為網站首頁），每張卡片可 3D 檢視、播放動畫、下載 .glb
- **互動版**：`pages/` 底下是各模型的原始製作頁，可以點擊互動，也能從頁面重新匯出 .glb
- **程式模型原始碼**：`src/` 為杏樹、鐘鼓、弟子四型的產生程式（ES5，three.js r147–r160 皆可用）

## 模型清單

| 名稱 | 類別 | 說明 | 檔案 | 大小 | 動畫 | 製作頁 |
|---|---|---|---|---|---|---|
| 烏龜 | 動物 | 依照片設計的寫實烏龜，龜甲紋理與鱗片 | [`tortoise.glb`](models/tortoise.glb) | 8.76 MB | Walk / Idle / Blink / Retract | [互動版](pages/tortoise.html) |
| 玄武 | 五方神獸 | 北方神獸：龜蛇合體，龜殼玄紋、靈蛇纏繞 | [`xuanwu.glb`](models/xuanwu.glb) | 3.22 MB | Idle / Walk / Retract / SnakeRear / Blink / Awaken | [互動版](pages/xuanwu.html) |
| 朱雀 | 五方神獸 | 南方神獸：華麗火鳳，羽翼火焰、長尾開屏 | [`zhuque.glb`](models/zhuque.glb) | 4.16 MB | Idle / Cry / Flap / Display / Flame / Fly / Awaken | [互動版](pages/zhuque.html) |
| 青龍 | 五方神獸 | 東方神獸：翠鱗金鬃、踏雲戲珠 | [`dragon.glb`](models/dragon.glb) | 3.11 MB | Idle / Roar / Undulate / Pearl / Cloud / Fly / Awaken | [互動版](pages/qinglong.html) |
| 白虎 | 五方神獸 | 西方神獸：白虎披甲，坐於山岩台座 | [`tiger.glb`](models/tiger.glb) | 1.16 MB | Idle / Roar / Swipe / TailLash / Stand / Run / Awaken | [互動版](pages/baihu.html) |
| 麒麟 | 五方神獸 | 中央瑞獸：鹿身馬蹄龍首、翡翠金鱗、水晶獨角 | [`qilin.glb`](models/qilin.glb) | 0.95 MB | Idle / Cry / Stamp / Shake / Scroll / Leap / Awaken | [互動版](pages/qilin.html) |
| 孔子 | 人物 | 至聖先師：小冠金簪、長髯、寬袍大袖、捧竹簡 | [`confucius.glb`](models/confucius.glb) | 0.7 MB | Idle / Bow / Nod / Teach / Awaken | [互動版](pages/confucius.html) |
| 老子 | 人物 | 白眉長髯、布衣寬袖、藜杖掛葫蘆 | [`laozi.glb`](models/laozi.glb) | 0.38 MB | Idle / Bow / Nod / Speak | [互動版](pages/laozi.html) |
| 顏回 | 孔門弟子 | 盤坐讀竹簡，補丁布衣、竹籃與葫蘆 | [`yanhui.glb`](models/yanhui.glb) | 0.39 MB | — | [互動版](pages/disciples.html) |
| 子路 | 孔門弟子 | 武士站姿，甲冑紅巾、持劍 | [`zilu.glb`](models/zilu.glb) | 0.39 MB | — | [互動版](pages/disciples.html) |
| 子貢 | 孔門弟子 | 藍袍金邊華服，伸手論說 | [`zigong.glb`](models/zigong.glb) | 0.33 MB | — | [互動版](pages/disciples.html) |
| 曾子 | 孔門弟子 | 跪坐小几前執筆書寫，身旁書冊 | [`zengzi.glb`](models/zengzi.glb) | 0.33 MB | — | [互動版](pages/disciples.html) |
| 編鐘 | 禮器 | 曾侯乙式兩層鐘架：甬鐘五口、鈕鐘六口 | [`bianzhong.glb`](models/bianzhong.glb) | 1.33 MB | — | [互動版](pages/zhonggu.html) |
| 建鼓 | 禮器 | 虎座立柱、紅漆銅釘鼓身、華蓋五色流蘇 | [`jiangu.glb`](models/jiangu.glb) | 0.54 MB | — | [互動版](pages/zhonggu.html) |
| 懸鼓 | 禮器 | 紅漆鼓身、銅釘、彩繪雲紋鼓皮 | [`xuangu.glb`](models/xuangu.glb) | 0.28 MB | — | [互動版](pages/zhonggu.html) |
| 杏樹 | 植物 | 枝條層層分岔、白花（暗紅花萼、黃蕊）綴枝 | [`apricot.glb`](models/apricot.glb) | 0.26 MB | — | [互動版](pages/apricot.html) |

## 使用說明

- 單位為公尺，模型面朝 +Z、腳底在 y = 0
- 人物模型的材質依名稱命名（`robe`、`trim`、`skin`、`beard`…），可在程式裡依名稱換色；導覽中的孔子銅像就是把這些材質換成青銅
- 動畫為節點動畫（非骨架），在 three.js 用 `AnimationMixer` 依名稱播放即可
- 孔門弟子四型、鐘鼓、杏樹為靜態模型；導覽中以 InstancedMesh 大量擺放

## 檔案結構

```
index.html      模型總覽（卡片、3D 檢視、下載）
viewer.html     單一模型檢視器：viewer.html?m=<名稱>
models/         所有 .glb
models.json     模型清單（名稱、說明、大小、動畫）
pages/          各模型的互動製作頁
src/            程式模型原始碼（apricot.js、zhonggu.js、disciples.js）
```
