const axios = require("axios");
const APIKEY = process.env.HAPIKEY;

exports.main = async (event, callback) => {


  const lastUrlSeen = event.inputFields['hs_analytics_last_url'];
  const splitURL = lastUrlSeen.split("?");
  const trimmedURL = splitURL[0].split("/");
  const slug = trimmedURL[3];
  const URL = "https://api.hubapi.com/content/api/v2/pages?hapikey=" + APIKEY + "&slug=" + slug;
  
  axios.get(URL).then(r => {
      console.log(r.data.objects[0].title);
      const pageName = r.data.objects[0].title;
      callback({
    	outputFields: {
      		pageName: pageName,
    }
  });
    }).catch(error => {
      console.log(error);
    })
}
