const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5038"
  : "https://golf-league-scoretracker-backend.onrender.com";

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

export const data = fetch(API_URL + "/gets/allData")
  .then(response => response.json());
