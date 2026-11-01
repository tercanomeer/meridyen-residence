# Projenize render ekleme

Motor her ekranı yalnızca proje verisinden (kat düzeni, oda ölçüleri, fiyat listesi) **çizim** olarak üretir. Render'larınız hazır olduğunda aynı ekranlara eklenir. Sitenin geri kalanı değişmez.

- **Ziyaretçinin gördüğü:** render'ı olan ekranlarda bir **Çizim / Render** düğmesi ve görselin köşesinde "Temsilidir" etiketi.
- **Render'ı olmayan ekranlar:** çizimle devam eder.
- **Görsel yüklenemezse:** ekran otomatik olarak çizime döner, boş kalmaz.

Render eklenebilen yerler:

| Ekran | Nereye yazılır | Görsel |
|---|---|---|
| Kule | `tower.render` | Dikey, en az 1600 × 2400 |
| Oda içi | `unitTypes.<tip>.rooms[].render` | 16:9, en az 2400 × 1350 |

Kat planı ve daire planı her zaman çizimdir. Ölçülü ve etkileşimli oldukları için render ile değiştirilmezler.

## 1. Görselleri hazırlayın

1. PNG ya da JPG dosyalarını `projects/<proje>/renders/` klasörüne koyun. Dosya adları küçük harfle, boşluksuz olsun: `tower.png`, `a2-salon.png`.
2. Çevirme betiğini çalıştırın:

   ```bash
   python3 tools/optimize-renders.py <proje>
   ```

   Betik ne yapar:
   - Her görsel için iki WebP üretir:

     | Dosya | Boyut | Kullanım |
     |---|---|---|
     | `<ad>.webp` | uzun kenar en çok 2400 px | masaüstü |
     | `<ad>-small.webp` | yarı boyut | telefon |

   - Asıl dosyaları `renders/originals/` klasörüne taşır. Bu klasör git'e girmez.
   - Sonunda `project.json`'a yapıştırılacak `render` satırlarını yazar.

   Betik için Pillow kütüphanesi gerekir (`pip install pillow`).

## 2. Oda render'ı

Odanın tanımına `render` alanını ekleyin. Mevcut `visual` alanı yerinde kalır; çizim modunda ve yedek olarak o kullanılır.

```json
{ "id": "salon", "kind": "living", "rect": [0, 5, 7.5, 5.5], "visual": "svg:room-living",
  "render": { "src": "renders/a2-salon.webp", "small": "renders/a2-salon-small.webp", "size": [2400, 1350], "focus": [0.5, 0.55] } }
```

| Alan | Anlamı |
|---|---|
| `src` | Görsel yolu, proje klasörüne göre |
| `small` | Telefon için yarı boyutlu görsel (isteğe bağlı) |
| `size` | `src` görselinin piksel boyutu |
| `focus` | Telefonda kırpılırken görünür kalacak nokta, 0–1 (isteğe bağlı, varsayılan orta) |

### Aynı görseli birden fazla odada kullanmak

Benzer odalar için her seferinde ayrı görsel gerekmez. Görseli bir kez `renders` kütüphanesine yazın, odalardan adıyla başvurun:

```json
"renders": {
  "banyo-dogu": { "src": "renders/banyo-dogu.webp", "small": "renders/banyo-dogu-small.webp", "size": [2400, 1340], "focus": [0.5, 0.5] }
},
…
{ "id": "banyo", "kind": "bath", "rect": [14.5, 5, 3.5, 4], "visual": "svg:room-bath", "render": "banyo-dogu" },
{ "id": "banyo", "kind": "bath", "rect": [0, 0, 3, 2], "visual": "svg:room-bath", "render": { "use": "banyo-dogu", "mirror": true } }
```

- `"render": "ad"` kütüphanedeki görseli olduğu gibi kullanır.
- `{ "use": "ad", "mirror": true }` görseli yatay çevirir. Örneğin doğuya bakan banyonun görseli batıya bakan banyoda kullanılır.
- `{ "use": "ad", "focus": [x, y] }` kütüphanedeki değerleri yalnızca bu oda için değiştirir.

Aynalanmış bir dairede çevirmeler birbirini götürür. `mirror: true` olan bir oda, aynalı dairede görseli asıl hâliyle gösterir.

**Kırpma:** görsel ekranı doldurur. Telefonda yanlardan kırpılır ve 16:9 görselin ortadaki yaklaşık %45'i görünür. Asıl öğeler bu şeritte olmalı; değilse `focus` ile kaydırın.

**Aynalanmış daireler:** kat düzeninde `"mirror": true` olan dairelerde görsel otomatik olarak yatay çevrilir. Bu yüzden görselde yazı ya da logo olmamalı.

**Plana uyum:** pencere, manzara ve ışık yönü plandaki odayla uyuşmalı. Örnek bir brif için bkz. [render-briefs.md](render-briefs.md).

## 3. Kule render'ı ve kalibrasyon

Kule görselinde katların nerede durduğunu motor bilemez. Kalibrasyon aracıyla birkaç dakikada işaretlenir.

1. `tower.render` alanına önce `src`, `small` ve `size` değerlerini yazın.
2. Yerel sunucuyu başlatın ve aracı açın: `http://localhost:4318/tools/calibrate.html`
3. **Projeden yükle**'ye basın. Araç `project.json`'daki görseli ve kat sayısını alır.
4. Görsel üzerinde işaretleri koyun. Kırmızı köşe sıradaki tıklamadır.
   - **1. kat altı:** sol köşe, sonra sağ köşe.
   - **Son kat üstü:** sol köşe, sonra sağ köşe.
5. Cephe bir yerde değişiyorsa (çıkma, geri çekilme, teras katı) **İşaret ekle** ile iki işaret daha koyun. Örneğin:
   - 29. katın **üstü**: dar cephenin köşeleri.
   - 30. katın **altı**: geniş cephenin köşeleri.
6. Kat bantları görselin üzerine çizilir. Kayan bir kat varsa noktayı sürükleyerek düzeltin.
7. **Kopyala**'ya basın ve çıktıyı `project.json`'daki `tower` nesnesine yapıştırın.

Çıktı şöyle görünür:

```json
"render": {
  "src": "renders/tower.webp",
  "small": "renders/tower-small.webp",
  "size": [1600, 2400],
  "floors": [
    {"floor": 1, "edge": "bottom", "left": [0.375, 0.8542], "right": [0.625, 0.8542]},
    {"floor": 29, "edge": "top", "left": [0.3841, 0.25], "right": [0.6159, 0.25]},
    {"floor": 30, "edge": "bottom", "left": [0.3591, 0.25], "right": [0.6409, 0.25]},
    {"floor": 32, "edge": "top", "left": [0.36, 0.1875], "right": [0.64, 0.1875]}
  ]
}
```

**Kat sayısı:** görseldeki kat sayısının projedeki sayıyla birebir tutması gerekmez. Bantlar işaretler arasında eşit bölünür.

**Ekrana yerleşim:**
- **Telefon (dikey ekran):** dikey görsel başlığın altındaki alana sığdırılır.
- **Masaüstü (yatay ekran):** geniş görsel varsa ekranı tamamen kaplar.
- **Kalan alan:** görselin tamamı sığdırıldığında (telefonda ya da geniş görsel yokken) ekranın geri kalanı görselin kendisinden uzatılır. Yanlarda kenar şeridi aynalanarak devam eder; üstte gökyüzü, altta su uzar. Şeridin genişliği kalibrasyondaki kule köşelerinden hesaplanır, kule hiçbir zaman kopyalanmaz.

### Masaüstü için geniş görsel (önerilir)

Dikey kule görseli yatay ekranda yanlarda boşluk bırakır. Aynı kulenin 16:9 geniş bir sürümünü `tower.render.wide` alanına ekleyin; ekran yataysa motor onu kullanır.

1. **Görseli üretin.** En kolay yol, dikey görseli yapay zekâ ile yanlara genişletmektir: kule aynı kalır, gökyüzü, deniz ve siluet uzar. Kulenin üstünde boş gökyüzü bırakın; ekran oranı 16:9'dan farklıysa (ör. 16:10) görselin kenarları biraz kırpılır.
2. **Çevirin.** `tower-wide.png` olarak `renders/` klasörüne koyup çevirme betiğini çalıştırın.
3. **Kalibre edin.** Kalibrasyon aracında **Görsel türü → Geniş** seçin, işaretleri koyun ve çıktıyı `tower.render` nesnesinin içine yapıştırın:

```json
"render": {
  "src": "renders/tower.webp",
  "size": [1610, 2400],
  "floors": [ … ],
  "wide": {
    "src": "renders/tower-wide.webp",
    "small": "renders/tower-wide-small.webp",
    "size": [2400, 1350],
    "focus": [0.5, 0.5],
    "floors": [ … ]
  }
}
```

`focus`, ekran oranı görselinkinden farklı olduğunda kırpmanın hangi noktaya göre yapılacağını belirler (isteğe bağlı).

## Kontrol listesi

- [ ] Her görselin hem çizim hem render modunda açıldığını kontrol edin. Düğme odada sol üstte, kulede başlığın altında durur.
- [ ] Telefon genişliğinde (375 px) odaların asıl öğeleri görünüyor.
- [ ] Aynalanmış bir dairede görsel doğru tarafa bakıyor.
- [ ] Kule render'ında her kat, üzerine gelince doğru kat numarasını gösteriyor.
