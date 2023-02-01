const hubspot = require("@hubspot/api-client");

const hubspotClient = new hubspot.Client({
  accessToken: process.env.TOKEN,
});

exports.main = async (event, callback) => {
  const companyId = event.inputFields["hs_object_id"];
  const name = event.inputFields["name"].trim();

  try {
    const orginalAssociatedContacts =
      await hubspotClient.crm.companies.associationsApi.getAll(
        companyId,
        "contacts",
        undefined,
        5
      );
    let originalDomain = "";

    if (orginalAssociatedContacts.results) {
      const originalFirstContactId =
        orginalAssociatedContacts.results[0].toObjectId;

      const originalContactDomain =
        await hubspotClient.crm.contacts.basicApi.getById(
          originalFirstContactId,
          ["hs_email_domain"],
          undefined,
          undefined,
          false
        );

      originalDomain = originalContactDomain.properties.hs_email_domain;
    }
    const searchResults = await hubspotClient.crm.companies.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            {
              propertyName: "name",
              operator: "EQ",
              value: name,
            },
          ],
        },
      ],
      limit: 30,
    });

    // Get the contacts associated with the companies
    // console.log(`there are ${searchResults.total} total  and ${searchResults.results.length} results`);
    var companiesToMerge = [];
    for (let i = 0; i < searchResults.results.length; i++) {
      const currentCompany = searchResults.results[i];
      if (currentCompany.id !== companyId) {
        const associatedContacts =
          await hubspotClient.crm.companies.associationsApi.getAll(
            currentCompany.id,
            "contacts",
            undefined,
            5
          );
        if (associatedContacts.results.length > 0) {
          const firstContact = associatedContacts.results[0].toObjectId;
          const contactDomain =
            await hubspotClient.crm.contacts.basicApi.getById(
              firstContact,
              ["hs_email_domain"],
              undefined,
              undefined,
              false
            );

          companiesToMerge.push({
            company: currentCompany.properties.name,
            id: currentCompany.id,
            domain: contactDomain.properties.hs_email_domain,
          });
        } else {
          companiesToMerge.push({
            company: currentCompany.properties.name,
            id: currentCompany.id,
            domain: null,
          });
        }
      }
    }
    console.log(`there are ${companiesToMerge.length} with matching names.`);

    // Compare the company name and contact's domain name to the original company and contact
    if (companiesToMerge.length > 0) {
      for (let i = 0; i < companiesToMerge.length; i++) {
        const currentCompany = companiesToMerge[i];

        console.log(currentCompany.company, currentCompany.domain);
        // console.log("Does the name match? - ", name == currentCompany.company, "Does the domains match? - ", originalDomain == currentCompany.domain);
        if (
          name == currentCompany.company &&
          originalDomain == currentCompany.domain
        ) {
          // Merge companies that have the same name and associated contact's domain name
          await hubspotClient.crm.companies.publicObjectApi.merge({
            primaryObjectId: companyId,
            objectIdToMerge: currentCompany.id,
          });
          console.log(
            currentCompany.id,
            "has been merged into the original company."
          );
          break;
        } else {
          console.log("Not a match, companies not merged");
        }
      }
    } else {
      console.log("No Companies to merge.");
    }
  } catch (err) {
    console.error("Hit API rate limit. Will retry.", err);
    // It will automatically retry when the code fails because of a rate limiting error from the HubSpot API.
    throw err;
  }
};
