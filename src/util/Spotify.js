const clientId = '223ff30cf27242aebfd7f8dff651ca20';
const redirectUri = 'http://localhost:3000/';

let accessToken;

const Spotify = {

   getAccessToken() {

    if(accessToken) {
      return accessToken;
    }
    
    const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
    const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

    if(accessTokenMatch && expiresInMatch) {
        accessToken = accessTokenMatch[1];
        const expiresIn = Number(expiresInMatch[1]);
        window.setTimeout(() => accessToken = '', expiresIn * 1000);
        window.history.pushState('Access Token', null, '/');
        return accessToken;

    } else {
        window.location.assign(`https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`);
   }},

   search(term) {
       const accessToken = Spotify.getAccessToken();
       const headers = {Authorization: `Bearer ${accessToken}`};
       return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, { 
           method: 'GET',
           headers: headers
         }
       ).then(response => {
           return response.json();
       }).then(jsonResponse => {
           if(!jsonResponse.tracks) {
               return [];
           } else {
               return jsonResponse.tracks.items.map(track => ({
                   track: track.id,
                   name: track.name,
                   artist: track.artists[0].name,
                   album: track.album.name,
                   uri: track.uri
               }));
           }
       });
   },

   savePlaylist(name, trackUris) {
       
       if(!name || !trackUris.length) {
           return;
       }
       const accessToken = Spotify.getAccessToken();
       const headers = {Authorization: `Bearer ${accessToken}`};

       return fetch('https://api.spotify.com/v1/me', 
        {
           headers: headers,
           method: 'GET'
        }
       ).then(response => response.json()
       ).then(jsonResponse => {
           const userId = jsonResponse.id;
           return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`,
           {
               headers: headers,
               method: 'POST',
               body: JSON.stringify({name: name})
           }
           ).then(response => response.json()
           ).then(jsonResponse => {
               const playlistId = jsonResponse.id;
               return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`, 
               {
                   headers: headers,
                   method: 'POST',
                   body: JSON.stringify({ uris: trackUris})
               }
            )
           })
       });
   }
};

export default Spotify;