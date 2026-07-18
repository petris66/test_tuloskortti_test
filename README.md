# Golf Voice Scorecard AI TEST

Puheohjattavan golf-tuloskortin erillinen kehitys- ja testausympäristö.

## Nykyinen versio
- Version: `3.8.0-dev`
- Build: `01`
- Status: `Development`
- Release: `2026-07-18`

## Build 01 sisältää
- TEST-brändäyksen
- mobiiliystävällisen käyttöliittymärungon
- 18 reiän tuloskortin esikatselun
- PWA-manifestin
- service workerin
- README-, CHANGELOG- ja VERSION-tiedostot

Build 01 ei vielä sisällä kenttätietokantaa, kenttähakua, tiin valintaa, toimivaa tuloskorttia, puheohjausta eikä GPS:ää.

## Asennus TEST-repositoryyn
1. Pura ZIP.
2. Korvaa TEST-repositoryn nykyiset tiedostot paketin tiedostoilla.
3. Poista vanhat `test.txt`-dummy-tiedostot.
4. Commitoi esimerkiksi viestillä `Add v3.8.0-dev Build 01`.
5. Ota GitHub Pages käyttöön vasta, kun tiedostot näkyvät oikein.

## Kehitysmalli
Jokainen julkaisu tehdään uutena muuttumattomana ZIP-buildina. Vanhaa buildia ei korvata, vaan korjaukset julkaistaan seuraavana buildina.

## Roadmap
- [x] Build 01: perusrakenne ja TEST-käyttöliittymä
- [ ] FIN-1.0-kenttätietokanta
- [ ] kenttähaku
- [ ] tiin valinta
- [ ] par-, HCP- ja pituustiedot
- [ ] toimiva tuloskortti
- [ ] puheohjaus
- [ ] GPS
- [ ] suosikit ja viimeksi käytetyt kentät
- [ ] omat kentät
- [ ] pilvisynkronointi
- [ ] tilastot

## Tunnetut puutteet
- Kentän ja tiin valinnat eivät vielä toimi.
- Kierrosta ei voi aloittaa.
- Tuloskortti on vain esikatselu.
- Puhepainike näyttää vain ilmoituksen.
- Lopulliset PNG-PWA-kuvakkeet puuttuvat.

## Seuraava build
Build 02:n tavoite on FIN-1.0-kenttätietokannan pohja ja kenttähaun ensimmäinen versio.
