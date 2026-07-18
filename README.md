# Golf Voice Scorecard AI TEST

**Development Repository**  
**Current version:** `v3.8.0-dev`  
**Build:** `Build 1 – TEST-ilme ja perusrakenne`  
**Status:** 🟡 Sohvatestaus

Tämä repository on tarkoitettu uusien ominaisuuksien kehittämiseen ja testaamiseen ennen niiden siirtämistä LIVE-versioon.

## Nykyinen testivaihe

Ensimmäisen paketin tavoitteena on varmistaa, että TEST-versio:

- käynnistyy oikein GitHub Pagesissa
- asentuu iPhonen Koti-valikkoon omalla TEST-kuvakkeellaan
- erottuu varmasti LIVE-versiosta
- säilyttää nykyisen tuloskortin ja puhekirjauksen toiminnan

## v3.8.0-dev – Build 1

Lisätty:

- lopullinen punaisella TEST-leimalla varustettu sovelluskuvake
- otsikkoon punainen `TEST`-merkintä
- oikeaan ylänurkkaan punainen `TEST / v3.8.0-dev`
- puhekirjauspainikkeeseen punainen TEST-leima
- tuloskorttiin hyvin himmeä vino TEST-vesileima
- TEST-version nimi ja kuvakkeet manifestiin
- omat välimuistiversiot CSS- ja JavaScript-tiedostoille

Toiminnallinen pohja perustuu vakaaseen v3.7.2-versioon. Tässä Build 1:ssä ei vielä ole kenttätietokantaa eikä tiin valintaa.

## Seuraava vaihe – Build 2

- FIN-1.0-kenttätietokanta
- kentän haku nimellä
- kentän valinta
- tiin valinta
- par-, HCP- ja väyläpituuksien lataaminen tuloskorttiin

GPS, suosikit, viimeksi pelatut ja omat kentät jätetään myöhempiin vaiheisiin.

## Asennus testirepoon

1. Pura ZIP-paketti.
2. Lataa kaikki paketin tiedostot ja `icons`-kansio repositoryn juureen.
3. Ota GitHub Pages käyttöön kohdasta **Settings → Pages**.
4. Valitse julkaisu lähteestä **Deploy from a branch**, haara **main** ja kansio **/(root)**.
5. Avaa Pages-osoite iPhonen Safarissa ja lisää sovellus Koti-valikkoon.

## Kehitysloki

README toimii samalla projektin etenemislokina. Jokaisen uuden testiversion muutokset ja seuraava suunniteltu vaihe lisätään tähän tiedostoon.

---

© 2026 Petri Suokas
