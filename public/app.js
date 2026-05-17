const form = document.querySelector('#searchForm');
const input = document.querySelector('#searchInput');
const resultsDiv = document.querySelector('#results');
const historyList = document.querySelector('#historyList');
const quickButtons = document.querySelectorAll('.quick-buttons button');
let historyChart;

function cleanText(text) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = text || '';
  return tempDiv.textContent || tempDiv.innerText || '';
}

async function searchHealthTopic(term) {
  resultsDiv.innerHTML = '<p class="muted">Searching MedlinePlus...</p>';

  try {
    const response = await fetch(`/api/health-search?term=${encodeURIComponent(term)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Search failed.');
    }

    displayResults(data.results);

    await fetch('/api/search-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        search_term: term,
        result_count: data.results.length
      })
    });

    await loadSearchHistory();

    Swal.fire({
      title: 'Search Complete',
      text: `Found ${data.results.length} result(s) for "${term}".`,
      icon: 'success',
      timer: 1400,
      showConfirmButton: false
    });
  } catch (error) {
    resultsDiv.innerHTML = `<p class="muted">${error.message}</p>`;
    Swal.fire('Error', error.message, 'error');
  }
}

function displayResults(results) {
  if (!results || results.length === 0) {
    resultsDiv.innerHTML = '<p class="muted">No results found. Try a different search term.</p>';
    return;
  }

  resultsDiv.innerHTML = results.map((result) => `
    <article class="result-item">
      <h3>${cleanText(result.title)}</h3>
      <p>${cleanText(result.summary)}</p>
      <a class="button-link" href="${result.url}" target="_blank" rel="noopener">Learn More</a>
    </article>
  `).join('');
}

async function loadSearchHistory() {
  try {
    const response = await fetch('/api/search-history');
    const history = await response.json();

    if (!response.ok) {
      throw new Error(history.error || 'Could not load search history.');
    }

    displayHistory(history);
    drawChart(history);
  } catch (error) {
    historyList.innerHTML = `<p class="muted">${error.message}</p>`;
  }
}

function displayHistory(history) {
  if (!history || history.length === 0) {
    historyList.innerHTML = '<p class="muted">No searches saved yet.</p>';
    return;
  }

  historyList.innerHTML = history.map((item) => `
    <div class="history-pill">
      <span>${cleanText(item.search_term)}</span>
      <strong>${item.result_count}</strong>
    </div>
  `).join('');
}

function drawChart(history) {
  const canvas = document.querySelector('#historyChart');
  if (!canvas || !history || history.length === 0) return;

  const labels = history.map((item) => cleanText(item.search_term)).reverse();
  const values = history.map((item) => item.result_count).reverse();

  if (historyChart) {
    historyChart.destroy();
  }

  historyChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Results Found',
        data: values
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const term = input.value.trim();

  if (!term) {
    Swal.fire('Missing Search', 'Please enter a symptom or health topic.', 'warning');
    return;
  }

  searchHealthTopic(term);
});

quickButtons.forEach((button) => {
  button.addEventListener('click', () => {
    input.value = button.dataset.term;
    searchHealthTopic(button.dataset.term);
  });
});

loadSearchHistory();