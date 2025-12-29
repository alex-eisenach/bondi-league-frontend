const API_URL = "http://localhost:5038";
//const API_URL = "https://golf-league-scoretracker-backend.onrender.com";

export async function postNewGolfer(_data) {
  const urlPost = API_URL + '/posts/newGolfer';
  console.log('Posting to: ', urlPost, JSON.stringify(_data));
  const response = await fetch(urlPost, {
    method: "POST",
    headers: { "content-type": "application/json", },
    body: JSON.stringify(_data),
  });
  return response.json();
}

export async function postNewWeek(_data) {
  const urlPost = API_URL + '/posts/newWeek';
  console.log('Posting to: ', urlPost, _data);
  const response = await fetch(urlPost, {
    method: "POST",
    headers: { "content-type": "application/json", },
    body: JSON.stringify(_data),
  });
  return response.json();
}

export async function postRemoveWeek(_data) {
  const urlPost = API_URL + '/posts/removeWeek';
  console.log('Posting to: ', urlPost, _data);
  const response = await fetch(urlPost, {
    method: "POST",
    headers: { "content-type": "application/json", },
    body: JSON.stringify(_data),
  });
  return response.json();
}

export async function postUpdate(_data) {
  const urlPost = API_URL + '/posts/update';
  console.log('Posting to: ', urlPost, _data);
  const response = await fetch(urlPost, {
    method: "POST",
    headers: { "content-type": "application/json", },
    body: JSON.stringify(_data),
  });
  return response.json();
}

export async function getGolferStats(golfer) {
  const url = `${API_URL}/gets/stats/${encodeURIComponent(golfer)}`;
  const response = await fetch(url);
  return response.json();
}

export async function getLeagueStats(year, week) {
  const url = `${API_URL}/gets/leagueStats/${year}/${week}`;
  const response = await fetch(url);
  return response.json();
}

export const data = fetch(API_URL + "/gets/allData")
  .then(response => response.json());
