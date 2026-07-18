# Golf Voice Scorecard AI – Test Build-02

Korvaava Build-02-paketti. ZIP-tiedoston sisältö purkautuu suoraan tiedostoiksi ilman ylimääräistä pääkansiota.

## Tiedostot

- `index.html` – käyttöliittymän rakenne
- `style.css` – ulkoasu ja mobiilinäkymä
- `app.js` – tuloskortin, puheen ja tallennuksen toiminnallisuus
- `manifest.webmanifest` – verkkosovelluksen perustiedot
- `CHANGELOG.md` – version muutokset

## Testaaminen

1. Pura ZIP tyhjään kansioon.
2. Avaa `index.html` selaimessa.
3. Painikkeet ja tuloskortti toimivat myös paikallisesti.
4. Mikrofonilla tehtävä puheentunnistus toimii varmimmin Chrome- tai Edge-selaimessa HTTPS-osoitteessa, esimerkiksi GitHub Pagesissa tai Vercelissä.

## Build-02:n ominaisuudet

- Birdie, par, bogi, tupla, triple ja eagle muunnetaan reiän parin perusteella lyöntimääräksi.
- Puhekieliset numerot, kuten nelonen, vitonen ja seiska.
- Pelaajan nimi voidaan sanoa tuloksen yhteydessä.
- “Minulle bogi” kohdistuu ensimmäiseen pelaajaan.
- “Korjaa Petrille neljä”.
- “Peru” ja “poista viimeinen”.
- Automaattinen siirtyminen seuraavalle reiälle, kun kaikkien pelaajien tulokset on kirjattu.
- Reiän parin valinta.
- Puhutut vahvistukset.
- Kierroksen säilytys selaimen localStoragessa.
- Build-02 käyttää omaa tallennusavainta eikä sotke aikaisemman version tietoja.

## Rajaukset

GPS, Garmin-yhteys ja OpenAI API eivät vielä kuulu tähän Build-02-versioon.
