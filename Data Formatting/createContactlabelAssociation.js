const hubspot = require("@hubspot/api-client");

const hubspotClient = new hubspot.Client({
  accessToken: process.env.APPKEY,
});

exports.main = async (event, callback) => {
  const objectId = event.inputFields["hs_object_id"];
  const email = event.inputFields[""].trim();
  const firstname = event.inputFields[""].trim();
  const lastname = event.inputFields[""].trim();
  const label = "Referrer";

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
    console.log("Search Results:", findContact);

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
      const createNewAssociation =
        await hubspotClient.crm.objects.associationsApi.create(
          "deal",
          objectId,
          "contact",
          createContact.id,
          "deal_to_contact"
        );
      // TODO: add association label here.
      //     console.log("create Contact Results", createContact);
    } else {
      // if contact exists, associate certification to contact
      const contactId = findContact.results[0].id;
      const createAssociation =
        await hubspotClient.crm.objects.associationsApi.create(
          "certification",
          objectId,
          "contact",
          contactId,
          "certification_to_contact"
        );
        // TODO: add association label here.
      //console.log("create Association Results", createAssociation);
    }
  } catch (err) {
    console.error("Error:", err);
    // It will automatically retry when the code fails because of a rate limiting error from the HubSpot API.
    throw err;
  }
};
