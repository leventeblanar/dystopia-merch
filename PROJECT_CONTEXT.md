# Dystopia Merch - Current Project Context

Az oldal egy React + Vite alapú egyoldalas zenekari landing page a Dystopia számára. A teljes fő UI jelenleg a `src/App.jsx` és a `src/App.css` fájlokban él. A vizuális irány sötét, koncertes, metal hangulatú: fekete és sötétszürke alapok, vörös kiemelések, nagy tipográfia, drámai háttérképek, blurös és filmes átmenetek.

Ezt a leírást úgy írtam meg, hogy közvetlenül be lehessen másolni egy másik AI chatbe, ha itt elfogyna a token.

## Technikai alapok

- Framework: React 19 + Vite
- Fő fájlok:
  - `src/App.jsx`: teljes oldal markupja és az interaktív logika
  - `src/App.css`: teljes vizuális megjelenés és responsive viselkedés
  - `src/index.css`: globális alapok, pl. smooth scroll
- Az oldal jelenleg nem több aloldalas, hanem egy single-page scrollozható landing page anchor navigációval.

## Jelenlegi fő viselkedés

- Betöltéskor van egy intro / splash screen:
  - középen a Dystopia logó jelenik meg
  - van egy enyhe glitch / flicker animáció
  - kb. 4 másodperc után átúszik a főoldalba
- A főoldalon a hero háttér három háttérkép között vált automatikusan
  - ezek a `src/assets/dystopia_background_1.jpg`, `2.jpg`, `3.jpg`
  - a háttérváltás lassú, sejtelmes, blurös
  - az irány randomizált a rendelkezésre álló négy irányból
- A fejléc fixen a tetején van
  - desktopon automatikusan eltűnik, amikor lejjebb görgetsz
  - desktopon újra előjön, ha az egér a felső sáv közelébe kerül
  - mobilon ez az auto-hide nincs erőltetve, ott a header stabilan látszik
- A logóra kattintva a rendszer a valódi top anchorhoz ugrik vissza

## Jelenlegi szekciósorrend

Az oldal jelenlegi sorrendje felülről lefelé:

1. Hero / főképernyő
2. Bio
3. Zene
4. Kapcsolat

A menüben is ez a sorrend van:

1. Merch
2. Bio
3. Zene
4. Kapcsolat

Megjegyzés: a `Merch` menüpont jelenleg linkként jelen van, de külön teljes merch szekció még nincs kidolgozva a mostani App struktúrában.

## Hero szekció

- A hero teljes képernyős.
- Van rajta:
  - `Official website` felirat
  - a Dystopia wordmark / névlogó kép
  - `Metal from Hungary` alcím
  - `Merch megtekintése` gomb
- A háttér mozgó, sötétített és blurös slider.
- A hero alján desktopon van egy scroll indicator, mobilon ez el van rejtve.

## Bio szekció

- A Bio vizuálisan nagy, kétoszlopos desktop layout.
- Bal oldalon:
  - `A zenekarról` felirat
  - nagy `Bio` cím
  - vörös elválasztóvonal
  - egy nagy zenekari fotó (`src/assets/DYSTOPIA_group_foto.jpg`)
- A fotó kezelése:
  - a kép mögött ugyanaz a fotó blurös háttérként is megjelenik
  - hoverre a kép enyhén élénkebb és picit nagyobb lesz
  - a kilógási hibát korábban javítottuk `overflow: hidden`-nel
- Jobb oldalon van a teljes bio szöveg.
- Mobilon a Bio egyoszloposra törik.

## Zene szekció

- A Zene szekció jelenleg a Bio alatt van.
- A Zene rész célja: YouTube videók listázása és lejátszása.
- Desktopon két fő blokkra oszlik:
  - bal oldalon a lejátszó és a szöveges blokk
  - jobb oldalon egy görgethető videólista thumbnail preview elemekkel
- A videólista működése:
  - minden videóhoz van YouTube ID
  - a listaelemek egy preview képet és rövid meta szöveget mutatnak
  - kattintásra a fő player a kiválasztott videót tölti be
- A player `youtube-nocookie.com` embedet használ.
- A jelenlegi videók:
  - `8DCXT9bigSg` -> Dystopia - Nem látszik már
  - `wYSw1rSn5e4` -> Dystopia - Mesterlövész
  - `PtwgwD97YQk` -> Dystopia - Utolsó repülés
  - `ZsMix35YvQo` -> Dystopia - Amivel magadnak tartozol
- A videóadatok a `src/App.jsx` elején a `musicVideos` tömbben vannak.
- Mobilon:
  - a Zene szekció egy oszlopra törik
  - a lista már nem fix magasságú külön scrollbox, hanem természetesen egymás alá folyik
  - a preview elemek kisebbek
- A Zene szekció felső spacingje direkt csökkentve lett, hogy menüből odagörgetve ne maradjon nagy üres sáv a szekció tetején.

## Kapcsolat szekció

- A Kapcsolat szekció jelenleg a Zene alatt van.
- Eltérő háttérrel rendelkezik, mint a Bio:
  - sötét, enyhén hidegebb / iparibb tónus
  - finom vörös és szürkés gradient / radial fények
- Desktopon a layout két fő oszlop:
  - bal oldalon a Kapcsolat cím, rövid bevezető és social ikonok
  - jobb oldalon a kapcsolat információs kártyák
- A jelenlegi szöveges elemek:
  - nagy `Kapcsolat` cím
  - rövid placeholder bevezető szöveg
  - `Koncertszervezés` kártya
  - `Rövid üzenet` kártya
- A contact rész mobilon külön lett finomítva:
  - szűkebb paddingek
  - kisebb tipográfia
  - az elemek függőleges flow-ba törnek
  - `overflow-wrap` és `min-width: 0` beállításokkal lett megelőzve a kifutás

## Social / platform ikonok a Kapcsolat részben

- A Kapcsolat blokk bal oldalán van egy külön social rész.
- Címsora:
  - `Megtalálsz minket itt is:`
- Jelenleg ezek az ikonok vannak benne:
  - Spotify
  - Deezer
  - Apple Music
  - YouTube
  - Facebook
  - Instagram
  - Bandcamp
- Az ikonok:
  - kattinthatók
  - új tabon nyílnak
  - nagyobb, platformszínű, badge-szerű megjelenésük van
- A linkek egy központi tömbben vannak a `src/App.jsx` fájl elején, `socialLinks` néven.

Jelenlegi social linkek:

- Spotify: `https://open.spotify.com/artist/3am22hyFJavCKrKrwL8zis`
- Deezer: `https://www.deezer.com/en/artist/12939023`
- Apple Music: `https://music.apple.com/`
- YouTube: `https://www.youtube.com/@dystopiahungary`
- Facebook: `https://www.facebook.com/dystopiahungary/?locale=hu_HU`
- Instagram: `https://www.instagram.com/dystopia_hungary/`
- Bandcamp: `https://dystopiahungary.bandcamp.com/album/mesterl-v-sz`

## Navigáció és scroll viselkedés

- A menü anchor linkeket használ.
- A top logó külön `#top` anchorra ugrik.
- A Bio, Zene és Kapcsolat részek scroll viselkedése többször finomítva lett, hogy a fix header ne takarjon ki fontos tartalmat.
- Mobilon külön `scroll-margin-top` értékek vannak, hogy a fix fejléc mellett is jó pozícióra érkezzen a görgetés.
- A Zene résznél a felső whitespace direkt csökkentve lett, hogy odagörgetve már a player környéke látszódjon.

## Mobil viselkedés

- Mobilon a header fix marad.
- Mobilon a desktopos “elrejtőzik és csak hoverre előjön” logika ki van kapcsolva.
- A hamburger menü fullscreen overlayként nyílik meg.
- A hero spacingje safe-area kompatibilisen van kezelve.
- A Bio, Zene és Kapcsolat szekció mind kapott külön mobil breakpointos finomítást.

## Jelenlegi fontos state-ek az App-ben

- `phase`
  - kezeli az intro -> leaving -> main átmenetet
- `menuOpen`
  - kezeli a mobil menü nyitott állapotát
- `backgroundIndex`
  - az aktuális háttérképet vezérli
- `backgroundDirection`
  - az aktuális háttérmozgás irányát vezérli
- `headerVisible`
  - a desktop header láthatóságát kezeli
- `activeVideoId`
  - a Zene szekció aktív YouTube videóját tárolja

## Jelenlegi fontos adatforrások az App elején

- `backgroundImages`
  - a hero háttérképek
- `musicVideos`
  - a Zene szekció YouTube videóinak listája
- `socialLinks`
  - a Kapcsolat szekció platformlinkjeinek listája

## Amit egy következő AI-nak érdemes tudnia

- A projekt erősen egyedi landing page, nem sablonos corporate layout.
- A vizuális irány szándékosan sötét, metalos, filmes, enyhén drámai.
- A felhasználó nem szereti a steril, generic UI-t.
- A magyar szövegek és az ékezetek fontosak, az oldal magyar nyelvű.
- A Zene szekció már működik YouTube playerrel és preview listával.
- A Bio a Zene előtt van, ezt most így preferáljuk.
- A Kapcsolat részben a színes platformikonok már bent vannak.
- A mobil layoutokra több célzott finomítás történt, ezért új változtatásnál érdemes mindig a desktop és mobil breakpointokat együtt nézni.

## Ha valaki ezt a projektet tovább viszi

Ha ebből a fájlból indul egy másik AI, akkor a legfontosabb munkapontok valószínűleg ezek lehetnek:

1. Valódi merch szekció kialakítása vagy a `Merch` anchor végleges bekötése.
2. A Zene szekció tartalmi finomítása:
   - több videó
   - valódi leírások
   - esetleg Spotify / album / release blokk
3. A Kapcsolat placeholder szövegek véglegesítése.
4. Az Apple Music link végleges cseréje, ha lesz konkrét artist URL.
5. Böngészős vizuális ellenőrzés desktop és mobil nézetekben.

## Rövid prompt-változat másik AI-hoz

Ha csak röviden akarod továbbadni:

Ez egy React + Vite alapú Dystopia zenekari landing page. Van intro animáció logóval, utána teljes képernyős hero mozgó háttérrel. A fix header desktopon auto-hide + top-hover reveal, mobilon stabilan látszik hamburger menüvel. A szekciók sorrendje: Hero, Bio, Zene, Kapcsolat. A Bio nagy zenekari fotós és hosszú szöveges blokk. A Zene rész működő YouTube embed + preview-lista jobb oldalon, mobilon egyoszlopos. A Kapcsolat részben két kártya van és bal oldalon platformszínes social ikonok. A legtöbb logika a `src/App.jsx`-ben, a teljes design a `src/App.css`-ben van.
