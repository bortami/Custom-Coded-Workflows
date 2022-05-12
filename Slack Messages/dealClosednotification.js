const axios = require('axios')

exports.main = (event, callback) => {

  const dealName = event.inputFields['dealname'];
  const portalID = PORTAL_ID
  const dealID = event.inputFields['hs_object_id'];
  const dealPipeline = event.inputFields['pipeline'];

  const headers = {
    'Content-Type': 'application/json'
  };

  const slackWebhookURL = SLACK_URL;
  const requestBody = {
      "blocks": [
        {
          "type": "header",
          "text": {
            "type": "plain_text",
            "text": "New Deal Closed",
            "emoji": true
          }
        },
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": `*Name:*\n ${dealName}`
            },
            {
              "type": "mrkdwn",
              "text": `*Pipleine:*\n ${dealPipeline}`
            }
          ]
        },
        {
          "type": "section",
            "fields": [
               {
                "type": "mrkdwn",
                "text": `<https://app.hubspot.com/contacts/${portalID}/deal/${dealID}/|View in HubSpot>`,
               }
            ]
        }
      ]
    }
 


  axios
    .post(
      slackWebhookURL,
      requestBody,
      { headers }
    )
    .then(response => {
      console.log(`Response from Slack: ${response.body}`);
    });
};