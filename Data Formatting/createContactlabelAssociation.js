const hubspot = require("@hubspot/api-client");
const axios = require("axios");

const hubspotClient = new hubspot.Client({
  accessToken: process.env.APPKEY,
});

exports.main = async (event, callback) => {
  const objectId = event.inputFields["hs_object_id"];
  const email =
    event.inputFields["referring_individual_s_email_address"].trim();
  const firstname = event.inputFields["referring_individual_s_name"].trim();
  const lastname = event.inputFields["referring_individual_s_last_name"].trim();
  const headers = {
    Authorization: "Bearer " + process.env.APPKEY,
    "Content-Type": "application/json",
  };
  try {
    //get contact
    const searchObject = {
      filterGroups: [
        {
          filters: [
            {
              value: email,
              propertyName: "email",
              operator: "EQ",
            },
          ],
        },
      ],
      properties: ["email"],
      limit: 5,
    };

    const findContact = await hubspotClient.crm.contacts.searchApi.doSearch(
      searchObject
    );
    // console.log("Search Results:", findContact);

    //if no contact, create contact & associate to deal
    if (findContact.total == 0) {
      const properties = {
        email: email,
        firstname: firstname,
        lastname: lastname,
      };
      const createContact = await hubspotClient.crm.contacts.basicApi.create({
        properties,
      });
      const associateObjects =
        await hubspotClient.crm.deals.associationsApi.create(
          objectId,
          "contacts",
          createContact.id,
          [
            {
              associationCategory: "USER_DEFINED",
              associationTypeId: 19,
            },
          ]
        );
      const makeMarketingContact = await axios.post(
        "https://api.hubapi.com/automation/v2/workflows/43871337/enrollments/contacts/" +
          createContact.properties.email,
        undefined,
        { headers }
      );
      //     console.log("create Contact Results", createContact);
    } else {
      // if contact exists, associate deal to contact
      const contactId = findContact.results[0].id;

      const associateObjects =
        await hubspotClient.crm.deals.associationsApi.create(
          objectId,
          "contacts",
          contactId,
          [
            {
              associationCategory: "USER_DEFINED",
              associationTypeId: 19,
            },
          ]
        );
      const makeMarketingContact = await axios.post(
        "https://api.hubapi.com/automation/v2/workflows/43871337/enrollments/contacts/" +
          findContact.results[0].properties.email,
        undefined,
        { headers }
      );
      //console.log("create Association Results", createAssociation);
    }
  } catch (err) {
    console.error("Error:", err);
    // It will automatically retry when the code fails because of a rate limiting error from the HubSpot API.
    throw err;
  }
};
