const express = require('express');
const bodyParser = require('body-parser');
const supabaseClient = require('@supabase/supabase-js');
const dotenv = require('dotenv');

const app = express();
const port = process.env.PORT || 3000;
dotenv.config();

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseUrl && supabaseKey
  ? supabaseClient.createClient(supabaseUrl, supabaseKey)
  : null;

function requireSupabase(res) {
  if (!supabase) {
    res.status(500).json({
      error: 'Supabase is not configured. Add SUPABASE_URL and SUPABASE_KEY to your .env file and Vercel environment variables.'
    });
    return false;
  }
  return true;
}

function stripHtml(text) {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function pickTag(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match ? stripHtml(match[1]) : '';
}

function parseMedlineXml(xml) {
  const docs = [...xml.matchAll(/<document[\s\S]*?<\/document>/gi)].map((match) => match[0]);

  return docs.slice(0, 8).map((doc) => {
    const title = pickTag(doc, 'content');
    const urlMatch = doc.match(/url="([^"]+)"/i);
    const fullSummary = stripHtml(doc);
    const summary = fullSummary.replace(title, '').slice(0, 260);

    return {
      title: title || 'MedlinePlus Result',
      summary: summary || 'Open this result to learn more from MedlinePlus.',
      url: urlMatch ? urlMatch[1] : 'https://medlineplus.gov/'
    };
  });
}

app.get('/', (req, res) => {
  res.sendFile('public/index.html', { root: __dirname });
});

// External API endpoint: searches MedlinePlus through the backend
app.get('/api/health-search', async (req, res) => {
  const term = req.query.term;

  if (!term) {
    res.status(400).json({ error: 'A search term is required.' });
    return;
  }

  try {
    const medlineUrl = `https://wsearch.nlm.nih.gov/ws/query?db=healthTopics&term=${encodeURIComponent(term)}&retmax=8`;
    const response = await fetch(medlineUrl);
    const xml = await response.text();
    const results = parseMedlineXml(xml);

    res.json({ term, results });
  } catch (error) {
    console.error('MedlinePlus API error:', error);
    res.status(500).json({ error: 'Unable to search MedlinePlus right now.' });
  }
});

// Database read endpoint: gets recent searches from Supabase
app.get('/api/search-history', async (req, res) => {
  if (!requireSupabase(res)) return;

  const { data, error } = await supabase
    .from('search_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Supabase read error:', error);
    res.status(500).json({ error: 'Unable to load search history.' });
  } else {
    res.json(data);
  }
});

// Database write endpoint: saves a search to Supabase
app.post('/api/search-history', async (req, res) => {
  if (!requireSupabase(res)) return;

  const { search_term, result_count } = req.body;

  if (!search_term) {
    res.status(400).json({ error: 'search_term is required.' });
    return;
  }

  const { data, error } = await supabase
    .from('search_history')
    .insert({
      search_term,
      result_count: result_count || 0
    })
    .select();

  if (error) {
    console.error('Supabase write error:', error);
    res.status(500).json({ error: 'Unable to save search history.' });
  } else {
    res.json(data);
  }
});

app.listen(port, () => {
  console.log(`HealthInfo Finder is running on port ${port}`);
});
