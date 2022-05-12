const hubspot = require('@hubspot/api-client');

exports.main = async (event, callback) => {


  const hubspotClient = new hubspot.Client({
    apiKey: process.env.HAPI_KAY
  });



  const oldRenewalDate = event.inputFields['renewal_date'];
  const formattedDateTime = new Date(parseInt(oldRenewalDate)).toLocaleString();
  const splitDate = formattedDateTime.toString().split("/");
  const dateObject = {
   year : splitDate[2],
   day : splitDate[1],
   month : splitDate[0]
}
  
  const newDate = (data) => {
    let newDateObject = {}
    if (data.day >=16 && data.month != 12){
      newDateObject ={
        year: data.year,
        day : 1,
        month: parseInt(data.month) + 1
      } 
    } else if (data.day >=16 && data.month == 12){
      newDateObject ={
        year: parseInt(data.year) + 1,
        day : 1,
        month: 1
    } 
    } else { 
      newDateObject = {
        year: data.year,
        day : 15,
        month: data.month
      }  
  } 
  return newDateObject
}
  const rebuildDate = (param) => {
    return param.month + "/" + param.day + "/" + param.year
  }
  const newRenewalDate = rebuildDate(newDate(dateObject));
  const convertedToUnix = (new Date(newRenewalDate).getTime() / 1000).toFixed(0);	
  
  const dealObj = {
    id: event.object.objectId,
    properties: {
        renewal_date: convertedToUnix * 1000,
    }
  };
  
	try {
      const ApiResponse = await hubspotClient.crm.companies.batchApi.update( { inputs:[dealObj] });
    } catch (err) {
   console.error(err);
   throw err;
}

  callback({
    outputFields: {
      newRenewalDate: newRenewalDate,
    }
  });
}


