const hubspot = require("@hubspot/api-client");

const hubspotClient = new hubspot.Client({
  accessToken: process.env.APPKEY,
});

exports.main = async (event, callback) => {
  const objectId = event.inputFields["hs_object_id"];
  const email = event.inputFields["contact_email"].trim();
  const fullname = event.inputFields["contact_full_name"].trim().split(" ");
  


  try {
    //get contact
    const searchObject = { filterGroups: [{
        "filters":[{
            "value": email,
            "propertyName":"email",
            "operator":"EQ"
        }]
    }],
     properties: ["email"], 
     limit: 5
     };
  
    const findContact = await hubspotClient.crm.contacts.searchApi.doSearch(searchObject);
    console.log("Search Results:", findContact); 

     //if no contact, create contact & associate to certificate
     if (findContact.total == 0){
       const properties = {
          "email": email, 
          "firstname" : fullname[0],
          "lastname": fullname[1]
        };
        const createContact = await hubspotClient.crm.contacts.basicApi.create({ 
            properties
        });
       const createNewAssociation = await hubspotClient.crm.objects.associationsApi.create("certification", objectId, "contact", createContact.id, "certification_to_contact");
       //     console.log("create Contact Results", createContact);
        
       
     } else{
       
       // if contact exists, associate certification to contact
       const contactId = findContact.results[0].id;
       const createAssociation = await hubspotClient.crm.objects.associationsApi.create("certification", objectId, "contact", contactId, "certification_to_contact");
     	//console.log("create Association Results", createAssociation);
    
     }
  }
  catch (err) {
    console.error("Hit API rate limit. Will retry.", err);
    // It will automatically retry when the code fails because of a rate limiting error from the HubSpot API.
    throw err;
  } 
};
