const response = await fetch(
  'https://discord.com/api/v9/applications/APP_ID/users/USER_ID/identities/RANDOM_NUMBER/profile',
  {
    method: 'PUT', // or POST/PATCH depending on what the endpoint expects
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bot YOUR_BOT_TOKEN', // or 'Bearer USER_TOKEN'
    },
    body: JSON.stringify({
      data: {
        dynamic: [
          {
            type: 1,
            name: "name",
            value: "kz6v"
          },
          {
            type: 1,
            name: "itte",
            value: "j"
          }
        ]
      }
    }),
  }
);

const data = await response.json();
console.log(data);
