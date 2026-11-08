# Mawar The Explorer: Chronicles of Ilm

Sebuah web-game pendidikan Islam berasaskan RPG dibina menggunakan HTML5, Tailwind CSS, dan Vanilla JavaScript. 

## Ciri-ciri
- 📱 **Mobile-First**: Direka khas untuk lancar di telefon pintar (TrebEdit/GitHub Pages).
- 🎮 **Pelbagai Mod**: Campaign, Survival, Time Attack, dan Boss Battle.
- 💾 **Sistem Simpanan**: Menggunakan `localStorage` tanpa perlu backend (Pemain tidak hilang progress).
- 📚 **Data Berskala (JSON)**: Skrip secara automatik membaca fail `data/questions.json`. Anda boleh memuatkan ribuan soalan di sini.

## Cara Deploy di GitHub (GitHub Pages)

1. Buat **Repository Baharu** di akaun GitHub anda (cth: `mawar-game`).
2. Muat naik ke semua folder & fail (`index.html`, `assets/`, `data/`) ke dalam repository tersebut.
3. Pergi ke tab **Settings** di repository GitHub anda.
4. Di panel kiri, klik **Pages**.
5. Di bawah bahagian "Build and deployment", tukar 'Source' kepada **Deploy from a branch**.
6. Pilih branch `main` atau `master`, kemudian klik **Save**.
7. Tunggu sekitar 1-2 minit. GitHub akan memberikan anda satu link (URL) rasmi.
8. Buka link tersebut di pelayar (browser) telefon pintar anda dan main!

## Kemas kini Soalan
Untuk menambah soalan, hanya buka fail `data/questions.json` dan tambah susunan maklumat soalan baharu ke dalam array. Tiada baris kod permainan yang perlu anda usik!
