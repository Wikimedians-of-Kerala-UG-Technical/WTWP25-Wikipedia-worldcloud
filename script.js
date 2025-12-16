function searchWiki() {
    const query = document.getElementById("searchInput").value.trim();
    if (!query) return;

    const searchApiUrl =
        "https://en.wikipedia.org/w/api.php" +
        "?action=query" +
        "&format=json" +
        "&list=search" +
        "&srlimit=5" +
        "&srsearch=" + encodeURIComponent(query) +
        "&origin=*";

    fetch(searchApiUrl)
        .then(res => res.json())
        .then(data => {
            const ul = document.getElementById("results");
            ul.innerHTML = "";

            if (data.query.search.length === 0) {
                alert("No results found. Please try another topic.");
                return;
            }

            document.getElementById("contentWrapper").style.display = "block";

            data.query.search.forEach(item => {
                const li = document.createElement("li");
                const a = document.createElement("a");

                a.textContent = item.title;
                a.href = "#"; // Make it look like a link
                
                li.appendChild(a);
                li.onclick = (e) => {
                    e.preventDefault();
                    showPageData(item.title);
                };
                ul.appendChild(li);
            });
        })
        .catch(error => {
            console.error("Error fetching search results:", error);
            alert("Failed to fetch search results. Please check the console.");
        });
}

function showPageData(title) {
    const pageApiUrl =
        "https://en.wikipedia.org/w/api.php" +
        "?action=query" +
        "&format=json" +
        "&prop=extracts" +
        "&explaintext=true" +
        "&titles=" + encodeURIComponent(title) +
        "&origin=*";

    fetch(pageApiUrl)
        .then(res => res.json())
        .then(data => {
            const page = Object.values(data.query.pages)[0];
            const text = page.extract || "";
            if (text) {
                calculateTopWords(text);
            } else {
                alert("This page has no text content to analyze.");
            }
        })
        .catch(error => {
            console.error("Error fetching page data:", error);
            alert("Failed to fetch page data. Please check the console.");
        });
}

function calculateTopWords(text) {
    const stopWords = new Set([
        // Common English stop words
        "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for",
        "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his",
        "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my",
        "one", "all", "would", "there", "their", "what", "so", "up", "out", "if",
        "about", "who", "get", "which", "go", "me", "when", "make", "can", "like",
        "time", "no", "just", "him", "know", "take", "people", "into", "year",
        "your", "good", "some", "could", "them", "see", "other", "than", "then",
        "now", "look", "only", "come", "its", "over", "think", "also", "back",
        "after", "use", "two", "how", "our", "work", "first", "well", "way",
        "even", "new", "want", "because", "any", "these", "give", "day", "most", "us"
    ]);

    const words = text
        .toLowerCase()
        .replace(/[^a-z\s]/g, "") // Remove non-alphabetic characters
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word));

    const freq = {};
    words.forEach(word => {
        freq[word] = (freq[word] || 0) + 1;
    });

    const topWords = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 150) // More words for a richer cloud
        .map(([word, count]) => [word, count]);

    generateWordCloud(topWords);
}

function generateWordCloud(wordData) {
    const canvas = document.getElementById("wordCloudCanvas");
    const wrapper = canvas.parentElement;

    // Resize canvas to container
    canvas.width = wrapper.offsetWidth;
    canvas.height = wrapper.offsetHeight;

    const colors = [
        '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF'
    ];

    WordCloud(canvas, {
        list: wordData,
        gridSize: Math.round(canvas.width / 80),
        weightFactor: size => size * 4,
        fontFamily: "Arial, sans-serif",
        backgroundColor: "black",
        rotateRatio: 0.3,
        rotationSteps: 2,
        minRotation: 0,
        maxRotation: Math.PI / 2,
        drawOutOfBound: false,
        shrinkToFit: true,
        color: () => colors[Math.floor(Math.random() * colors.length)]
    });
}

// Redraw word cloud on window resize
window.addEventListener('resize', () => {
    const canvas = document.getElementById('wordCloudCanvas');
    if (canvas && canvas.__wordcloud) {
        // Unfortunately, wordcloud2.js doesn't have a simple redraw/resize.
        // We can try to regenerate it if we stored the last data,
        // but for now, we'll just clear it. A better implementation
        // would store the last word list and re-run generateWordCloud.
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
});

document.getElementById("searchInput").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        searchWiki();
    }
});