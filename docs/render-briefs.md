# Meridyen Rezidans: render brifleri

Demo için üretilecek 8 görselin tarifi. Ölçüler, yönler ve odalar `projects/meridyen/project.json` dosyasından alındı. Görsel plana uymazsa site kendi içinde çelişir, bu yüzden her brifteki **"plana uyum"** maddeleri pazarlık konusu değil.

## Nasıl kullanılır (Gemini)

1. **Modeli seç:** Gemini'de en güçlü görsel modelini (Pro görsel modeli / Nano Banana Pro) kullan.
2. **Prompt'u kur:** üç parçayı tek mesajda, şu sırayla yapıştır:
   - **Referans cümlesi:** yalnızca görselin notunda "Referans" yazıyorsa. Referans görselini de mesaja ekle.
   - **Ortak stil bloğu ve görselin prompt'u.**
   - **Kaçınılacaklar listesi.**

   Prompt'lar İngilizce, çünkü model İngilizcede daha tutarlı sonuç veriyor.
3. **Sırayı koru:**
   - Önce `a2-salon` üret; seçtiğin salon, diğer iç mekânların referansı olacak.
   - Kuleyi ayrı bir sohbette, referanssız üret.
   - Her görseli yeni bir sohbette başlat. Böylece önceki denemeler karışmaz; tutarlılığı ekli referans görseli sağlar.
4. **Düzeltmeyi sohbet içinde yap:** kabul listesinde tutmayan bir madde varsa yeniden üretme. Görselin notundaki hazır düzeltme cümlelerinden birini aynı sohbette gönder.
5. **Kaydet:** seçtiğin dosyayı tam boyutta indir ve `projects/meridyen/renders/<dosya-adı>` olarak koy. PNG ya da JPG olabilir; WebP'ye çevirme işini ben yaparım.
6. **Boyutu kontrol et:**
   - Dosya istenen oranda değilse ya da uzun kenarı 2000 px'ten küçükse aynı prompt'u Google AI Studio'da (aistudio.google.com) dene. Orada en-boy oranı ve çözünürlük ayrı ayrı seçiliyor.
   - Köşede görünür bir Gemini simgesi varsa silmeye çalışma, bana söyle. Sitede bu görsellerin köşesinde zaten "Temsilidir / Illustrative" etiketi olacak.

### Referans cümlesi

Referans görseli ekleyerek üretilen her görselin en başına:

```text
Use the attached image only as a style reference: this is the same apartment, with the same oak floor, materials, colour palette, furniture style and quality of light. Do not copy its layout or camera view. Now create the following new image:
```

### Her düzeltmenin sonuna

```text
Keep everything else in the image exactly the same.
```

## Teknik ölçüler

| | İç mekân | Kule |
|---|---|---|
| En-boy oranı | 16:9 | 2:3 (dikey) |
| En küçük boyut | 2400 × 1350 | 1600 × 2400 |
| Kamera | göz hizası 1,5 m, 24 mm, dikeyler dik | uzaktan, 70 mm, dikeyler dik |
| Güvenli alan | önemli öğeler yatayda ortadaki %45'lik şeritte | kulenin tamamı, üstte ve altta pay bırakılmış |

**Güvenli alan:** telefonda görsel dikey ekrana kırpılır. 16:9'luk bir görselin telefonda görünen kısmı yalnızca ortadaki yaklaşık %45'tir. Pencere, yatak ve küvet gibi asıl öğeler bu şeridin içinde kalmalı.

**Yazı ve logo olmamalı:** bazı daireler planda aynalanmış durumda (A2 slot 3, penthouse slot 2). Site bu dairelerde görseli yatay çevirecek. Görselde yazı, logo, saat ya da tablo içinde okunur bir şey olursa ters görünür.

## Ortak stil bloğu

Her prompt'un başına aynen eklenecek:

```text
Photorealistic architectural visualisation, high-end residential tower on a generic Mediterranean coastline (no recognisable landmarks). Quiet luxury: calm, uncluttered, editorial. Palette: deep midnight blue accents, warm sand and beige, natural light oak, brushed brass details. Materials: wide-plank light oak floors, warm limestone or travertine, linen and boucle upholstery, matte plaster walls, slim black-bronze window frames, floor-to-ceiling glazing. Soft natural light, gentle shadows, realistic exposure, no HDR look. Straight verticals, two-point or one-point perspective, no fisheye.
```

Her prompt'un sonuna eklenecek kaçınılacaklar listesi (Gemini'de ayrı bir alan yok, prompt'un sonuna yazılır):

```text
Avoid: people, pets, text, letters, logos, signage, brand names, watermarks, clocks, readable artwork, clutter, plants overload, oversaturated colours, neon, distorted wide angle, curved verticals, impossible architecture, extra rooms visible through doors.
```

---

## 1 · Kule dış görünüş, akşam: `tower.webp`

**Veriden gelenler:**

- **Kat sayısı:** 32 konut katı. 1. kat lobi (çift yükseklik), 2. kat spor salonu.
- **Kat plakası:** 28 × 18 m. Kule ince ve yüksek: yaklaşık 28 m genişliğe karşı 105 m yükseklik.
- **Penthouse katları (30–32):** güneye doğru 6 m daha derin, büyük teraslı.
- **Konum:** deniz güneyde, şehir kuzeyde.

**Prompt:**

```text
Exterior view of a slender 32-storey residential tower at blue hour, seen from the sea side (south-west), standing alone on the waterfront with a calm sea in the foreground and low-rise city silhouette behind. Tower roughly 28 m wide and 105 m tall, rectangular, glass curtain wall with crisp horizontal floor slab bands — every floor clearly readable as a separate horizontal line. Double-height glazed lobby at ground level, top three floors step out towards the sea with deep terraces and glass balustrades. Warm interior light in scattered windows (about half lit), sky fading from deep midnight blue to a thin warm band on the horizon. Calm water with soft reflection of the tower. Camera far away with a long lens, tower centred, entire building visible with generous sky above and water below, vertical lines perfectly straight. Portrait 2:3.
```

**Gemini notu:**

- **Referans:** yok. Prompt'un sonuna "Vertical 2:3 portrait format, high resolution." ekle.
- **Hazır düzeltmeler:**

```text
Make every floor slab line sharper and evenly spaced, so each floor reads as a separate band.
Make the tower perfectly vertical, with no tapering towards the top.
Zoom out slightly so the whole tower fits, with more sky above and more water below.
Remove the logo or text on the building.
```

**Kabul listesi:**

- [ ] Kat çizgileri net ve düz. Kat sayısının tam 32 olması gerekmez; kalibrasyon aracı katları zaten yeniden hesaplayacak, ama çizgiler sayılabilir olmalı.
- [ ] Kule dik duruyor, perspektiften dolayı tepeye doğru daralmıyor.
- [ ] En üstteki teraslı katlar seçilebiliyor.
- [ ] Kulenin tamamı kadrajda, üstte ve altta pay var.

---

## 2 · A2 salon, gündüz: `a2-salon.webp`

A2, projenin en yaygın tipi (20 daire, 3–12. katlar). Salonu güneydeki denize bakıyor. Seti A2 üzerinden kurmak "sıradan daire bile böyle" mesajını verir.

**Veriden gelenler:**

- **Ölçü:** 7,5 m (doğu-batı) × 5,5 m (kuzey-güney), yaklaşık 41 m².
- **Pencereler:** güney duvarı tümüyle cam (deniz), batı duvarı cam (kıyı şeridi).
- **Kamera:** kuzeyde, güneye bakıyor. Bu yönde batı sağda kalır.
- **Arkada:** kameranın arkasında açık mutfak var, görünmeyecek.

**Prompt:**

```text
Interior of a sea-facing living room, about 7.5 m wide and 5.5 m deep, 2.9 m ceiling, on a mid-level floor of a residential tower. Camera at eye height 1.5 m standing at the back of the room looking straight at the far wall, one-point perspective. The entire far wall is floor-to-ceiling glass with slim frames, showing open calm sea and horizon at mid height of the frame. The right-hand wall is also glazed, showing a sliver of coastline. Low deep sofa in warm sand boucle facing the sea, midnight blue velvet lounge chair, light oak coffee table, wool rug, a slim brass floor lamp. Late morning soft sunlight entering from the right, gentle shadows on the oak floor. Sparse styling: a ceramic vase, one stack of books. 16:9.
```

**Gemini notu:**

- **Referans:** yok; bu, setin ilk görseli. Prompt'un sonuna "Horizontal 16:9 format, high resolution." ekle.
- **Hazır düzeltmeler:**

```text
Make the left-hand wall solid matte plaster, with no window.
Lower the camera to eye height so the horizon sits at the middle of the frame.
Remove the extra decor; keep only the sofa, lounge chair, coffee table, rug and floor lamp.
```

**Kabul listesi:**

- [ ] Deniz ileride, karşı duvarın tamamı cam.
- [ ] Sağ duvar camlı, sol duvar dolu.
- [ ] Yatay ufuk çizgisi kadrajın ortasına yakın. Bu, göz hizasında çekilmiş anlamına gelir.
- [ ] Kanepe ve deniz ortadaki %45'lik şeritte.

---

## 3 · A2 ebeveyn yatak odası, gündüz: `a2-ebeveyn.webp`

**Veriden gelenler:**

- **Ölçü:** 4 m (doğu-batı) × 3,5 m (kuzey-güney), yaklaşık 14 m².
- **Pencere:** yalnızca güney duvarında (deniz).
- **Komşu odalar:** sol duvarın arkasında ebeveyn banyosu, sağ duvarın arkasında salon var.
- **Kamera:** kuzeydeki kapıdan güneye bakıyor.

**Prompt:**

```text
Interior of a calm primary bedroom, about 4 m wide and 3.5 m deep, 2.9 m ceiling. Camera at eye height 1.5 m in the doorway looking straight at the far wall, one-point perspective. The far wall is floor-to-ceiling glass with sheer linen curtains half open, sea and horizon outside. Double bed with an upholstered headboard in warm sand linen placed against the left-hand wall, bed facing right, white and beige bedding with a midnight blue throw. Light oak bedside table with a small brass lamp. Right-hand wall plain matte plaster. Soft morning light, quiet and airy. 16:9.
```

**Gemini notu:**

- **Referans:** seçtiğin `a2-salon` görseli. Prompt'un sonuna "Horizontal 16:9 format, high resolution." ekle.
- **Hazır düzeltmeler:**

```text
Make the room smaller and more intimate, about 14 square metres.
Remove the windows from the side walls; only the far wall is glass.
Move the bed so its headboard is against the left-hand wall.
```

**Kabul listesi:**

- [ ] Cam yalnızca karşı duvarda, yan duvarlarda pencere yok.
- [ ] Oda küçük görünüyor ama ferah. Gerçekte 14 m², AI bunu büyütmeye meyilli; büyük bir süit gibi görünüyorsa reddet.
- [ ] Yatak ve pencere ortadaki şeritte.

---

## 4 · A2 ebeveyn banyosu, gündüz: `a2-ebeveyn-banyo.webp`

Denize bakan banyo, A2'nin en güçlü satış detaylarından biri.

**Veriden gelenler:**

- **Ölçü:** 2,5 m (doğu-batı) × 3,5 m (kuzey-güney), yaklaşık 9 m². Dar ve derin bir oda.
- **Pencere:** güney duvarında (deniz).
- **Kamera:** kuzeydeki kapıdan güneye bakıyor.

**Prompt:**

```text
Interior of a narrow en-suite bathroom, about 2.5 m wide and 3.5 m deep, 2.9 m ceiling. Camera at eye height 1.5 m in the doorway looking straight at the far wall, one-point perspective. Far wall: a large window with sea and horizon view. Under the window a freestanding stone bathtub. Left-hand wall: floating light oak vanity with a single stone basin, brushed brass tap, round mirror with soft backlight. Right-hand wall: walk-in shower behind a clear glass panel, brushed brass rain shower. Walls and floor in warm honed travertine. A folded linen towel. Soft daylight. 16:9.
```

**Gemini notu:**

- **Referans:** seçtiğin `a2-salon` görseli. Prompt'un sonuna "Horizontal 16:9 format, high resolution." ekle.
- **Hazır düzeltmeler:**

```text
Make the room narrower, so both side walls are clearly visible.
Change all taps and fittings to brushed brass.
Show the sea clearly through the window above the bathtub.
```

**Kabul listesi:**

- [ ] Oda dar: iki yan duvar kadraja giriyor.
- [ ] Pencerede deniz var.
- [ ] Musluk ve armatürler pirinç tonunda, krom değil.

---

## 5 · Penthouse salon, gün batımı: `ph-salon.webp`

**Veriden gelenler:**

- **Ölçü:** 8 m (doğu-batı) × 5,5 m (kuzey-güney), yaklaşık 44 m². Tavan 3,2 m.
- **Güney duvarı:** cam sürme kapılar, terasa açılıyor; terasın ötesinde deniz var.
- **Batı duvarı:** cam.
- **Kamera:** kuzeyde, güneye bakıyor. Batı ve dolayısıyla gün batımı sağda.
- **Teras:** 14 × 6 m, salonun önünde ve ondan daha geniş.

**Prompt:**

```text
Interior of a penthouse living room at sunset, about 8 m wide and 5.5 m deep, high 3.2 m ceiling, top floor of a seaside tower. Camera at eye height 1.5 m at the back of the room looking straight at the far wall, one-point perspective. The far wall is full-height sliding glass doors, partly open, leading onto a wide stone terrace with a frameless glass balustrade, and beyond it the open sea far below. The right-hand wall is also glazed. Low sun on the right side of the horizon, warm golden-amber light raking across the oak floor, long soft shadows, sky shading to deep blue at the top. Large low sofa in sand boucle, two midnight blue lounge chairs, travertine coffee table, brass pendant light. Feeling of height and openness. 16:9.
```

**Gemini notu:**

- **Referans:** seçtiğin `a2-salon` görseli. Referans cümlesinden sonra "This is the penthouse of the same building: same design language, but at sunset and with a higher ceiling." ekle. Prompt'un sonuna "Horizontal 16:9 format, high resolution." ekle.
- **Hazır düzeltmeler:**

```text
Show a wide stone terrace with a glass balustrade between the glass doors and the sea.
Move the low sun to the right side of the horizon.
Make the ceiling noticeably higher.
```

**Kabul listesi:**

- [ ] Salon ile deniz arasında teras görünüyor. Bu, yüksek katta olunduğunu hissettirir.
- [ ] Güneş sağda batıyor.
- [ ] Tavan A2 salonundan belirgin şekilde yüksek.

---

## 6 · Penthouse teras, gün batımı: `ph-teras.webp`

**Veriden gelenler:**

- **Ölçü:** 14 m (doğu-batı) × 6 m (kuzey-güney), 84 m².
- **Konum:** dairenin güneyinde, deniz cephesi boyunca uzanıyor.
- **Kamera:** salon kapısının önünde, güneye bakıyor. Gün batımı sağda.

**Prompt:**

```text
A wide penthouse terrace at sunset, about 14 m long and 6 m deep, on the top floor of a seaside tower. Camera at eye height 1.5 m standing just outside the living room doors looking straight out to sea, one-point perspective. Large-format warm limestone paving, frameless glass balustrade along the edge, open sea far below and a clear horizon. Low sun on the right, warm amber light, long shadows, sky gradient to midnight blue above. Left side: outdoor dining table in light teak with six chairs. Right side: two loungers with sand cushions and a low planter with olive tree and grasses. Calm, expansive, private. 16:9.
```

**Gemini notu:**

- **Referans:** seçtiğin `ph-salon` görseli. Prompt'un sonuna "Horizontal 16:9 format, high resolution." ekle.
- **Hazır düzeltmeler:**

```text
Remove the pool and hot tub; keep plain stone paving.
Widen the view so both ends of the terrace are almost visible.
Make the balustrade frameless clear glass so the horizon is uninterrupted.
```

**Kabul listesi:**

- [ ] Havuz ya da jakuzi yok. Bunlar projede yok; görselde olurlarsa yanlış vaat olur. İnce bir pergola olabilir; mevcut çizimde de var.
- [ ] Korkuluk camdan, ufuk kesintisiz.
- [ ] Terasın genişliği okunuyor: sağ ve sol uçları kadraja yakın.

---

## Yedek görseller (zaman kalırsa)

### 7 · A2 mutfak, gündüz: `a2-mutfak.webp`

**Veriden gelenler:**

- **Ölçü:** 6 m × 2,5 m.
- **Pencere:** yok; mutfak salona açık.
- **Kamera:** mutfağın içinde, salona ve onun ötesindeki denize bakıyor.

```text
Interior of an open kitchen, about 6 m wide and 2.5 m deep, open to a sea-facing living room. Camera at eye height 1.5 m at the back of the kitchen looking towards the living room, one-point perspective. In the foreground a light oak kitchen island with a honed travertine top and two brass-legged stools; flat-front cabinetry in midnight blue matte lacquer along the side walls, integrated appliances, brushed brass handles. Beyond, the living room and a full glass wall with calm sea view. Soft daylight. 16:9.
```

**Kabul:** mutfakta pencere yok; deniz yalnızca salonun camından görünüyor.

**Gemini notu:**

- **Referans:** seçtiğin `a2-salon` görseli. Arka plandaki salon bu görselle aynı olmalı.
- **Hazır düzeltmeler:**

```text
Remove the kitchen window; daylight comes only from the living room glass beyond.
```

### 8 · A2 yatak odası 2, gündüz: `a2-yatak-2.webp`

**Veriden gelenler:**

- **Ölçü:** 4 m (doğu-batı) × 5 m (kuzey-güney).
- **Pencereler:** kuzey ve batı (şehir).
- **Kamera:** güneydeki kapıdan kuzeye bakıyor. Bu yönde batı solda kalır.

```text
Interior of a second bedroom, about 4 m wide and 5 m deep, 2.9 m ceiling. Camera at eye height 1.5 m in the doorway looking straight at the far wall, one-point perspective. Far wall floor-to-ceiling glass showing a calm low-rise city view, the left-hand wall also glazed. Double bed in warm beige linen against the right-hand wall, light oak desk under the far window with a brass desk lamp, sheer curtains. Soft indirect daylight. 16:9.
```

**Kabul:** pencerede deniz değil şehir var, cam karşıda ve solda.

**Gemini notu:**

- **Referans:** seçtiğin `a2-ebeveyn` görseli.
- **Hazır düzeltmeler:**

```text
Replace the sea view with a calm low-rise city view.
```

---

## Ben ne yapacağım (görseller gelirken)

- **Render alanı:** odalara ve kuleye `"render"` alanı eklenecek, mevcut `"visual": "svg:…"` yedek olarak kalacak.
- **Çizim / Render düğmesi:** üst çubukta yer alacak, durumu `state.js`'de tutulacak.
- **"Temsilidir" etiketi:** iki dilli olacak.
- **Kalibrasyon aracı:** kule render'ı üzerindeki kat tıklama alanları için `tools/calibrate.html`.
- **Aynalı daireler:** görsel yatay çevrilerek gösterilecek.
- **Yer tutucu test:** görseller gelmeden kodu geçici görsellerle 375 ve 1440 px'te, TR ve EN'de test edeceğim.
