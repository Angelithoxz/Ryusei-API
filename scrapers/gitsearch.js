const fetch = require('node-fetch');

const GITHUB_TOKEN = '[TOKEN_ELIMINADO]';

async function searchGit(query, perPage = 5, page = 1) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'User-Agent': 'GithubRepoSearcher',
        'Accept': 'application/vnd.github+json'
      }
    });
    if (!res.ok) {
      throw new Error(`Error: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return data.items.map(repo => ({
      nombre: repo.full_name,
      descripcion: repo.description,
      lenguaje: repo.language,
      estrellas: repo.stargazers_count,
      forks: repo.forks_count,
      url: repo.html_url,
      creado: repo.created_at,
      actualizado: repo.updated_at
    }));
  } catch (err) {
    console.error('Hubo un error al buscar:', err.message);
    return [];
  }
}
module.exports = { searchGit }