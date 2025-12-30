const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5038"
  : "https://golf-league-scoretracker-backend.onrender.com";

export async function postNewGolfer(_data) {
  const urlPost = API_URL + '/posts/newGolfer';
  console.log('Posting to: ', urlPost, JSON.stringify(_data));
  const response = await fetch(urlPost, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(_data),
  });
  return response.json();
}

export async function postNewWeek(_data) {
  const urlPost = API_URL + '/posts/newWeek';
  console.log('Posting to: ', urlPost, _data);
  const response = await fetch(urlPost, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(_data),
  });
  return response.json();
}

export async function postRemoveWeek(_data) {
  const urlPost = API_URL + '/posts/removeWeek';
  console.log('Posting to: ', urlPost, _data);
  const response = await fetch(urlPost, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(_data),
  });
  return response.json();
}

export async function postUpdate(_data) {
  const urlPost = API_URL + '/posts/update';
  console.log('Posting to: ', urlPost, _data);
  const response = await fetch(urlPost, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(_data),
  });
  return response.json();
}

export async function getGolferStats(golfer, startYear, startWeek, endYear, endWeek) {
  const params = new URLSearchParams();
  if (startYear) params.append('startYear', startYear);
  if (startWeek) params.append('startWeek', startWeek);
  if (endYear) params.append('endYear', endYear);
  if (endWeek) params.append('endWeek', endWeek);

  const url = `${API_URL}/gets/stats/${encodeURIComponent(golfer)}?${params.toString()}`;
  const response = await fetch(url);
  return response.json();
}

export async function getLeagueStats(year, week) {
  const url = `${API_URL}/gets/leagueStats/${year}/${week}`;
  const response = await fetch(url);
  return response.json();
}

export async function getMetadata() {
  const url = `${API_URL}/gets/metadata`;
  const response = await fetch(url);
  return response.json();
}

export async function getAllData() {
  const response = await fetch(API_URL + "/gets/allData");
  return response.json();
}
