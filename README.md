# Golf Voice Scorecard AI – v0.2.2

Korjauspaketti iPhone-testeissä havaittuihin ongelmiin.

## Korjattu

- Tuloskortti skaalautuu iPhonen leveyteen ilman vaakavieritystä.
- Reikä- ja Par-sarakkeet pysyvät näkyvissä.
- Par-, birdie- ja bogi-sanoille lisättiin puheentunnistuksen vaihtoehtoja ja kevyt kirjoitusasujen vertailu.
- Pelkkä bogi ei enää muutu tuplabogiksi alemman luottamuksen puhevaihtoehdon perusteella.
- Tuplabogi vaatii puheessa selvän tupla- tai double-sanan.
- Koko reikä voidaan kirjata yhdellä puheella:
  - `Petri par, Kimmo bogi`
  - `par ja bogi`
- Yhden tuloksen komento toimii edelleen ja kohdistuu seuraavalle tyhjälle pelaajalle.
- Puheääni alustetaan mikrofonipainikkeen käyttäjäeleestä, mikä parantaa toimintaa iPhonessa.
- Kuvakkeita ei ole paketissa; koodi käyttää nykyistä `icons/`-hakemistoa.

## GitHub

Korvaa ZIP:n tiedostoilla repon juuressa olevat samannimiset tiedostot.

Commit:

`v0.2.2 – Fix mobile scorecard and multi-player voice scoring`

Avaa deploymentin jälkeen:

`https://petris66.github.io/test_tuloskortti_test/?v=0.2.2`
