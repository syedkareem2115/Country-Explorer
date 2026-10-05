
const COUNTRY_DATA_URL = "https://raw.githubusercontent.com/mledoze/countries/master/dist/countries.json";
const POPULATION_DATA_URL = "https://raw.githubusercontent.com/samayo/country-json/master/src/country-by-population.json";

function normalizeCountryName(value) {
    return String(value || "").trim().toLowerCase();
}

function findCountry(data, query) {
    const normalizedQuery = normalizeCountryName(query);

    return data.find(country => {
        const countryName = country.name || {};
        const commonName = normalizeCountryName(countryName.common);
        const officialName = normalizeCountryName(countryName.official);
        const altSpellings = (country.altSpellings || []).map(value => normalizeCountryName(value));

        return commonName === normalizedQuery
            || officialName === normalizedQuery
            || altSpellings.includes(normalizedQuery);
    }) || null;
}

function findPopulation(data, query) {
    const normalizedQuery = normalizeCountryName(query);

    const match = data.find(item => {
        const candidateNames = [
            item.country,
            item.name,
            item.Country,
            item.countryName,
            item.country_name
        ];

        return candidateNames.some(name => normalizeCountryName(name) === normalizedQuery);
    });

    return match && Number.isFinite(Number(match.population))
        ? Number(match.population)
        : null;
}

function searchCountry() {
    const input = document.getElementById("countryInput");
    const result = document.getElementById("result");
    const country = input.value.trim();

    if (!country) {
        result.innerHTML = "<p class='error'>Please enter a country name.</p>";
        return;
    }

    Promise.all([
        fetch(COUNTRY_DATA_URL).then(response => {
            if (!response.ok) {
                throw new Error("Unable to load country data");
            }
            return response.json();
        }),
        fetch(POPULATION_DATA_URL).then(response => {
            if (!response.ok) {
                throw new Error("Unable to load population data");
            }
            return response.json();
        })
    ])
        .then(([countryDataList, populationData]) => {
            const countryData = findCountry(countryDataList, country);

            if (!countryData) {
                throw new Error("Country not found");
            }

            const name = countryData.name?.common || "N/A";
            const capital = countryData.capital && countryData.capital.length
                ? countryData.capital[0]
                : "N/A";
            const population = findPopulation(populationData, name) ?? "N/A";
            const formattedPopulation = typeof population === "number"
                ? population.toLocaleString()
                : population;
            const region = countryData.region || "N/A";
            const flag = countryData.flags?.png || countryData.flags?.svg || "";

            let currency = "N/A";
            if (countryData.currencies) {
                const currencyCode = Object.keys(countryData.currencies)[0];
                currency = countryData.currencies[currencyCode]?.name || "N/A";
            }

            let languages = "N/A";
            if (countryData.languages) {
                languages = Object.values(countryData.languages).join(", ");
            }

            result.innerHTML = `
                <div class="card">
                    <h2>${name}</h2>
                    ${flag ? `<img src="${flag}" alt="${name} flag">` : ""}
                    <div class="info">
                        <p><b>Capital:</b> ${capital}</p>
                        <p><b>Population:</b> ${formattedPopulation}</p>
                        <p><b>Region:</b> ${region}</p>
                        <p><b>Currency:</b> ${currency}</p>
                        <p><b>Languages:</b> ${languages}</p>
                    </div>
                </div>
            `;
        })
        .catch(() => {
            result.innerHTML = "<p class='error'>Country not found!</p>";
        });
}

