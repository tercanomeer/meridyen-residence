# Meridyen Rezidans — interaktif satış sitesi

## Amaç

Yeni konut projeleri için interaktif satış sitesi motoru.
Müşteri kuleden kat seçer, kattaki 2-4 daireden birini seçer, izometrik daire planını görür, odaların içini gezer, randevu ister.
İlk proje: Meridyen Rezidans (demo). Motor projeden bağımsızdır; yeni proje = projects/<id>/ klasörü.

## Teknoloji

- Düz HTML + CSS + JavaScript (ES modülleri). Framework yok, build adımı yok.
- Animasyon: GSAP, CDN'den sabit sürümle yüklenir.
- Tıklama alanları ve geçici görseller: SVG.
- Yerel önizleme: statik sunucu (python3 -m http.server veya npx serve). file:// ile açma.

## Mimari kurallar

- src/ içinde projeye özel metin, fiyat, renk veya koordinat olmaz. Hepsi projects/<id>/ veya i18n/ içinden okunur.
- Proje tanımı projects/<id>/project.json, satış verisi projects/<id>/units.json.
- Veri erişimi yalnızca src/data/load-units.js üzerinden (kaynak: json | sheets | supabase).
- Form gönderimi yalnızca src/data/submit-lead.js üzerinden (demo modu: teşekkür mesajı).
- Görsel slotları: "svg:<ad>" → src/visuals üreticisi; dosya yolu → <img>. Her ekran ikisini de desteklemeli.
- Tıklama alanı koordinatları 0–1 aralığında oransal.
- Ekran durumu tek yerde: src/state.js. Hash yönlendirme: #kat-19, #kat-19/19-2/salon.
- Site iki dilli (TR ve EN). Arayüz metinleri i18n/tr.json ve i18n/en.json'dan gelir; kodda sabit metin yazma.
- Proje metinleri (label, features) project.json'da { "tr": "…", "en": "…" } nesnesi olarak durur.
- Dil seçimi: sağ üstte TR/EN düğmesi. İlk açılışta tarayıcı diline göre seçilir, sonra localStorage'da hatırlanır (try/catch ile). <html lang> değeri de güncellenir.
- Kod ve değişken adları İngilizce, kullanıcıya görünen metin seçili dilde.
- Rastgelelik sabit tohumla (seed): görseller her açılışta aynı görünmeli.

## Deneyim kuralları

- Mobil öncelikli. Dokunmatikte ilk dokunuş etiketi açar, etiketteki "İncele" butonu içeri girer.
- Bilgi paneli masaüstünde sağda, mobilde alttan açılan kart.
- Klavye ile gezilebilir (Tab, Enter, Esc = geri), görünür odak halkası.
- prefers-reduced-motion açıksa geçişler sade bir solma olur.
- Satılan daireler görünür ama soluk; planı açılabilir, randevu butonu yerine "Benzer daireleri göster" çıkar.

## Tasarım

- Gece mavisi zemin, sıcak altın vurgu, serif başlık (Cormorant Garamond), sade gövde yazısı (Manrope).
- Lüks, sakin, az metin. Fiyatlar USD, binlik ayraçlı ($890.000). Sağ üstte USD/TL düğmesi: TL'de ₺ ile ve binlik ayraçla gösterilir.
- Para birimi: fiyatlar units.json'da USD; TL karşılığı project.json'daki currency.rates kuruyla src/currency.js'de hesaplanır. Fiyat gösteren her yer bu modülü kullanır. Seçim localStorage'da hatırlanır (try/catch ile).
- Görsel tarz: mimari illüstrasyon, sınırlı palet (gece mavisi, sıcak bej, ahşap, altın).

## Çalışma düzeni

- Her fazı önce planla, onay al, sonra yaz.
- Faz sonunda: sunucuyu başlat, ne değiştiğini kısaca özetle, kullanıcı onaylayınca git commit at.
- Büyük dosya yazma; her modül tek bir iş yapsın.
