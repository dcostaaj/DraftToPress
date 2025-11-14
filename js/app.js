let articles = []; // define globally so all functions can use it

async function loadCSV() {
    const response = await fetch(`articles.csv?nocache=${Date.now()}`);
    const csvText = await response.text();

    const rows = csvText.trim().split("\n");
    const headers = rows.shift().split(",").map(h => h.trim());

    console.log("CSV Headers:", headers);

    const parsed = [];

    rows.forEach((row, rowIndex) => {
        const values = row.split(",");

        if (values.length !== headers.length) {
            console.warn(
                `⚠️ CSV row ${rowIndex + 2} has ${values.length} columns but expected ${headers.length}:`,
                row
            );
        }

        const entry = {};
        headers.forEach((header, i) => {
            entry[header] = (values[i] ?? "").trim();
        });

        parsed.push(entry);
    });

    return parsed;
}


async function sortedArticles() {
    const articles = await loadCSV();

    const sortedArticles = [];

    for (const article of articles) {
        const articleID = article["Article ID"];

        try {
            const response = await fetch(`https://abacus.jasoncameron.dev/get/critiquecorner/${articleID}`);
            const data = await response.json();
            const hits = data.value ?? data.hits ?? data ?? 0;
            sortedArticles.push({ ...article, hits });
        } catch (err) {
            console.error("Error fetching hits for", articleID, err);
            sortedArticles.push({ ...article, hits: 0 });
        }
    }

    sortedArticles.sort((a, b) => b.hits - a.hits);
    return sortedArticles;
}

const searchBox = document.getElementById("searchBox");
const resultsDiv = document.getElementById("results");

function displayResults(filtered) {
    resultsDiv.innerHTML = ""; // clear previous results
    console.log("display");
    if (filtered.length === 0) {
        resultsDiv.innerHTML = "<p>No articles found.</p>";
        return;
    }

    filtered.forEach(article => {
        const div = document.createElement("div");
        div.className = "searcharticle";
        div.innerHTML = `
    <a href="${article["Article URL"]}">
      <h2>${article["Article Title"]}</h2>
      
        <img src="${article["Article Image URL"]}" alt="${article["Article Title"]}">
      </a>
      
    `;
        resultsDiv.appendChild(div);
    });
}

function searchArticles() {
    console.log("search");
    const query = searchBox.value.toLowerCase();
    const filtered = articles.filter(article => {
        const title = article["Article Title"]?.toLowerCase() || "";
        const author = article["author"]?.toLowerCase() || "";
        return title.includes(query) || author.includes(query);
    });
    displayResults(filtered);
}

// 👇 Load everything first
(async () => {
    articles = await sortedArticles(); // wait for CSV + hits
    displayResults(articles); // now show them
    searchBox.addEventListener("input", searchArticles); // enable searching
})();
